/**
 * Clicker Pawry - Player System
 * Contains player stats, meta progression, and persistent data management
 */

// Meta upgrade definitions
const META_UPGRADES = {
  maxStamina: {
    name: "Max Stamina",
    description: "Increase maximum stamina",
    maxLevel: 5,
    baseCost: 30,
    costMultiplier: [1, 2, 3.33, 5, 7.33], // 30, 60, 100, 150, 220
    bonusPerLevel: 1, // +1 max stamina per level
    baseValue: 10, // Base max stamina
  },

  staminaRegen: {
    name: "Stamina Regen",
    description: "Increase stamina regeneration rate",
    maxLevel: 5,
    baseCost: 30,
    costMultiplier: [1, 2, 3.33, 5, 7.33], // 30, 60, 100, 150, 220
    bonusPerLevel: 0.4, // +0.4/s per level
    baseValue: 2.0, // Base 2.0/s
  },

  attackPower: {
    name: "Attack Power",
    description: "Increase base attack damage",
    maxLevel: 5,
    baseCost: 40,
    costMultiplier: [1, 1.75, 2.75, 4, 5.75], // 40, 70, 110, 160, 230
    bonusPerLevel: 0.2, // +0.2 base damage per level
    baseValue: 1.0, // Base 1.0 damage
  },

  cooldownReduction: {
    name: "Cooldown Reduction",
    description: "Reduce all skill cooldowns",
    maxLevel: 5,
    baseCost: 50,
    costMultiplier: [1, 1.6, 2.4, 3.4, 4.8], // 50, 80, 120, 170, 240
    reductionPerLevel: 0.06, // 6% reduction per level (multiply CDs by 0.94^level)
    baseMultiplier: 1.0,
  },

  freeRerolls: {
    name: "Free Rerolls",
    description: "Additional free rerolls per floor",
    maxLevel: 5,
    baseCost: 40,
    costMultiplier: [1, 1.75, 2.75, 4, 5.75], // 40, 70, 110, 160, 230
    bonusPerLevel: 1, // +1 reroll per floor per level
    baseValue: 0, // Base 0 free rerolls
  },
};

// Player class with all stats and progression
class Player {
  constructor() {
    // Core combat stats
    this.maxHp = 9;
    this.hp = 9;
    this.maxStamina = 100;
    this.stamina = 100;
    this.staminaRegen = 2.0; // per second
    this.baseDamage = 1.0;
    this.isExhausted = false;
    this.exhaustEndTime = 0;

    // Combat state
    this.shields = 0; // From Shield passive skill
    this.isInvulnerable = false;
    this.damageMultipliers = [];
    this.comboCounter = 0;
    this.perfectParries = 0; // For gold bonus

    // Meta progression (persistent)
    this.gold = 0;
    this.metaUpgrades = {
      maxStamina: 0,
      staminaRegen: 0,
      attackPower: 0,
      cooldownReduction: 0,
      freeRerolls: 0,
    };

    // Skills (current run)
    this.skills = []; // Array of Skill instances
    this.maxSkills = 3;

    // Run state
    this.currentFloor = 1;
    this.rerollsUsed = 0;
    this.hasResurrection = false;
    this.resurrectionUsed = false;

    // Apply meta upgrades to base stats
    this.applyMetaUpgrades();
  }

  applyMetaUpgrades() {
    // Update max stamina
    const staminaUpgrade = META_UPGRADES.maxStamina;
    this.maxStamina =
      staminaUpgrade.baseValue +
      this.metaUpgrades.maxStamina * staminaUpgrade.bonusPerLevel;

    // Update stamina regen
    const regenUpgrade = META_UPGRADES.staminaRegen;
    this.staminaRegen =
      regenUpgrade.baseValue +
      this.metaUpgrades.staminaRegen * regenUpgrade.bonusPerLevel;

    // Update base damage
    const damageUpgrade = META_UPGRADES.attackPower;
    this.baseDamage =
      damageUpgrade.baseValue +
      this.metaUpgrades.attackPower * damageUpgrade.bonusPerLevel;
  }

  // Combat methods
  canAttack() {
    return this.stamina >= 1 && !this.isExhausted;
  }

  attack() {
    if (!this.canAttack()) return false;

    // Check if Stamina Frenzy is active
    const frenzySkill = this.getActiveSkill("stamina_frenzy");
    if (!frenzySkill) {
      this.stamina = Math.max(0, this.stamina - 1);

      if (this.stamina === 0) {
        this.isExhausted = true;
        this.exhaustEndTime = Date.now() + 750; // 0.75s exhaust
      }
    }

    this.comboCounter++;
    return true;
  }

  calculateDamage() {
    let damage = this.baseDamage;

    // Apply damage multipliers from active skills
    for (const multiplier of this.damageMultipliers) {
      damage *= multiplier;
    }

    // Check for combo skill
    const comboSkill = this.getPassiveSkill("combo");
    if (comboSkill) {
      const comboInterval = comboSkill.getEffectValue();
      if (this.comboCounter % comboInterval === 0) {
        damage *= 3; // Triple damage on combo
      }
    }

    return Math.round(damage * 10) / 10; // Round to 1 decimal
  }

  takeDamage(amount) {
    if (this.isInvulnerable) return false;

    // Check shields first
    if (this.shields > 0) {
      this.shields--;
      return false;
    }

    this.hp = Math.max(0, this.hp - amount);

    if (this.hp === 0) {
      return this.handleDeath();
    }

    return false;
  }

