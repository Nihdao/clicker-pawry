/**
 * Clicker Pawry - Main game implementation
 * Complete game loop with all scenes: LOBBY → DRAFT → FIGHT → etc.
 */

// Game instance
let game = null;
let canvas = null;
let ctx = null;
let lastTime = 0;

// Cat assets
const catAssets = {
  happy: new Image(),
  sad: new Image(),
  loaded: false,
};

// Game initialization
function initGame() {
  console.log("Clicker Pawry - Game engine loading...");

  // Get canvas and setup
  canvas = document.getElementById("cv");
  ctx = canvas.getContext("2d");

  // Setup portrait ratio canvas
  setupCanvas();

  // Load cat assets
  loadAssets();

  // Create game instance
  game = new GameEngine();

  // Auto-start the game (will load from localStorage if available)
  game.startGame();

  // Start game loop
  requestAnimationFrame(gameLoop);
}

// Setup canvas with full height and padding
function setupCanvas() {
  const maxWidth = Math.min(window.innerWidth, 400);
  const maxHeight = window.innerHeight;
  const padding = 20; // Top and bottom padding

  // Full height canvas with padding
  let width = maxWidth;
  let height = maxHeight - padding * 2; // Subtract top and bottom padding

  // Maintain reasonable width if too wide
  if (width > 400) {
    width = 400;
  }

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  // Center canvas with padding
  canvas.style.display = "block";
  canvas.style.margin = `${padding}px auto 0`; // Top padding, center horizontally, no bottom margin

  // Disable image smoothing for pixel-perfect look
  ctx.imageSmoothingEnabled = false;
}

// Utility function to scale font sizes for better readability
function getScaledFont(size, weight = "normal") {
  const scaledSize = Math.round(size * Constants.FONT_SCALE);
  return weight === "bold"
    ? `bold ${scaledSize}px Arial, "Helvetica Neue", Helvetica, sans-serif`
    : `${scaledSize}px Arial, "Helvetica Neue", Helvetica, sans-serif`;
}

// Load cat assets
function loadAssets() {
  let loaded = 0;
  const total = 2;

  function checkLoaded() {
    loaded++;
    if (loaded === total) {
      catAssets.loaded = true;
      console.log("Cat assets loaded successfully");
    }
  }

  catAssets.happy.onload = checkLoaded;
  catAssets.sad.onload = checkLoaded;

  catAssets.happy.src = "assets/catHappy.png";
  catAssets.sad.src = "assets/catLow.png";
}

// Game constants are now imported from constants.js
// Access constants from global namespace
const Constants = window.ClickerPawryConstants;

// Real Player class implementation
class Player {
  constructor() {
    this.hp = Constants.PLAYER_BASE_STATS.MAX_HP;
    this.maxHp = Constants.PLAYER_BASE_STATS.MAX_HP;
    this.stamina = Constants.PLAYER_BASE_STATS.MAX_STAMINA;
    this.maxStamina = Constants.PLAYER_BASE_STATS.MAX_STAMINA;
    this.staminaRegen = Constants.PLAYER_BASE_STATS.BASE_STAMINA_REGEN;
    this.baseDamage = Constants.PLAYER_BASE_STATS.BASE_DAMAGE;

    // Persistent data
    this.gold = 0;
    this.highestFloor = 0;
    this.metaUpgrades = {
      MAX_STAMINA: 0,
      STAMINA_REGEN: 0,
      ATTACK_POWER: 0,
    };

    // Run data
    this.currentFloor = 1;
    this.skills = [];
    this.perfectParries = 0;
    this.rerollsUsed = 0;

    // Combat state
    this.lastStaminaUpdate = Date.now();
    this.staminaExhaustTime = 0;

    this.loadFromLocalStorage();
  }

  startNewRun() {
    // Update stats based on meta-upgrades
    this.maxStamina = this.getMaxStamina();
    this.staminaRegen = this.getStaminaRegen();
    this.baseDamage = this.getBaseDamage();

    // Reset run-specific data
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.currentFloor = 1;
    this.skills = [];
    this.perfectParries = 0;
    this.rerollsUsed = 0;
    this.lastStaminaUpdate = Date.now();
    this.staminaExhaustTime = 0;

    this.saveRunState();
  }

  applyMetaUpgrades() {
    // Apply meta upgrades to base stats using new calculation methods
    this.maxStamina = this.getMaxStamina();
    this.staminaRegen = this.getStaminaRegen();
    this.baseDamage = this.getBaseDamage();

    // Ensure stamina doesn't exceed new max
    if (this.stamina > this.maxStamina) {
      this.stamina = this.maxStamina;
    }
  }

  update(deltaTime) {
    // Update stamina regeneration
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastStaminaUpdate;
    this.lastStaminaUpdate = currentTime;

    // Check if exhausted (stamina hit 0)
    if (this.stamina <= 0 && this.staminaExhaustTime === 0) {
      this.staminaExhaustTime = currentTime;
    }

    // Regenerate stamina after exhaust period
    if (this.stamina < this.maxStamina) {
      const exhaustPeriod = 750; // 0.75s exhaust time
      if (
        this.staminaExhaustTime === 0 ||
        currentTime - this.staminaExhaustTime > exhaustPeriod
      ) {
        const regenAmount = (this.staminaRegen * timeDelta) / 1000;
        this.stamina = Math.min(this.maxStamina, this.stamina + regenAmount);

        // Clear exhaust time if stamina is regenerating
        if (this.staminaExhaustTime > 0) {
          this.staminaExhaustTime = 0;
        }
      }
    }
  }

  canAttack() {
    return this.stamina >= 1;
  }

  attack() {
    if (this.canAttack()) {
      this.stamina = Math.max(0, this.stamina - 1);
      return this.baseDamage;
    }
    return 0;
  }

