/**
 * Clicker Pawry - Classes Module Index
 * Central import point for all game classes
 */

// Import all class modules
if (typeof module !== "undefined" && module.exports) {
  const Skills = require("./Skills.js");
  const Enemies = require("./Enemies.js");
  const Player = require("./Player.js");
  const GameState = require("./GameState.js");

  module.exports = {
    // Skills
    Skill: Skills.Skill,
    SKILLS_DATA: Skills.SKILLS_DATA,
    createSkill: Skills.createSkill,
    getAllSkillIds: Skills.getAllSkillIds,
    getActiveSkillIds: Skills.getActiveSkillIds,
    getPassiveSkillIds: Skills.getPassiveSkillIds,

    // Enemies
    Enemy: Enemies.Enemy,
    RING_TYPES: Enemies.RING_TYPES,
    ENEMY_ARCHETYPES: Enemies.ENEMY_ARCHETYPES,
    createEnemy: Enemies.createEnemy,
    getMajorBossArchetype: Enemies.getMajorBossArchetype,
    getAvailableMinibossArchetypes: Enemies.getAvailableMinibossArchetypes,

    // Player
    Player: Player.Player,
    META_UPGRADES: Player.META_UPGRADES,

    // Game State
    GameState: GameState.GameState,
    GAME_STATES: GameState.GAME_STATES,
    DraftChoice: GameState.DraftChoice,
  };
}

// Browser globals (when loaded via script tags)
if (typeof window !== "undefined") {
  // All classes will be available globally
  // due to the individual script includes

  window.ClickerPawry = window.ClickerPawry || {};
  window.ClickerPawry.Classes = {
    // Will be populated when script files are loaded
    ready: false,
  };

  // Mark as ready when all scripts are loaded
  window.addEventListener("load", () => {
    if (
      typeof Skill !== "undefined" &&
      typeof Enemy !== "undefined" &&
      typeof Player !== "undefined" &&
      typeof GameState !== "undefined"
    ) {
      window.ClickerPawry.Classes.ready = true;
      console.log("Clicker Pawry class modules loaded successfully");
    }
  });
}
