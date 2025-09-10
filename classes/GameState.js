/**
 * Clicker Pawry - Game State Management
 * Handles the main game state machine: LOBBY → DRAFT → FIGHT → etc.
 */

// Game state constants
const GAME_STATES = {
  LOBBY: "lobby", // Meta upgrade shop
  DRAFT: "draft", // Skill selection between fights
  FIGHT: "fight", // Combat with enemy
  VICTORY: "victory", // Brief victory screen before next draft
  DEFEAT: "defeat", // Death/run end screen
  ENDLESS: "endless", // Endless mode (floor 13+)
};

// Game state transitions according to GDD
const STATE_TRANSITIONS = {
  [GAME_STATES.LOBBY]: [GAME_STATES.DRAFT],
  [GAME_STATES.DRAFT]: [GAME_STATES.FIGHT],
  [GAME_STATES.FIGHT]: [GAME_STATES.VICTORY, GAME_STATES.DEFEAT],
  [GAME_STATES.VICTORY]: [GAME_STATES.DRAFT, GAME_STATES.ENDLESS],
  [GAME_STATES.DEFEAT]: [GAME_STATES.LOBBY],
  [GAME_STATES.ENDLESS]: [GAME_STATES.ENDLESS, GAME_STATES.DEFEAT], // Loops or dies
};

// Draft data structure
class DraftChoice {
  constructor(skillId, isLevelUp = false) {
    this.skillId = skillId;
    this.isLevelUp = isLevelUp;
    this.skill = null; // Will be populated with skill data
  }
}

// Main game state manager
class GameState {
  constructor() {
    this.currentState = GAME_STATES.LOBBY;
    this.player = null; // Will be set by game initialization
    this.currentEnemy = null;
    this.rings = []; // Active rings during combat

    // Draft state
    this.draftChoices = []; // Array of 3 DraftChoice objects
    this.rerollCost = 5; // Gold cost for reroll
    this.rerollsThisFloor = 0;

    // Combat state
    this.combatStartTime = 0;
    this.lastUpdateTime = 0;

    // Parry timing windows (in ms)
    this.parryWindows = {
      perfect: 80, // ±80ms for perfect parry
      good: 160, // ±160ms for good parry
    };

    // Events and callbacks
    this.eventListeners = new Map();
  }

  // State management
  canTransitionTo(newState) {
    const allowedTransitions = STATE_TRANSITIONS[this.currentState] || [];
    return allowedTransitions.includes(newState);
  }

  transitionTo(newState) {
    if (!this.canTransitionTo(newState)) {
      console.error(
        `Invalid transition from ${this.currentState} to ${newState}`
      );
      return false;
    }

    const oldState = this.currentState;
    this.currentState = newState;

    // Handle state entry
    this.onStateEnter(newState, oldState);

    // Emit state change event
    this.emit("stateChanged", { from: oldState, to: newState });

    return true;
  }

  onStateEnter(newState, oldState) {
    switch (newState) {
      case GAME_STATES.LOBBY:
        this.enterLobby();
        break;
      case GAME_STATES.DRAFT:
        this.enterDraft();
        break;
      case GAME_STATES.FIGHT:
        this.enterFight();
        break;
      case GAME_STATES.VICTORY:
        this.enterVictory();
        break;
      case GAME_STATES.DEFEAT:
        this.enterDefeat();
        break;
      case GAME_STATES.ENDLESS:
        this.enterEndless();
        break;
    }
  }

  // State handlers
  enterLobby() {
    // Player can spend gold on meta upgrades
    // Reset run state if coming from defeat
    this.currentEnemy = null;
    this.rings = [];
    this.rerollsThisFloor = 0;
  }

  enterDraft() {
    // Generate 3 skill choices
    this.generateDraftChoices();
    this.rerollsThisFloor = 0;
    this.updateRerollCost();
  }

  enterFight() {
    // Create enemy for current floor
    this.createEnemyForFloor();
    this.player.prepareFight();
    this.rings = [];
    this.combatStartTime = Date.now();
    this.lastUpdateTime = this.combatStartTime;
  }

  enterVictory() {
    // Calculate and award gold
    const goldEarned = this.calculateGoldReward();
    const finalGold = this.player.addGold(goldEarned);

    // Apply victory healing
    this.player.victoryHeal();

    // Advance floor
    this.player.currentFloor++;

    // Emit victory event
    this.emit("victory", {
      goldEarned: finalGold,
      floor: this.player.currentFloor - 1,
      perfectParries: this.player.perfectParries,
    });

    // Check if entering endless mode
    if (this.player.currentFloor > 12) {
      setTimeout(() => this.transitionTo(GAME_STATES.ENDLESS), 2000);
    } else {
      setTimeout(() => this.transitionTo(GAME_STATES.DRAFT), 2000);
    }
  }