  takeDamage(amount, gameEngine = null) {
    this.hp = Math.max(0, this.hp - amount);

    // Trigger damage effects if gameEngine is provided
    if (gameEngine && amount > 0) {
      gameEngine.triggerDamageEffects();
    }

    return this.hp <= 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addGold(amount) {
    this.gold += amount;
    this.saveToLocalStorage();
  }

  addSkill(skillId, isLevelUp = false) {
    if (isLevelUp) {
      // Find existing skill and level it up
      const existingSkill = this.skills.find((s) => s.id === skillId);
      if (existingSkill && existingSkill.level < 4) {
        existingSkill.level++;
      }
    } else {
      // Add new skill if we have space
      if (this.skills.length < 3) {
        this.skills.push({
          id: skillId,
          level: 1,
          type: "active", // Default type since skills system is removed
          cooldownRemaining: 0,
        });
      }
    }
    this.saveRunState();
  }

  // Meta-progression stat calculations
  getMaxStamina() {
    return (
      Constants.PLAYER_BASE_STATS.MAX_STAMINA +
      Constants.META_UPGRADES.MAX_STAMINA.effect(this.metaUpgrades.MAX_STAMINA)
    );
  }

  getStaminaRegen() {
    return (
      Constants.PLAYER_BASE_STATS.BASE_STAMINA_REGEN +
      Constants.META_UPGRADES.STAMINA_REGEN.effect(
        this.metaUpgrades.STAMINA_REGEN
      )
    );
  }

  getBaseDamage() {
    return (
      Constants.PLAYER_BASE_STATS.BASE_DAMAGE +
      Constants.META_UPGRADES.ATTACK_POWER.effect(
        this.metaUpgrades.ATTACK_POWER
      )
    );
  }

  canAffordUpgrade(upgradeKey) {
    const upgrade = Constants.META_UPGRADES[upgradeKey];
    const currentLevel = this.metaUpgrades[upgradeKey];
    if (currentLevel >= upgrade.maxLevel) return false;
    const cost = upgrade.costs[currentLevel];
    return this.gold >= cost;
  }

  buyUpgrade(upgradeKey) {
    if (!this.canAffordUpgrade(upgradeKey)) return false;

    const upgrade = Constants.META_UPGRADES[upgradeKey];
    const currentLevel = this.metaUpgrades[upgradeKey];
    const cost = upgrade.costs[currentLevel];

    this.gold -= cost;
    this.metaUpgrades[upgradeKey]++;

    // Update current stats
    this.maxStamina = this.getMaxStamina();
    this.staminaRegen = this.getStaminaRegen();
    this.baseDamage = this.getBaseDamage();

    this.saveToLocalStorage();
    return true;
  }

  saveToLocalStorage() {
    try {
      const persistentData = {
        gold: this.gold,
        metaUpgrades: this.metaUpgrades,
        highestFloor: this.highestFloor || 0,
      };
      localStorage.setItem(
        Constants.SAVE_KEYS.PERSISTENT_DATA,
        JSON.stringify(persistentData)
      );
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  saveRunState() {
    try {
      const runData = {
        currentFloor: this.currentFloor,
        hp: this.hp,
        stamina: this.stamina,
        skills: this.skills,
        perfectParries: this.perfectParries,
        rerollsUsed: this.rerollsUsed,
      };
      localStorage.setItem(
        Constants.SAVE_KEYS.RUN_DATA,
        JSON.stringify(runData)
      );
    } catch (e) {
      console.warn("Could not save run state:", e);
    }
  }

  loadFromLocalStorage() {
    try {
      // Load persistent data
      const persistentData = localStorage.getItem(
        Constants.SAVE_KEYS.PERSISTENT_DATA
      );
      if (persistentData) {
        const data = JSON.parse(persistentData);
        this.gold = data.gold || 0;
        this.highestFloor = data.highestFloor || 0;
        this.metaUpgrades = { ...this.metaUpgrades, ...data.metaUpgrades };
        this.applyMetaUpgrades();
        return true;
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return false;
  }

  loadRunState() {
    try {
      const runData = localStorage.getItem(Constants.SAVE_KEYS.RUN_DATA);
      if (runData) {
        const data = JSON.parse(runData);
        this.currentFloor = data.currentFloor || 1;
        this.hp = data.hp || this.maxHp;
        this.stamina = data.stamina || this.maxStamina;
        this.skills = data.skills || [];
        this.perfectParries = data.perfectParries || 0;
        this.rerollsUsed = data.rerollsUsed || 0;
        return true;
      }
    } catch (e) {
      console.warn("Could not load run state:", e);
    }
    return false;
  }
}

// Ring and enemy constants are now imported from constants.js

// Paw effect class for click feedback
class PawEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = 400; // 400ms duration
    this.maxLife = 400;
    this.scale = 0;
    this.maxScale = 2.0;
  }

  update(deltaTime) {
    this.life -= deltaTime;

    // Scale animation: grow then shrink
    const progress = 1 - this.life / this.maxLife;
    if (progress < 0.3) {
      // Growing phase
      this.scale = (progress / 0.3) * this.maxScale;
    } else {
      // Shrinking phase
      const shrinkProgress = (progress - 0.3) / 0.7;
      this.scale = this.maxScale * (1 - shrinkProgress);
    }

    return this.life > 0;
  }

  draw(ctx) {
    if (this.scale <= 0) return;

    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    // Draw paw shape (simplified)
    this.drawPaw(ctx);

    ctx.restore();
  }

  drawPaw(ctx) {
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;

    // Main pad (oval)
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Toe pads (4 small circles)
    const toePositions = [
      { x: -8, y: -10 },
      { x: -3, y: -12 },
      { x: 3, y: -12 },
      { x: 8, y: -10 },
    ];

    toePositions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
}

// Particle class for visual effects
class Particle {
  constructor(x, y, color, velocity, size, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocity = velocity; // {x, y}
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.gravity = 0.1;
  }

  update(deltaTime) {
    this.x += (this.velocity.x * deltaTime) / 16; // Normalize to 60fps
    this.y += (this.velocity.y * deltaTime) / 16;
    this.velocity.y += this.gravity;
    this.life -= deltaTime;

    // Fade out
    const alpha = this.life / this.maxLife;
    return alpha > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Ring class for parry system
class Ring {
  constructor(type, spawnTime, duration, startRadius = 60, targetRadius = 30) {
    this.type = type; // W, B, R
    this.spawnTime = spawnTime;
    this.duration = duration;
    this.startRadius = startRadius;
    this.targetRadius = targetRadius;
    this.isActive = true;
    this.hasImpacted = false;
    this.punishWindow = 0; // No punish windows anymore

    // Position will be set by GameState to avoid overlaps
    this.x = 0;
    this.y = 0;
  }

  getProgress(currentTime) {
    return Math.min(1, (currentTime - this.spawnTime) / this.duration);
  }

  getCurrentRadius(currentTime) {
    const progress = this.getProgress(currentTime);
    return this.startRadius - (this.startRadius - this.targetRadius) * progress;
  }

  hasReachedTarget(currentTime) {
    return this.getProgress(currentTime) >= 1;
  }

  isInPunishWindow(currentTime) {
    return false; // No punish windows anymore
  }

  getParryTiming(currentTime, windowModifier = 1) {
    const timeToImpact = this.spawnTime + this.duration - currentTime;
    const absTime = Math.abs(timeToImpact);

    const perfectWindow = Constants.PARRY_WINDOWS.PERFECT * windowModifier;
    const goodWindow = Constants.PARRY_WINDOWS.GOOD * windowModifier;

    if (absTime <= perfectWindow) return "perfect";
    if (absTime <= goodWindow) return "good";
    return "miss";
  }

  isClickInside(clickX, clickY, currentTime) {
    const currentRadius = this.getCurrentRadius(currentTime);
    const distance = Math.sqrt((clickX - this.x) ** 2 + (clickY - this.y) ** 2);
    return distance <= currentRadius;
  }
}

class GameState {
  constructor() {
    this.currentState = "lobby";
    this.player = null;
    this.currentEnemy = null;
    this.rings = [];
    this.draftChoices = [];

    // Combat state
    this.lastAttackTime = 0;
    this.nextRingTime = 0;

    // Berserk mode ability
    this.berserkMode = false;
    this.berserkDuration = 0;
  }

  transitionTo(newState) {
    console.log(`State transition: ${this.currentState} → ${newState}`);
    this.currentState = newState;

    if (newState === "draft") {
      this.generateDraftChoices();
    } else if (newState === "fight") {
      this.createEnemyForFloor();
    }
  }

  generateDraftChoices() {
    // Generate 2 draft options: always heal and gold
    this.draftChoices = [];

    this.draftChoices.push({
      option: DRAFT_OPTIONS.HEAL,
      type: "heal",
    });

    this.draftChoices.push({
      option: DRAFT_OPTIONS.GOLD,
      type: "gold",
    });
  }

  selectDraftChoice(index) {
    if (index >= 0 && index < this.draftChoices.length) {
      const choice = this.draftChoices[index];
      console.log(`Selected option: ${choice.option.name}`);

      // Apply the chosen effect
      switch (choice.type) {
        case "heal":
          this.player.heal(2);
          console.log("Healed 2 hearts!");
          break;
        case "gold":
          this.player.addGold(20);
          console.log("Gained 20 gold!");
          break;
      }

      this.transitionTo("fight");
    }
  }

  createEnemyForFloor() {
    const floor = this.player.currentFloor;
    let baseHp = 20;

    // Linear scaling for all floors
    baseHp = 20 * Math.pow(1.15, floor - 1);

    const archetype = this.getArchetypeForFloor(floor);

    this.currentEnemy = {
      hp: Math.floor(baseHp),
      maxHp: Math.floor(baseHp),
      archetype: archetype,
      archetypeData: Constants.ENEMY_ARCHETYPES[archetype],
    };

    // Reset combat state
    this.rings = [];
    this.lastAttackTime = 0;
    this.nextRingTime = Date.now() + 1000; // First attack after 1s

    console.log(
      `Created enemy for floor ${floor}: HP=${this.currentEnemy.hp}, Archetype=${this.currentEnemy.archetype} (${this.currentEnemy.archetypeData.name})`
    );
  }

  getArchetypeForFloor(floor) {
    // All floors use random archetype
    const archetypes = Object.keys(Constants.ENEMY_ARCHETYPES);
    return archetypes[Math.floor(Math.random() * archetypes.length)];
  }

  canReroll() {
    const baseCost = 5;
    const increaseCost = 3;
    const cost = baseCost + this.player.rerollsUsed * increaseCost;
    const freeRerolls = this.player.metaUpgrades.freeRerolls || 0;

    return this.player.rerollsUsed < freeRerolls || this.player.gold >= cost;
  }

  getRerollCost() {
    const baseCost = 5;
    const increaseCost = 3;
    const cost = baseCost + this.player.rerollsUsed * increaseCost;
    const freeRerolls = this.player.metaUpgrades.freeRerolls || 0;

    return this.player.rerollsUsed < freeRerolls ? 0 : cost;
  }

  rerollDraft() {
    if (this.canReroll()) {
      const cost = this.getRerollCost();
      if (cost > 0) {
        this.player.gold -= cost;
        this.player.saveToLocalStorage();
      }
      this.player.rerollsUsed++;
      this.generateDraftChoices();
    }
  }

  handleClick(x, y, currentTime) {
    if (!this.currentEnemy || this.currentEnemy.hp <= 0) return null;

    // Check for parry first (priority over attack)
    const parryResult = this.attemptParry(currentTime, x, y);

    if (parryResult) {
      // Successful parry
      console.log(
        `Parry: ${parryResult.timing} on ${parryResult.ring.type} ring`
      );

      // All successful parries deal damage
      let damage = this.player.baseDamage;

      if (parryResult.timing === "perfect") {
        this.player.perfectParries++;
        // Perfect parry triggers counter attack for 2x damage
        damage = this.player.baseDamage * 2;
        console.log(`Perfect parry counter: ${damage} damage!`);
      } else if (parryResult.timing === "good") {
        // Good parry deals normal damage
        console.log(`Good parry attack: ${damage} damage!`);
      }

      // Round damage up to avoid decimal damage
      damage = Math.ceil(damage);

      // Deal damage to enemy
      this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damage);

      // Check for victory
      if (this.currentEnemy.hp <= 0) {
        this.handleVictory();
      }

      return { parry: parryResult, damage: damage }; // Return parry result and damage for feedback
    }

    // No direct attack - only parries deal damage now
    // Player can only damage enemies through successful parries
  }

  handleVictory() {
    // Calculate gold reward
    const goldReward = this.calculateGoldReward();
    this.lastGoldReward = goldReward; // Store for display
    this.player.addGold(goldReward);

    // Update highest floor record
    if (this.player.currentFloor > this.player.highestFloor) {
      this.player.highestFloor = this.player.currentFloor;
      // Update record display in menu if available
      if (window.updateRecordDisplay) {
        window.updateRecordDisplay();
      }
    }

    this.player.currentFloor++;
    this.player.saveRunState();

    console.log(
      `Victory! Earned ${goldReward} gold. Next floor: ${this.player.currentFloor}`
    );

    // Check if entering endless mode
    if (this.player.currentFloor === 12) {
      this.enteringEndlessMode = true;
    }

    this.transitionTo("victory");
  }

  handleDefeat() {
    // Store the floor reached before resetting
    this.reachedFloor = this.player.currentFloor;

    // Reset run-specific data but keep gold and meta-progression
    this.player.hp = this.player.maxHp; // Reset HP for next run
    this.player.currentFloor = 1; // Reset to floor 1
    this.player.perfectParries = 0; // Reset parry counter

    // Keep gold (meta-progression)
    console.log(
      `Defeat! Reached floor ${this.reachedFloor}. Keeping ${this.player.gold} gold for upgrades.`
    );

    this.transitionTo("defeat");
  }

  attemptParry(currentTime, clickX, clickY) {
    // Find rings that were clicked on
    let clickedRings = [];

    for (const ring of this.rings) {
      if (!ring.isActive || ring.hasImpacted) continue;

      if (ring.isClickInside(clickX, clickY, currentTime)) {
        const timeToImpact = ring.spawnTime + ring.duration - currentTime;
        const absTime = Math.abs(timeToImpact);
        clickedRings.push({ ring, absTime, spawnTime: ring.spawnTime });
      }
    }

    if (clickedRings.length === 0) return null;

    // Priority: oldest ring first (smallest spawnTime), then by timing proximity
    clickedRings.sort((a, b) => {
      // If rings are very close in timing (within 100ms), prioritize older ring
      if (Math.abs(a.absTime - b.absTime) < 100) {
        return a.spawnTime - b.spawnTime; // Older first
      }
      // Otherwise, prioritize by timing proximity
      return a.absTime - b.absTime;
    });
    const nearestRing = clickedRings[0].ring;

    // No special parry window modifications
    let windowModifier = 1;

    const timing = nearestRing.getParryTiming(currentTime, windowModifier);

    // Always remove the ring and create particles
    nearestRing.isActive = false;
    nearestRing.hasImpacted = true;

    // Create particles based on success/failure
    if (this.gameEngine) {
      this.gameEngine.createRingParticles(
        nearestRing.x,
        nearestRing.y,
        nearestRing.type,
        timing !== "miss"
      );
    }

    if (timing !== "miss") {
      // Successful parry
      return { ring: nearestRing, timing: timing };
    } else {
      // Missed parry but still clicked on ring
      return null;
    }
  }

  checkBluePunish(currentTime) {
    // No blue ring punish windows anymore
    return false;
  }

  calculateGoldReward() {
    // Linear gold scaling with floor progression
    const baseReward = Math.floor(
      10 + this.player.currentFloor * 2 + Math.random() * 5
    );

    // Add perfect parry bonus
    const perfectBonus = Math.min(5, this.player.perfectParries);

    // Endless scaling
    let reward = baseReward + perfectBonus;
    if (this.player.currentFloor > 12) {
      const endlessLevel = this.player.currentFloor - 12;
      reward = Math.floor(reward * (1 + 0.1 * endlessLevel));
    }

    return reward;
  }

  update(deltaTime) {
    // Update player state
    if (this.player) {
      this.player.update(deltaTime);
    }

    // Update skill cooldowns
    this.player.skills.forEach((skill) => {
      if (skill.cooldownRemaining > 0) {
        skill.cooldownRemaining = Math.max(
          0,
          skill.cooldownRemaining - deltaTime
        );
      }
    });

    // Update combat system (only in fight state)
    if (
      this.currentState === "fight" &&
      this.currentEnemy &&
      this.currentEnemy.hp > 0
    ) {
      this.updateCombat();
    }
  }

  updateCombat() {
    const currentTime = Date.now();

    // Update berserk mode
    this.updateBerserkMode();

    // Update existing rings (always, even during berserk)
    this.updateRings(currentTime);

    // Generate new rings based on archetype pattern (always, even during berserk)
    this.generateRings(currentTime);
  }

  updateBerserkMode() {
    if (this.berserkMode) {
      // Drain stamina while in berserk mode (100 stamina = 20000ms = 20 seconds)
      const drainRate = 100 / 2000; // stamina per ms
      const drainAmount = drainRate * 16; // Assuming ~60fps (16ms per frame)

      this.player.stamina = Math.max(0, this.player.stamina - drainAmount);

      // Stop berserk mode when stamina runs out
      if (this.player.stamina <= 0) {
        this.berserkMode = false;
        console.log("Berserk mode ended - stamina depleted");
      }
    }
  }

  canUseBerserk() {
    return !this.berserkMode && this.player.stamina >= this.player.maxStamina;
  }

  activateBerserk() {
    if (this.canUseBerserk()) {
      this.berserkMode = true;
      console.log("Berserk mode activated!");
      return true;
    }
    return false;
  }

  updateRings(currentTime) {
    // Remove expired rings and handle impacts
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];

      if (!ring.isActive) {
        // Remove inactive rings
        this.rings.splice(i, 1);
        continue;
      }

      if (ring.hasReachedTarget(currentTime) && !ring.hasImpacted) {
        // Ring reached target without being parried
        ring.hasImpacted = true;
        this.handleRingImpact(ring);
      }

      // Remove old rings
      if (currentTime - ring.spawnTime > ring.duration + 1000) {
        this.rings.splice(i, 1);
      }
    }
  }

  handleRingImpact(ring) {
    // Create impact particles (always red for unparried rings)
    if (this.gameEngine) {
      this.gameEngine.createRingParticles(ring.x, ring.y, ring.type, false);
    }

    // No damage during berserk mode (invulnerability)
    if (this.berserkMode) {
      console.log("Ring impact blocked by Berserk mode invulnerability!");
      return;
    }

    // Calculate damage (unified for all enemies)
    let damage = Constants.RING_DAMAGE.MAJOR[ring.type];

    // No ultimate bonuses anymore

    if (ring.type === Constants.RING_TYPES.RED) {
      console.log(`Red ring MUST be parried! Taking ${damage} damage.`);
    } else {
      console.log(`Ring impact: ${damage} damage`);
    }

    const isDead = this.player.takeDamage(damage, this.gameEngine);
    if (isDead) {
      this.handleDefeat();
    }
  }

  generateSafePosition(newRing) {
    const margin = 40; // Reduced margin since rings are smaller
    const minDistance = 80; // Minimum distance between ring centers
    const maxAttempts = 50; // Prevent infinite loops

    // Get real canvas bounds from the global canvas object
    const canvasWidth =
      typeof canvas !== "undefined" && canvas ? canvas.width : 400;
    const canvasHeight =
      typeof canvas !== "undefined" && canvas ? canvas.height : 600;

    // HUD zones to avoid
    const topHUDHeight = 60; // HP bar + name
    const bottomHUDHeight = 80; // Player HUD + buttons

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = margin + Math.random() * (canvasWidth - 2 * margin);
      const y =
        topHUDHeight +
        margin +
        Math.random() *
          (canvasHeight - topHUDHeight - bottomHUDHeight - 2 * margin);

      // Check distance from all existing active rings
      let tooClose = false;
      for (const ring of this.rings) {
        if (!ring.isActive) continue;

        const distance = Math.sqrt((x - ring.x) ** 2 + (y - ring.y) ** 2);
        if (distance < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        newRing.x = x;
        newRing.y = y;
        return;
      }
    }

    // Fallback: use random position if we can't find a safe spot (still avoiding HUD)
    newRing.x = margin + Math.random() * (canvasWidth - 2 * margin);
    newRing.y =
      topHUDHeight +
      margin +
      Math.random() *
        (canvasHeight - topHUDHeight - bottomHUDHeight - 2 * margin);
  }

  generateRings(currentTime) {
    if (currentTime < this.nextRingTime) return;

    const archetype = this.currentEnemy.archetypeData;

    // Handle different archetype patterns
    switch (this.currentEnemy.archetype) {
      case "A": // Classic
        this.generateClassicRing(currentTime, archetype);
        break;
      case "B": // Feinter
        this.generateFeinterRing(currentTime, archetype);
        break;
      case "C": // Dog (now uses classic pattern)
        this.generateClassicRing(currentTime, archetype);
        break;
      case "D": // Bruiser
        this.generateBruiserRing(currentTime, archetype);
        break;
    }
  }

  generateClassicRing(currentTime, archetype) {
    const ringType = this.selectRingType(archetype.patterns);
    const duration = this.getRingDuration(ringType, archetype);

    const newRing = new Ring(ringType, currentTime, duration);
    this.generateSafePosition(newRing);
    this.rings.push(newRing);

    // Schedule next ring with progressive scaling
    let interval = archetype.interval;
    // No ultimate speed bonus anymore

    // Progressive scaling: intervals get shorter with floor progression
    const floorIntervalMultiplier = Math.max(
      0.5,
      1 - (this.player.currentFloor - 1) * 0.05
    ); // 5% faster per floor, min 50%
    interval *= floorIntervalMultiplier;

    this.nextRingTime = currentTime + interval;
  }

  generateFeinterRing(currentTime, archetype) {
    const ringType = this.selectRingType(archetype.patterns);
    const duration = this.getRingDuration(ringType, archetype);

    const newRing = new Ring(ringType, currentTime, duration);
    this.generateSafePosition(newRing);
    this.rings.push(newRing);

    // No special blue ring effects anymore

    // Apply progressive scaling to interval
    let interval = archetype.interval;
    const floorIntervalMultiplier = Math.max(
      0.5,
      1 - (this.player.currentFloor - 1) * 0.05
    );
    interval *= floorIntervalMultiplier;

    this.nextRingTime = currentTime + interval;
  }

  // generateSpammerRing removed - Dog now uses classic pattern

  generateBruiserRing(currentTime, archetype) {
    const ringType = this.selectRingType(archetype.patterns);
    let duration = this.getRingDuration(ringType, archetype);

    // Ultimate: tighter parry windows (handled in parry detection)
    const newRing = new Ring(ringType, currentTime, duration);
    this.generateSafePosition(newRing);
    this.rings.push(newRing);

    // Apply progressive scaling to interval
    let interval = archetype.interval;
    const floorIntervalMultiplier = Math.max(
      0.5,
      1 - (this.player.currentFloor - 1) * 0.05
    );
    interval *= floorIntervalMultiplier;

    this.nextRingTime = currentTime + interval;
  }

  selectRingType(patterns) {
    const rand = Math.random();
    if (rand < patterns.white) return Constants.RING_TYPES.WHITE;
    return Constants.RING_TYPES.RED;
  }

  getRingDuration(ringType, archetype) {
    const baseDuration = archetype.ringDurations[ringType.toLowerCase()];
    let duration = baseDuration || 1300;

    // Progressive scaling: rings get faster with floor progression
    const floorSpeedMultiplier = Math.max(
      0.6,
      1 - (this.player.currentFloor - 1) * 0.04
    ); // 4% faster per floor, min 60%
    duration *= floorSpeedMultiplier;

    return duration;
  }

  loadRunState() {
    return this.player.loadRunState();
  }
}

// Main game engine class
class GameEngine {
  constructor() {
    this.player = new Player();
    this.gameState = new GameState();
    this.gameState.player = this.player;
    this.gameState.gameEngine = this; // Reference for damage effects

    // Visual feedback
    this.feedbackMessages = [];

    // Tooltip system
    this.hoveredSkill = null;
    this.hoverStartTime = 0;

    // Screen shake and damage feedback
    this.screenShake = { x: 0, y: 0, duration: 0 };
    this.redFlash = { alpha: 0, duration: 0 };
    this.catDamageTimer = 0;

    // Particle system
    this.particles = [];

    // Paw effects for click feedback
    this.pawEffects = [];

    // Enemy images
    this.enemyImages = {};
    this.loadEnemyImages();

    // Input handling
    this.setupInputHandlers();

    // Scene renderers
    this.sceneRenderers = {
      lobby: this.renderLobby.bind(this),
      draft: this.renderDraft.bind(this),
      fight: this.renderFight.bind(this),
      victory: this.renderVictory.bind(this),
      defeat: this.renderDefeat.bind(this),
      endless: this.renderFight.bind(this), // Same as fight
    };
  }

  loadEnemyImages() {
    const imageFiles = {
      A: "assets/miceEnemy.png", // Rat -> Mice
      B: "assets/foxEnemy.png", // Fox
      C: "assets/dogEnemy.png", // Dog
      D: "assets/bearEnemy.png", // Bear
    };

    Object.entries(imageFiles).forEach(([archetype, path]) => {
      const img = new Image();
      img.onload = () => {
        this.enemyImages[archetype] = img;
      };
      img.src = path;
    });
  }

  startGame() {
    // Always try to load from localStorage first
    const hasPersistentData = this.player.loadFromLocalStorage();
    const hasRunData = this.gameState.loadRunState();

    if (hasPersistentData || hasRunData) {
      // Load existing progress
      console.log("Loading existing game progress");
    } else {
      // Start fresh run
      console.log("Starting new run");
      this.player.startNewRun();
    }

    // Always go to lobby
    this.gameState.transitionTo("lobby");
  }

  setupInputHandlers() {
    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleInput(x, y);
    });

    // Mouse move for tooltips
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleMouseMove(x, y);
    });

