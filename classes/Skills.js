/**
 * Clicker Pawry - Skills System
 * Contains skill classes and logic using centralized constants
 */

// Import constants
import {
  SKILL_TYPES,
  SKILL_IDS,
  SKILLS_DATA,
  SKILL_CONSTANTS,
  SKILL_HELPERS,
} from "../data/index.js";

// Base Skill class
class Skill {
  constructor(id, name, type, maxLevel = SKILL_CONSTANTS.MAX_LEVEL) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.maxLevel = maxLevel;
    this.currentLevel = 0;
    this.isActive = false; // For active skills during combat
    this.cooldownRemaining = 0;
    this.activeUntil = 0; // Timestamp when effect ends
  }

  levelUp() {
    if (this.currentLevel < this.maxLevel) {
      this.currentLevel++;
      return true;
    }
    return false;
  }

  isMaxLevel() {
    return this.currentLevel >= this.maxLevel;
  }

  canActivate(currentTime) {
    return (
      this.type === SKILL_TYPES.ACTIVE &&
      this.currentLevel > 0 &&
      this.cooldownRemaining <= 0 &&
      currentTime >= this.activeUntil
    );
  }

  activate(currentTime) {
    if (!this.canActivate(currentTime)) return false;

    const skillData = SKILLS_DATA[this.id];
    if (skillData && skillData.duration) {
      this.activeUntil =
        currentTime + skillData.duration[this.currentLevel - 1] * 1000;
      this.cooldownRemaining = skillData.cooldown * 1000; // Convert to ms
      this.isActive = true;
      return true;
    }
    return false;
  }

  update(deltaTime) {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - deltaTime);
    }

    const currentTime = Date.now();
    if (this.isActive && currentTime >= this.activeUntil) {
      this.isActive = false;
    }
  }

  getEffectValue() {
    if (this.currentLevel === 0) return 0;

    const skillData = SKILLS_DATA[this.id];
    if (!skillData || !skillData.values) return 0;

    return skillData.values[this.currentLevel - 1];
  }
}

// Skills data is now imported from data/skills.js

// Factory function to create skills
function createSkill(skillId) {
  const data = SKILLS_DATA[skillId];
  if (!data) {
    console.error(`Skill with ID ${skillId} not found`);
    return null;
  }

  return new Skill(skillId, data.name, data.type);
}

// Skill helper functions (now using imported helpers)
const getAllSkillIds = SKILL_HELPERS.getAllSkillIds;
const getActiveSkillIds = SKILL_HELPERS.getActiveSkillIds;
const getPassiveSkillIds = SKILL_HELPERS.getPassiveSkillIds;

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    Skill,
    createSkill,
    getAllSkillIds,
    getActiveSkillIds,
    getPassiveSkillIds,
    // Re-export imported constants for backward compatibility
    SKILLS_DATA,
    SKILL_TYPES,
    SKILL_IDS,
    SKILL_CONSTANTS,
  };
}