  enterDefeat() {
    // Save persistent data
    this.player.saveToLocalStorage();

    // Emit defeat event
    this.emit("defeat", {
      floor: this.player.currentFloor,
      goldEarned: this.player.gold,
    });
  }

  enterEndless() {
    // Endless mode - go straight to next fight
    setTimeout(() => this.transitionTo(GAME_STATES.FIGHT), 1000);
  }

  // Draft system
  generateDraftChoices() {
    this.draftChoices = [];
    const availableSkills = this.getAvailableSkills();

    // Select 3 random skills
    for (let i = 0; i < 3; i++) {
      const skillId = this.selectRandomSkill(availableSkills);
      const isLevelUp = this.player.skills.some((s) => s.id === skillId);

      const choice = new DraftChoice(skillId, isLevelUp);
      choice.skill = createSkill(skillId); // From Skills.js

      this.draftChoices.push(choice);
    }
  }

  getAvailableSkills() {
    // Get all skills that aren't maxed out
    const allSkills = getAllSkillIds(); // From Skills.js
    return allSkills.filter((skillId) => {
      const existingSkill = this.player.skills.find((s) => s.id === skillId);
      return !existingSkill || !existingSkill.isMaxLevel();
    });
  }

  selectRandomSkill(availableSkills) {
    const randomIndex = Math.floor(Math.random() * availableSkills.length);
    return availableSkills[randomIndex];
  }

  selectDraftChoice(choiceIndex) {
    if (choiceIndex < 0 || choiceIndex >= this.draftChoices.length) {
      return false;
    }

    const choice = this.draftChoices[choiceIndex];
    const skill = createSkill(choice.skillId); // From Skills.js

    if (this.player.addSkill(skill)) {
      this.transitionTo(GAME_STATES.FIGHT);
      return true;
    }

    return false;
  }

  canReroll() {
    const goldCost = this.getRerollCost();
    const freeRerolls =
      this.player.getAvailableRerolls() - this.rerollsThisFloor;

    return freeRerolls > 0 || this.player.gold >= goldCost;
  }

  getRerollCost() {
    const freeRerolls =
      this.player.getAvailableRerolls() - this.rerollsThisFloor;
    if (freeRerolls > 0) return 0;

    return this.rerollCost;
  }

  rerollDraft() {
    if (!this.canReroll()) return false;

    const cost = this.getRerollCost();
    if (cost > 0) {
      this.player.gold -= cost;
    }

    this.rerollsThisFloor++;
    this.updateRerollCost();
    this.generateDraftChoices();

    return true;
  }

  updateRerollCost() {
    // Escalating cost: 5 → 8 → 12 → ...
    const paidRerolls = Math.max(
      0,
      this.rerollsThisFloor - this.player.getAvailableRerolls()
    );
    this.rerollCost = 5 + paidRerolls * 3;
  }

  // Combat system
  createEnemyForFloor() {
    const floor = this.player.currentFloor;
    let archetype,
      isUltimate = false;

    if ([3, 6, 9, 12].includes(floor)) {
      // Major boss
      archetype = getMajorBossArchetype(floor); // From Enemies.js
      isUltimate = true;
    } else {
      // Miniboss - random from available archetypes
      const available = getAvailableMinibossArchetypes(floor); // From Enemies.js
      archetype = available[Math.floor(Math.random() * available.length)];
    }

    this.currentEnemy = createEnemy(archetype, floor, isUltimate); // From Enemies.js
  }

  update(deltaTime) {
    if (this.currentState !== GAME_STATES.FIGHT) return;

    const currentTime = Date.now();

    // Update player
    this.player.update(deltaTime);

    // Update enemy
    if (this.currentEnemy) {
      this.currentEnemy.update(deltaTime, currentTime);

      // Check for new rings
      if (this.currentEnemy.ringQueue.length > 0) {
        this.rings.push(...this.currentEnemy.ringQueue);
        this.currentEnemy.ringQueue = [];
      }

      // Check if enemy is defeated
      if (this.currentEnemy.isDefeated) {
        this.transitionTo(GAME_STATES.VICTORY);
        return;
      }
    }

    // Update rings
    this.updateRings(currentTime);

    this.lastUpdateTime = currentTime;
  }

  updateRings(currentTime) {
    this.rings = this.rings.filter((ring) => {
      if (!ring.isActive) return false;

      const elapsed = currentTime - ring.spawnTime;

      // Check if ring has reached target (impact)
      if (elapsed >= ring.duration) {
        this.handleRingImpact(ring);
        return false;
      }

      return true;
    });
  }