    canvas.addEventListener("mouseleave", () => {
      this.hoveredSkill = null;
      this.hoverStartTime = 0;
    });

    window.addEventListener("keydown", (e) => {
      this.handleKeyInput(e.key);
    });
  }

  handleInput(x, y) {
    const currentTime = Date.now();

    switch (this.gameState.currentState) {
      case "lobby":
        this.handleLobbyInput(x, y);
        break;
      case "draft":
        this.handleDraftInput(x, y);
        break;
      case "fight":
      case "endless":
        this.handleFightInput(x, y, currentTime);
        break;
      case "victory":
        this.gameState.enteringEndlessMode = false; // Reset flag
        this.gameState.transitionTo("draft");
        break;
      case "defeat":
        this.gameState.transitionTo("lobby");
        break;
    }
  }

  handleKeyInput(key) {
    switch (key) {
      case "Escape":
        if (this.gameState.currentState === "fight") {
          this.gameState.transitionTo("lobby");
        }
        break;
      case "1":
      case "2":
        if (this.gameState.currentState === "draft") {
          const choice = parseInt(key) - 1;
          this.gameState.selectDraftChoice(choice);
        }
        break;
    }
  }

  handleMouseMove(x, y) {
    if (this.gameState.currentState !== "fight") {
      this.hoveredSkill = null;
      return;
    }

    // Check if mouse is over a skill slot
    const slotSize = 55;
    const slotSpacing = 65;
    const slotsY = canvas.height - 90;
    const slotsStartX = canvas.width - 3 * slotSpacing - 15;

    let newHoveredSkill = null;

    for (let i = 0; i < 3; i++) {
      const slotX = slotsStartX + i * slotSpacing;
      const skill = this.player.skills[i];

      if (
        skill &&
        x >= slotX &&
        x <= slotX + slotSize &&
        y >= slotsY &&
        y <= slotsY + slotSize
      ) {
        newHoveredSkill = { index: i, skill: skill };
        break;
      }
    }

    if (newHoveredSkill !== this.hoveredSkill) {
      this.hoveredSkill = newHoveredSkill;
      this.hoverStartTime = Date.now();
    }
  }

  update(deltaTime) {
    this.gameState.update(deltaTime);
    this.updateFeedbackMessages(deltaTime);
    this.updateDamageEffects(deltaTime);
    this.handleResize();
  }

  addFeedbackMessage(text, x, y) {
    this.feedbackMessages.push({
      text: text,
      x: x,
      y: y,
      startTime: Date.now(),
      duration: 1000, // 1 second
    });
  }

  triggerDamageEffects() {
    // Screen shake (subtle)
    this.screenShake = {
      x: (Math.random() - 0.5) * 8, // ±4px
      y: (Math.random() - 0.5) * 8,
      duration: 200, // 200ms
    };

    // Red flash (not too flashy)
    this.redFlash = {
      alpha: 0.15, // Subtle red overlay
      duration: 200,
    };

    // Show catLow for 1 second
    this.catDamageTimer = 1000;
  }

  updateFeedbackMessages(deltaTime) {
    const currentTime = Date.now();
    this.feedbackMessages = this.feedbackMessages.filter((msg) => {
      return currentTime - msg.startTime < msg.duration;
    });
  }

  updateDamageEffects(deltaTime) {
    // Update screen shake
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      if (this.screenShake.duration <= 0) {
        this.screenShake.x = 0;
        this.screenShake.y = 0;
      }
    }

    // Update red flash
    if (this.redFlash.duration > 0) {
      this.redFlash.duration -= deltaTime;
      // Fade out the red flash
      this.redFlash.alpha = Math.max(0, (this.redFlash.duration / 200) * 0.15);
    }

    // Update cat damage timer
    if (this.catDamageTimer > 0) {
      this.catDamageTimer -= deltaTime;
    }

    // Update particles
    this.updateParticles(deltaTime);

    // Update paw effects
    this.updatePawEffects(deltaTime);
  }

  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const alive = particle.update(deltaTime);
      if (!alive) {
        this.particles.splice(i, 1);
      }
    }
  }

  createRingParticles(x, y, ringType, success) {
    const particleCount = success ? 12 : 8;
    const baseColor = this.getRingColor(ringType);
    const colors = success
      ? [`${baseColor}`, "#ffffff", "#ffff00"] // Success: ring color + white + yellow
      : ["#ff0000", "#ff4444", "#aa0000"]; // Fail: red variants

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = success ? 3 + Math.random() * 2 : 2 + Math.random() * 1.5;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - Math.random() * 2,
      };

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = success ? 2 + Math.random() * 2 : 1.5 + Math.random() * 1.5;
      const life = success
        ? 800 + Math.random() * 400
        : 600 + Math.random() * 300;

      this.particles.push(new Particle(x, y, color, velocity, size, life));
    }
  }

  getRingColor(ringType) {
    switch (ringType) {
      case Constants.RING_TYPES.WHITE:
        return "#ffffff";
      // No blue rings anymore
      case Constants.RING_TYPES.RED:
        return "#e34a4a";
      default:
        return "#ffffff";
    }
  }

  updatePawEffects(deltaTime) {
    for (let i = this.pawEffects.length - 1; i >= 0; i--) {
      const pawEffect = this.pawEffects[i];
      const alive = pawEffect.update(deltaTime);
      if (!alive) {
        this.pawEffects.splice(i, 1);
      }
    }
  }

  createPawEffect(x, y) {
    this.pawEffects.push(new PawEffect(x, y));
  }

  handleResize() {
    if (!this.resizeTimeout) {
      this.resizeTimeout = setTimeout(() => {
        setupCanvas();
        this.resizeTimeout = null;
      }, 100);
    }
  }

  render() {
    // Clear canvas (transparent so CSS background shows through)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply screen shake
    ctx.save();
    if (this.screenShake.duration > 0) {
      ctx.translate(this.screenShake.x, this.screenShake.y);
    }

    // Render current scene
    const renderer = this.sceneRenderers[this.gameState.currentState];
    if (renderer) {
      renderer();
    }

    ctx.restore();

    // Apply red flash overlay (after shake is restored)
    if (this.redFlash.alpha > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${this.redFlash.alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Scene renderers
  renderLobby() {
    this.drawTitle("LOBBY");
    this.drawPlayerStats();
    this.drawMetaUpgrades();
    this.drawStartButton();
  }

  renderDraft() {
    this.drawTitle(`FLOOR ${this.player.currentFloor}`);
    this.drawPlayerStats();
    this.drawSkillChoices();
  }

  renderFight() {
    this.drawPlayerHUD();
    this.drawEnemy();
    this.drawRings();
    this.drawParticles();
    this.drawPawEffects();
    this.drawBerserkButton();
    this.drawCentralAttackButton();
    this.drawFeedbackMessages();
  }

  renderVictory() {
    if (this.gameState.enteringEndlessMode) {
      this.drawTitle("ENDLESS MODE UNLOCKED!");
      this.drawEndlessModeAnnouncement();
    } else {
      this.drawTitle("VICTORY!");
      this.drawVictoryStats();
    }
    this.drawContinuePrompt();
  }

  renderDefeat() {
    this.drawTitle("DEFEATED");
    this.drawDefeatStats();
    this.drawReturnToLobby();
  }

  // Drawing utilities
  drawBackground() {
    // Background is now handled by CSS (animated checkerboard pattern)
    // Keep canvas transparent so the CSS background shows through
  }

  drawTitle(text) {
    ctx.fillStyle = "#fff";
    ctx.font = getScaledFont(24, "bold");
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, 40);
  }

  drawPlayerStats() {
    const stats = [
      `Gold: ${this.player.gold}`,
      `Floor: ${this.player.currentFloor}`,
      `HP: ${this.player.hp}/${this.player.maxHp}`,
    ];

    ctx.fillStyle = "#ccc";
    ctx.font = getScaledFont(16);
    ctx.textAlign = "left";

    stats.forEach((stat, i) => {
      ctx.fillText(stat, 20, 80 + i * 25);
    });
  }

  drawPlayerHUD() {
    const hudY = canvas.height - 60;
    const margin = 15;

    // Cat avatar (catLow if recently damaged, otherwise happy if HP >= 5, sad if HP <= 4)
    if (catAssets.loaded) {
      let catImage;
      if (this.catDamageTimer > 0) {
        catImage = catAssets.sad; // Using catLow (which is stored as sad)
      } else {
        catImage = this.player.hp >= 5 ? catAssets.happy : catAssets.sad;
      }
      ctx.drawImage(catImage, margin, hudY, 60, 60);
    }

    // Hearts (9 total) - Drawing actual heart shapes
    const heartSize = 18;
    const heartSpacing = 22;
    const heartsStartX = margin + 70;
    const heartsY = hudY + 5;

    for (let i = 0; i < this.player.maxHp; i++) {
      const heartX = heartsStartX + i * heartSpacing;
      const filled = i < this.player.hp;

      this.drawHeart(heartX, heartsY, heartSize, filled);
    }

    // HP text
    ctx.fillStyle = "#fff";
    ctx.font = getScaledFont(12);
    ctx.textAlign = "left";
    ctx.fillText(
      `${this.player.hp}/${this.player.maxHp}`,
      heartsStartX,
      heartsY + 30
    );

    // Stamina bar with better design
    const staminaWidth = 180;
    const staminaHeight = 12;
    const staminaX = heartsStartX;
    const staminaY = hudY + 45;

    // Background with border
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(
      staminaX - 1,
      staminaY - 1,
      staminaWidth + 2,
      staminaHeight + 2
    );
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(staminaX, staminaY, staminaWidth, staminaHeight);

    // Fill with orange gradient
    const fillWidth =
      (this.player.stamina / this.player.maxStamina) * staminaWidth;
    if (fillWidth > 0) {
      const gradient = ctx.createLinearGradient(
        staminaX,
        staminaY,
        staminaX,
        staminaY + staminaHeight
      );
      gradient.addColorStop(0, "#ff8c42");
      gradient.addColorStop(1, "#ff6b1a");
      ctx.fillStyle = gradient;
      ctx.fillRect(staminaX, staminaY, fillWidth, staminaHeight);
    }

    // Additional stamina display above the bar for better visibility
    ctx.fillStyle = "#ff8c42";
    ctx.font = getScaledFont(11, "bold");
    ctx.textAlign = "center";
    ctx.fillText(
      `${Math.floor(this.player.stamina)}/${this.player.maxStamina}`,
      staminaX + staminaWidth / 2,
      staminaY - 5
    );
  }

  // Helper function to draw heart shapes
  drawHeart(x, y, size, filled) {
    const halfSize = size / 2;

    ctx.save();
    ctx.translate(x + halfSize, y + halfSize);

    // Heart shape path
    ctx.beginPath();
    ctx.moveTo(0, halfSize * 0.3);

    // Left curve
    ctx.bezierCurveTo(
      -halfSize * 0.8,
      -halfSize * 0.3,
      -halfSize * 0.8,
      halfSize * 0.3,
      0,
      halfSize * 0.8
    );

    // Right curve
    ctx.bezierCurveTo(
      halfSize * 0.8,
      halfSize * 0.3,
      halfSize * 0.8,
      -halfSize * 0.3,
      0,
      halfSize * 0.3
    );

    ctx.closePath();

    if (filled) {
      ctx.fillStyle = "#ff5757";
      ctx.fill();
    }

    // Heart outline
    ctx.strokeStyle = filled ? "#cc3333" : "#666";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (!filled) {
      ctx.fillStyle = "#222";
      ctx.fill();
    }

    ctx.restore();
  }

  drawEnemy() {
    if (!this.gameState.currentEnemy) return;

    const enemy = this.gameState.currentEnemy;
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.4;
    const radius = 60;

    // Draw enemy shape based on archetype
    this.drawEnemyShape(enemy.archetype, centerX, centerY, radius);

    // HP bar
    const hpBarWidth = canvas.width * 0.6;
    const hpBarHeight = 8;
    const hpBarX = (canvas.width - hpBarWidth) / 2;
    const hpBarY = 20;

    ctx.fillStyle = "#333";
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = "#ff5757";
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpRatio, hpBarHeight);

    // Enemy HP text (chiffres)
    ctx.fillStyle = "#fff";
    ctx.font = getScaledFont(12, "bold");
    ctx.textAlign = "center";
    ctx.fillText(
      `HP: ${Math.ceil(enemy.hp)}/${enemy.maxHp}`,
      canvas.width / 2,
      hpBarY + hpBarHeight + 15
    );

    // Enemy archetype info (police plus grande)
    ctx.fillStyle = "#fff";
    ctx.font = getScaledFont(18, "bold");
    ctx.textAlign = "center";
    const archetypeName = enemy.archetypeData?.name || "Unknown";
    ctx.fillText(archetypeName, canvas.width / 2, hpBarY - 5);
  }

  drawEnemyShape(archetype, centerX, centerY, radius) {
    ctx.save();

    // Try to use image first, fallback to circle if not loaded
    if (this.enemyImages[archetype]) {
      const img = this.enemyImages[archetype];
      const imgSize = radius * 2;
      ctx.drawImage(img, centerX - radius, centerY - radius, imgSize, imgSize);
    } else {
      // Fallback to circle while image loads
      ctx.fillStyle = "#2b2b2b";
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  drawRings() {
    const currentTime = Date.now();

    // Draw all active rings at their positions
    this.gameState.rings.forEach((ring) => {
      if (!ring.isActive) return;

      const currentRadius = ring.getCurrentRadius(currentTime);
      if (currentRadius < ring.targetRadius) return; // Ring has passed target

      // Ring color based on type
      let color, glowColor;
      switch (ring.type) {
        case Constants.RING_TYPES.WHITE:
          color = "#ffffff";
          glowColor = "rgba(255,255,255,0.3)";
          break;
        // No blue rings anymore
        case Constants.RING_TYPES.RED:
          color = "#e34a4a";
          glowColor = "rgba(227,74,74,0.4)";
          break;
        default:
          color = "#ffffff";
          glowColor = "rgba(255,255,255,0.3)";
      }

      // Draw glow effect (no pulsing)
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw main ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Add inner glow for extra juiciness
      ctx.strokeStyle = `rgba(255,255,255,0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, currentRadius - 2, 0, Math.PI * 2);
      ctx.stroke();

      // Draw target area
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.targetRadius, 0, Math.PI * 2);
      ctx.stroke();

      // No special blue ring effects anymore

      // Draw timing indicator for nearby rings
      const timeToImpact = ring.spawnTime + ring.duration - currentTime;
      if (Math.abs(timeToImpact) <= Constants.PARRY_WINDOWS.GOOD) {
        const timing = ring.getParryTiming(currentTime);
        let indicatorColor;

        switch (timing) {
          case "perfect":
            indicatorColor = "#00ff00";
            break;
          case "good":
            indicatorColor = "#ffff00";
            break;
          default:
            indicatorColor = "#ff0000";
        }

        // Draw timing indicator
        ctx.fillStyle = indicatorColor;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y - currentRadius - 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
  }

  drawFeedbackMessages() {
    const currentTime = Date.now();

    this.feedbackMessages.forEach((msg) => {
      const elapsed = currentTime - msg.startTime;
      const progress = elapsed / msg.duration;

      // Fade out and move up
      const alpha = Math.max(0, 1 - progress);
      const offsetY = progress * 30; // Move up 30px

      ctx.save();
      ctx.globalAlpha = alpha;

      // Color based on message
      if (msg.text.includes("PERFECT")) {
        ctx.fillStyle = "#00ff00";
        ctx.font = getScaledFont(18, "bold");
      } else if (msg.text.includes("GOOD")) {
        ctx.fillStyle = "#ffff00";
        ctx.font = getScaledFont(16, "bold");
      } else if (msg.text.includes("DMG")) {
        ctx.fillStyle = "#ff8800";
        ctx.font = getScaledFont(14, "bold");
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.font = getScaledFont(14);
      }

      ctx.textAlign = "center";
      ctx.fillText(msg.text, msg.x, msg.y - offsetY);

      ctx.restore();
    });
  }

  drawSkillSlots() {
    const slotSize = 55; // Plus grand
    const slotSpacing = 65;
    const slotsY = canvas.height - 90;
    const slotsStartX = canvas.width - 3 * slotSpacing - 15;

    for (let i = 0; i < 3; i++) {
      const x = slotsStartX + i * slotSpacing;
      const skill = this.player.skills[i];

      // Slot background with border
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(x - 2, slotsY - 2, slotSize + 4, slotSize + 4);

      let slotColor = "#1a1a1a";
      if (skill) {
        const isOnCooldown = skill.cooldownRemaining > 0;

        if (isOnCooldown) {
          slotColor = "#cc5500"; // Orange pour cooldown
        } else {
          slotColor = "#ff8800"; // Orange pour actif (default)
        }
      }

      ctx.fillStyle = slotColor;
      ctx.fillRect(x, slotsY, slotSize, slotSize);

      if (skill) {
        // Acronyme du skill (simplified since skills system is removed)
        ctx.fillStyle = "#fff";
        ctx.font = getScaledFont(12, "bold");
        ctx.textAlign = "center";
        ctx.fillText(
          "SK" + skill.id, // Simple skill abbreviation
          x + slotSize / 2,
          slotsY + slotSize / 2 - 3
        );

        // Niveau
        ctx.fillStyle = "#fff";
        ctx.font = getScaledFont(10);
        ctx.fillText(
          `Lv${skill.level}`,
          x + slotSize / 2,
          slotsY + slotSize / 2 + 12
        );

        // Cooldown overlay et texte
        if (skill.cooldownRemaining > 0) {
          const skillCooldown = 15000; // Default cooldown since skills system is removed
          const cooldownRatio = skill.cooldownRemaining / skillCooldown;
          const overlayHeight = slotSize * cooldownRatio;

          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(x, slotsY, slotSize, overlayHeight);

          // Temps restant
          const secondsLeft = Math.ceil(skill.cooldownRemaining / 1000);
          ctx.fillStyle = "#fff";
          ctx.font = getScaledFont(10);
          ctx.fillText(`${secondsLeft}s`, x + slotSize / 2, slotsY + 15);
        }
      }

      // Slot number
      ctx.fillStyle = "#888";
      ctx.font = getScaledFont(10);
      ctx.textAlign = "center";
      ctx.fillText(
        (i + 1).toString(),
        x + slotSize / 2,
        slotsY + slotSize + 15
      );
    }
  }

  drawParticles() {
    this.particles.forEach((particle) => {
      particle.draw(ctx);
    });
  }

  drawPawEffects() {
    this.pawEffects.forEach((pawEffect) => {
      pawEffect.draw(ctx);
    });
  }

  drawSkillTooltip() {
    if (!this.hoveredSkill || Date.now() - this.hoverStartTime < 500) return; // 0.5s delay

    const skill = this.hoveredSkill.skill;
    // Skills system removed - using simplified data

    // Tooltip position (above skill slots)
    const tooltipWidth = 200;
    const tooltipHeight = 80;
    const slotSize = 55;
    const slotSpacing = 65;
    const slotsY = canvas.height - 90;
    const slotsStartX = canvas.width - 3 * slotSpacing - 15;
    const slotX = slotsStartX + this.hoveredSkill.index * slotSpacing;

    const tooltipX = Math.max(
      10,
      Math.min(
        canvas.width - tooltipWidth - 10,
        slotX - tooltipWidth / 2 + slotSize / 2
      )
    );
    const tooltipY = slotsY - tooltipHeight - 10;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

    // Border
    ctx.strokeStyle = "#39a8ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

    // Skill name (simplified since skills system is removed)
    ctx.fillStyle = "#fff";
    ctx.font = getScaledFont(14, "bold");
    ctx.textAlign = "left";
    ctx.fillText(`Skill ${skill.id}`, tooltipX + 10, tooltipY + 20);

    // Type and level
    ctx.fillStyle = "#ccc";
    ctx.font = getScaledFont(12);
    ctx.fillText(`Active - Level ${skill.level}`, tooltipX + 10, tooltipY + 38);

    // Description
    ctx.fillStyle = "#fff";
    ctx.font = getScaledFont(11);
    ctx.fillText("Skill system removed", tooltipX + 10, tooltipY + 55);
  }

  drawMetaUpgrades() {
    ctx.fillStyle = "#fff";
    ctx.font = getScaledFont(18);
    ctx.textAlign = "left";
    ctx.fillText("Meta Upgrades:", 20, 160);

    const startY = 190;
    const upgradeHeight = 45;
    let yOffset = 0;

    Object.entries(Constants.META_UPGRADES).forEach(([key, upgrade]) => {
      const currentLevel = this.player.metaUpgrades[key];
      const isMaxLevel = currentLevel >= upgrade.maxLevel;
      const canAfford = this.player.canAffordUpgrade(key);
      const cost = isMaxLevel ? 0 : upgrade.costs[currentLevel];

      const y = startY + yOffset;

      // Background
      ctx.fillStyle =
        canAfford && !isMaxLevel
          ? "rgba(57,168,255,0.1)"
          : "rgba(100,100,100,0.05)";
      ctx.fillRect(15, y - 15, canvas.width - 30, upgradeHeight - 5);

      // Upgrade name
      ctx.fillStyle = isMaxLevel ? "#FFD700" : canAfford ? "#fff" : "#888";
      ctx.font = getScaledFont(14, "bold");
      ctx.textAlign = "left";
      ctx.fillText(
        `${upgrade.name} (${currentLevel}/${upgrade.maxLevel})`,
        25,
        y
      );

      // Description
      ctx.fillStyle = "#ccc";
      ctx.font = getScaledFont(12);
      ctx.fillText(upgrade.description, 25, y + 15);

      // Cost or MAX
      ctx.textAlign = "right";
      if (isMaxLevel) {
        ctx.fillStyle = "#FFD700";
        ctx.font = getScaledFont(12, "bold");
        ctx.fillText("MAX", canvas.width - 25, y + 8);
      } else {
        ctx.fillStyle = canAfford ? "#39a8ff" : "#888";
        ctx.font = getScaledFont(14, "bold");
        ctx.fillText(`${cost}g`, canvas.width - 25, y + 8);
      }

      yOffset += upgradeHeight;
    });

    ctx.textAlign = "left";
  }

  drawSkillChoices() {
    if (this.gameState.draftChoices.length === 0) return;

    const choiceHeight = 85;
    const choiceSpacing = 100;
    const startY = Math.max(120, (canvas.height - 2 * choiceSpacing) / 2 + 40); // Only 2 choices now
    const margin = 15;

    ctx.fillStyle = "#fff";
    ctx.font = getScaledFont(20);
    ctx.textAlign = "center";
    ctx.fillText("Choose an Option:", canvas.width / 2, startY - 50);

    this.gameState.draftChoices.forEach((choice, index) => {
      const y = startY + index * choiceSpacing;
      const option = choice.option;

      // Background avec bordure plus visible
      ctx.fillStyle = "rgba(57,168,255,0.1)";
      ctx.fillRect(
        margin - 3,
        y - 30,
        canvas.width - 2 * margin + 6,
        choiceHeight
      );
      ctx.strokeStyle = "rgba(57,168,255,0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        margin - 3,
        y - 30,
        canvas.width - 2 * margin + 6,
        choiceHeight
      );

      // Option name
      ctx.fillStyle = "#fff";
      ctx.font = getScaledFont(18, "bold");
      ctx.textAlign = "left";
      ctx.fillText(`${option.name}`, margin + 10, y - 8);

      // Option description
      ctx.font = getScaledFont(12);
      ctx.fillStyle = "#ccc";
      ctx.fillText(option.description, margin + 10, y + 15);

      // Choice number
      ctx.fillStyle = "#39a8ff";
      ctx.font = getScaledFont(32, "bold");
      ctx.textAlign = "right";
      ctx.fillText((index + 1).toString(), canvas.width - margin - 15, y + 10);

      // Instruction de click
      ctx.fillStyle = "#888";
      ctx.font = getScaledFont(10);
      ctx.textAlign = "right";
      ctx.fillText(
        `Press ${index + 1} or Click`,
        canvas.width - margin - 15,
        y + 30
      );
    });
  }

  drawStartButton() {
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = canvas.height - 100;

    ctx.fillStyle = "#39a8ff";
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = "#fff";
    ctx.font = 'bold 18px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Start Run", canvas.width / 2, buttonY + 32);
  }

  drawRerollButton() {
    if (!this.gameState.canReroll()) return;

    const cost = this.gameState.getRerollCost();
    const text = cost > 0 ? `Reroll (${cost}g)` : "Reroll (Free)";

    ctx.fillStyle = "#666";
    ctx.fillRect(20, canvas.height - 60, 120, 40);

    ctx.fillStyle = "#fff";
    ctx.font = '12px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(text, 80, canvas.height - 35);
  }

  drawVictoryStats() {
    ctx.fillStyle = "#6ab8ff";
    ctx.font = '18px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Floor Cleared!", canvas.width / 2, 120);

    const stats = [
      `Perfect Parries: ${this.player.perfectParries}`,
      `Total Gold: ${this.player.gold}`,
    ];

    ctx.fillStyle = "#ccc";
    ctx.font = '14px Arial, "Helvetica Neue", Helvetica, sans-serif';
    stats.forEach((stat, i) => {
      ctx.fillText(stat, canvas.width / 2, 160 + i * 25);
    });
  }

  drawEndlessModeAnnouncement() {
    ctx.fillStyle = "#FFD700";
    ctx.font = getScaledFont(16, "bold");
    ctx.textAlign = "center";
    ctx.fillText("🎉 Congratulations! 🎉", canvas.width / 2, 120);

    ctx.fillStyle = "#fff";
    ctx.font = getScaledFont(14);
    ctx.fillText("You have completed the main game!", canvas.width / 2, 150);
    ctx.fillText("Endless mode is now unlocked!", canvas.width / 2, 175);

    ctx.fillStyle = "#ff8800";
    ctx.font = getScaledFont(12);
    ctx.fillText(
      "The difficulty will now scale infinitely",
      canvas.width / 2,
      200
    );
    ctx.fillText("How far can you go?", canvas.width / 2, 220);

    const stats = [
      `Perfect Parries: ${this.player.perfectParries}`,
      `Total Gold: ${this.player.gold}`,
    ];

    ctx.fillStyle = "#ccc";
    ctx.font = getScaledFont(12);
    stats.forEach((stat, i) => {
      ctx.fillText(stat, canvas.width / 2, 250 + i * 20);
    });
  }

  drawDefeatStats() {
    ctx.fillStyle = "#e34a4a";
    ctx.font = '18px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(
      `Reached Floor ${
        this.gameState.reachedFloor || this.player.currentFloor
      }`,
      canvas.width / 2,
      120
    );

    ctx.fillStyle = "#ccc";
    ctx.font = '14px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.fillText(`Gold Earned: ${this.player.gold}`, canvas.width / 2, 160);

    ctx.fillStyle = "#FFD700";
    ctx.font = '16px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.fillText(
      `Best Record: Floor ${this.player.highestFloor}`,
      canvas.width / 2,
      190
    );
  }

  drawContinuePrompt() {
    ctx.fillStyle = "#fff";
    ctx.font = '14px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Tap to continue...", canvas.width / 2, canvas.height - 50);
  }

  drawReturnToLobby() {
    ctx.fillStyle = "#fff";
    ctx.font = '14px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(
      "Tap to return to lobby...",
      canvas.width / 2,
      canvas.height - 50
    );
  }

  // Input handlers for specific scenes
  handleLobbyInput(x, y) {
    // Check meta upgrade clicks
    const startY = 190;
    const upgradeHeight = 45;
    let upgradeIndex = 0;

    for (const [key, upgrade] of Object.entries(Constants.META_UPGRADES)) {
      const upgradeY = startY + upgradeIndex * upgradeHeight;

      if (y >= upgradeY - 15 && y <= upgradeY + upgradeHeight - 20) {
        if (this.player.canAffordUpgrade(key)) {
          this.player.buyUpgrade(key);
          console.log(`Bought upgrade: ${upgrade.name}`);
        }
        return;
      }
      upgradeIndex++;
    }

    // Check start button
    const buttonY = canvas.height - 100;
    if (y >= buttonY && y <= buttonY + 50) {
      this.player.startNewRun();
      this.gameState.transitionTo("fight");
      return;
    }
  }

  handleDraftInput(x, y) {
    // Check option choices (only 2 now)
    const choiceHeight = 85;
    const choiceSpacing = 100;
    const startY = Math.max(120, (canvas.height - 2 * choiceSpacing) / 2 + 40);
    const margin = 15;

    this.gameState.draftChoices.forEach((choice, index) => {
      const choiceY = startY + index * choiceSpacing;
      if (y >= choiceY - 30 && y <= choiceY + 55) {
        // Zone plus large
        this.gameState.selectDraftChoice(index);
      }
    });

    // No reroll button in the new system
  }

  handleFightInput(x, y, currentTime) {
    // Check berserk button
    const buttonSize = 60;
    const margin = 20;
    const buttonX = canvas.width - buttonSize - margin;
    const buttonY = canvas.height - buttonSize - margin;

    if (
      x >= buttonX &&
      x <= buttonX + buttonSize &&
      y >= buttonY &&
      y <= buttonY + buttonSize
    ) {
      this.gameState.activateBerserk();
      return;
    }

    // Check central attack button (only during berserk mode)
    if (this.gameState.berserkMode) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

      if (distance <= 40) {
        // Central attack during berserk mode
        const damage = Math.ceil(this.gameState.player.baseDamage);
        this.gameState.currentEnemy.hp = Math.max(
          0,
          this.gameState.currentEnemy.hp - damage
        );
        this.createPawEffect(centerX, centerY);

        // Check for victory
        if (this.gameState.currentEnemy.hp <= 0) {
          this.gameState.berserkMode = false; // End berserk mode
          this.gameState.handleVictory();
        }
        return;
      }
    }

    // Normal combat logic (always available, even during berserk)
    // Create paw effect for every click
    this.createPawEffect(x, y);

    const result = this.gameState.handleClick(x, y, currentTime);
    if (result && result.parry) {
      const timingText = result.parry.timing.toUpperCase() + "!";
      const damageText = result.damage ? `${result.damage} DMG` : "";
      this.addFeedbackMessage(timingText, x, y);
      if (damageText) {
        this.addFeedbackMessage(damageText, x, y - 20); // Display damage above timing
      }
    }
  }

  drawBerserkButton() {
    const buttonSize = 60;
    const margin = 20;
    const x = canvas.width - buttonSize - margin;
    const y = canvas.height - buttonSize - margin;

    const canUse = this.gameState.canUseBerserk();
    const isActive = this.gameState.berserkMode;

    // Button background
    ctx.fillStyle = isActive
      ? "rgba(255, 87, 87, 0.8)"
      : canUse
      ? "rgba(57, 168, 255, 0.7)"
      : "rgba(100, 100, 100, 0.5)";
    ctx.fillRect(x, y, buttonSize, buttonSize);

    // Button border
    ctx.strokeStyle = isActive ? "#ff5757" : canUse ? "#39a8ff" : "#666";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, buttonSize, buttonSize);

    // Button icon (berserk symbol)
    ctx.fillStyle = isActive ? "#FFD700" : canUse ? "#fff" : "#999";
    ctx.font = getScaledFont(24, "bold");
    ctx.textAlign = "center";
    ctx.fillText("⚡", x + buttonSize / 2, y + buttonSize / 2 + 8);

    // Stamina indicator
    if (isActive) {
      const staminaPercent =
        this.gameState.player.stamina / this.gameState.player.maxStamina;
      ctx.fillStyle = "rgba(106, 184, 255, 0.8)";
      ctx.fillRect(
        x + 5,
        y + buttonSize - 8,
        (buttonSize - 10) * staminaPercent,
        3
      );
    }
  }

  drawCentralAttackButton() {
    if (!this.gameState.berserkMode) return;

    const buttonRadius = 40;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Pulsing attack button
    const time = Date.now();
    const pulse = 0.8 + 0.2 * Math.sin(time / 100);
    const currentRadius = buttonRadius * pulse;

    // Button background
    ctx.fillStyle = "rgba(255, 87, 87, 0.8)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Button border
    ctx.strokeStyle = "#ff5757";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Attack icon
    ctx.fillStyle = "#fff";
    ctx.font = 'bold 24px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("⚡", centerX, centerY + 8);

    // Instruction text
    ctx.fillStyle = "#fff";
    ctx.font = '12px Arial, "Helvetica Neue", Helvetica, sans-serif';
    ctx.fillText("SPAM CLICK!", centerX, centerY + currentRadius + 20);
  }
}

// Main game loop
function gameLoop(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  if (game) {
    game.update(deltaTime);
    game.render();
  }

  requestAnimationFrame(gameLoop);
}

// Window resize handler
window.addEventListener("resize", () => {
  if (game) {
    game.handleResize();
  }
});

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