  handleDeath() {
    // Check for resurrection
    const resSkill = this.getPassiveSkill("resurrection");
    if (resSkill && !this.resurrectionUsed) {
      this.hp = resSkill.getEffectValue();
      this.resurrectionUsed = true;
      return false; // Not actually dead
    }

    return true; // Player is dead
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  update(deltaTime) {
    const currentTime = Date.now();

    // Update exhaustion
    if (this.isExhausted && currentTime >= this.exhaustEndTime) {
      this.isExhausted = false;
    }

    // Regenerate stamina (only if not exhausted)
    if (!this.isExhausted && this.stamina < this.maxStamina) {
      const regenAmount = (this.staminaRegen * deltaTime) / 1000;
      this.stamina = Math.min(this.maxStamina, this.stamina + regenAmount);
    }

    // Update skills
    for (const skill of this.skills) {
      skill.update(deltaTime);
    }

    // Update damage multipliers from active skills
    this.updateDamageMultipliers();
  }

  updateDamageMultipliers() {
    this.damageMultipliers = [];

    // Check for Attack Boost skill
    const boostSkill = this.getActiveSkill("damage_boost");
    if (boostSkill && boostSkill.isActive) {
      this.damageMultipliers.push(boostSkill.getEffectValue());
    }
  }

  // Skill management
  addSkill(skill) {
    // Check if skill already exists (level it up)
    const existingSkill = this.skills.find((s) => s.id === skill.id);
    if (existingSkill) {
      return existingSkill.levelUp();
    }

    // Add new skill if we have space
    if (this.skills.length < this.maxSkills) {
      this.skills.push(skill);
      return true;
    }

    return false;
  }

  getActiveSkill(effectType) {
    return this.skills.find(
      (skill) =>
        skill.type === "active" &&
        skill.isActive &&
        SKILLS_DATA[skill.id]?.effect === effectType
    );
  }

  getPassiveSkill(effectType) {
    return this.skills.find(
      (skill) =>
        skill.type === "passive" &&
        skill.currentLevel > 0 &&
        SKILLS_DATA[skill.id]?.effect === effectType
    );
  }

  // Meta progression
  canAffordUpgrade(upgradeType) {
    const upgrade = META_UPGRADES[upgradeType];
    if (!upgrade || this.metaUpgrades[upgradeType] >= upgrade.maxLevel) {
      return false;
    }

    const cost = this.getUpgradeCost(upgradeType);
    return this.gold >= cost;
  }

  getUpgradeCost(upgradeType) {
    const upgrade = META_UPGRADES[upgradeType];
    if (!upgrade) return 0;

    const currentLevel = this.metaUpgrades[upgradeType];
    if (currentLevel >= upgrade.maxLevel) return 0;

    const multiplier = upgrade.costMultiplier[currentLevel];
    return Math.floor(upgrade.baseCost * multiplier);
  }

  purchaseUpgrade(upgradeType) {
    if (!this.canAffordUpgrade(upgradeType)) return false;

    const cost = this.getUpgradeCost(upgradeType);
    this.gold -= cost;
    this.metaUpgrades[upgradeType]++;

    this.applyMetaUpgrades();
    return true;
  }

  // Gold management
  addGold(baseAmount) {
    let finalAmount = baseAmount;

    // Apply gold bonus from Extra Rewards skill
    const goldSkill = this.getPassiveSkill("gold_bonus");
    if (goldSkill) {
      const bonus = goldSkill.getEffectValue();
      finalAmount = Math.floor(baseAmount * (1 + bonus));
    }

    // Perfect parry bonus (+1 gold per perfect, max +5)
    const perfectBonus = Math.min(5, this.perfectParries);
    finalAmount += perfectBonus;

    this.gold += finalAmount;
    return finalAmount;
  }

  // Battle preparation
  prepareFight() {
    // Reset combat state
    this.shields = 0;
    this.comboCounter = 0;
    this.perfectParries = 0;
    this.isInvulnerable = false;
    this.damageMultipliers = [];

    // Apply Shield skill
    const shieldSkill = this.getPassiveSkill("shield");
    if (shieldSkill) {
      this.shields = shieldSkill.getEffectValue();
    }

    // Reset skill cooldowns (optional, based on game design)
    // for (const skill of this.skills) {
    //   skill.cooldownRemaining = 0;
    // }
  }

  // Post-victory healing
  victoryHeal() {
    const healSkill = this.getPassiveSkill("victory_heal");
    if (healSkill) {
      this.heal(healSkill.getEffectValue());
    }
  }

  // Persistence
  saveToLocalStorage() {
    const saveData = {
      gold: this.gold,
      metaUpgrades: { ...this.metaUpgrades },
      currentFloor: this.currentFloor,
    };

    localStorage.setItem("js13k25_clickerpawry", JSON.stringify(saveData));
  }

  loadFromLocalStorage() {
    const saveData = localStorage.getItem("js13k25_clickerpawry");
    if (!saveData) return false;

    try {
      const data = JSON.parse(saveData);
      this.gold = data.gold || 0;
      this.metaUpgrades = { ...this.metaUpgrades, ...data.metaUpgrades };
      this.currentFloor = data.currentFloor || 1;
      this.applyMetaUpgrades();
      return true;
    } catch (e) {
      console.error("Failed to load save data:", e);
      return false;
    }
  }

  // New run initialization
  startNewRun() {
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.currentFloor = 1;
    this.skills = [];
    this.rerollsUsed = 0;
    this.resurrectionUsed = false;
    this.prepareFight();
  }

  getAvailableRerolls() {
    const freeRerolls = this.metaUpgrades.freeRerolls;
    return Math.max(0, freeRerolls - this.rerollsUsed);
  }

  getCooldownMultiplier() {
    const cdReduction = META_UPGRADES.cooldownReduction;
    const level = this.metaUpgrades.cooldownReduction;
    return Math.pow(0.94, level);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    Player,
    META_UPGRADES,
  };
}