  handleRingImpact(ring) {
    if (ring.wasParried) return;

    // Ring hit the player
    if (ring.type === RING_TYPES.RED) {
      // Red rings must be parried
      this.player.takeDamage(ring.damage);
    } else if (ring.type === RING_TYPES.WHITE) {
      // White rings deal damage if not parried
      this.player.takeDamage(ring.damage);
    }
    // Blue rings don't deal damage on impact (only during punish window)

    // Check if player died
    if (this.player.hp <= 0) {
      this.transitionTo(GAME_STATES.DEFEAT);
    }
  }

  // Input handling
  handleClick(x, y, currentTime) {
    if (this.currentState !== GAME_STATES.FIGHT) return;

    // Check for parry first (priority)
    const parryResult = this.checkParry(currentTime);
    if (parryResult) {
      return; // Consumed by parry
    }

    // Check if clicking on enemy for attack
    if (this.isClickOnEnemy(x, y)) {
      this.handleAttack();
    }
  }

  checkParry(currentTime) {
    // Find the most imminent ring
    let nearestRing = null;
    let nearestTime = Infinity;

    for (const ring of this.rings) {
      if (!ring.isActive || ring.wasParried) continue;

      const impactTime = ring.spawnTime + ring.duration;
      const timeTillImpact = impactTime - currentTime;

      if (
        timeTillImpact < nearestTime &&
        timeTillImpact > -this.parryWindows.good
      ) {
        nearestTime = timeTillImpact;
        nearestRing = ring;
      }
    }

    if (!nearestRing) return null;

    // Check parry timing
    const timingError = Math.abs(nearestTime);

    if (timingError <= this.parryWindows.perfect) {
      return this.handlePerfectParry(nearestRing);
    } else if (timingError <= this.parryWindows.good) {
      return this.handleGoodParry(nearestRing);
    }

    return null;
  }

  handlePerfectParry(ring) {
    ring.wasParried = true;
    this.player.perfectParries++;

    // Counter attack for 2x damage
    const counterDamage = this.player.calculateDamage() * 2;
    this.currentEnemy.takeDamage(counterDamage);

    this.emit("parry", { type: "perfect", damage: counterDamage, ring });
    return { type: "perfect", damage: counterDamage };
  }

  handleGoodParry(ring) {
    ring.wasParried = true;

    this.emit("parry", { type: "good", ring });
    return { type: "good" };
  }

  handleAttack() {
    if (!this.player.canAttack()) return;

    // Check for blue ring punish window
    const punishRing = this.checkBluePunish();
    if (punishRing) {
      this.player.takeDamage(1); // Take punish damage
      this.emit("punish", { ring: punishRing });
      return;
    }

    if (this.player.attack()) {
      const damage = this.player.calculateDamage();
      this.currentEnemy.takeDamage(damage);

      this.emit("attack", { damage });
    }
  }

  checkBluePunish() {
    const currentTime = Date.now();

    for (const ring of this.rings) {
      if (ring.type !== RING_TYPES.BLUE || !ring.isActive) continue;

      const elapsed = currentTime - ring.spawnTime;
      const punishWindow =
        this.currentEnemy.data.ringTimings[RING_TYPES.BLUE]?.punishWindow ||
        200;

      if (elapsed <= punishWindow) {
        return ring;
      }
    }

    return null;
  }

  isClickOnEnemy(x, y) {
    // Simple circular hit detection - implement based on actual enemy position/size
    // This would be refined in the actual render system
    return true; // Placeholder
  }

  calculateGoldReward() {
    const floor = this.player.currentFloor;
    const isMajor = this.currentEnemy.isMajorBoss();

    // Base gold from GDD
    let baseGold = isMajor ? 20 + Math.random() * 10 : 8 + Math.random() * 4;
    baseGold = Math.floor(baseGold);

    // Endless scaling
    if (floor > 12) {
      const endlessLevel = floor - 12;
      baseGold = Math.floor(baseGold * (1 + 0.1 * endlessLevel));
    }

    return baseGold;
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Save/Load
  saveRunState() {
    // Save current run progress (skills, floor, etc.)
    const runData = {
      currentFloor: this.player.currentFloor,
      skills: this.player.skills.map((skill) => ({
        id: skill.id,
        level: skill.currentLevel,
      })),
      hp: this.player.hp,
      // Add other run state as needed
    };

    localStorage.setItem("js13k25_clickerpawry_run", JSON.stringify(runData));
  }

  loadRunState() {
    const runData = localStorage.getItem("js13k25_clickerpawry_run");
    if (!runData) return false;

    try {
      const data = JSON.parse(runData);
      this.player.currentFloor = data.currentFloor;
      this.player.hp = data.hp;

      // Restore skills
      this.player.skills = [];
      if (data.skills) {
        for (const skillData of data.skills) {
          const skill = createSkill(skillData.id);
          skill.currentLevel = skillData.level;
          this.player.skills.push(skill);
        }
      }

      return true;
    } catch (e) {
      console.error("Failed to load run state:", e);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    GameState,
    GAME_STATES,
    DraftChoice,
  };
}
