/**
 * Clicker Pawry - Game Constants
 * All game constants and data for easy modification and balancing
 */

// Font size multiplier for better readability
const FONT_SCALE = 1.2; // Reduced from 1.4 to 1.1 (30% reduction)

// Player base stats
const PLAYER_BASE_STATS = {
  MAX_HP: 9,
  MAX_STAMINA: 100,
  BASE_STAMINA_REGEN: 10.0,
  BASE_DAMAGE: 1.0,
};

// Draft options
const DRAFT_OPTIONS = {
  HEAL: {
    name: "Heal",
    description: "Restore 2 hearts",
    effect: "heal",
  },
  GOLD: {
    name: "Bonus Gold",
    description: "Gain 20 extra gold",
    effect: "gold",
  },
};

// Save data keys
const SAVE_KEYS = {
  PERSISTENT_DATA: "js13k25_clickerpawry",
  RUN_DATA: "js13k25_clickerpawry_run",
};

// Meta-progression upgrades
const META_UPGRADES = {
  MAX_STAMINA: {
    name: "Max Stamina",
    description: "+20 max stamina per level",
    maxLevel: 5,
    costs: [60, 120, 200, 300, 440],
    effect: (level) => level * 20, // +20 per level (base 100 → 200)
  },
  STAMINA_REGEN: {
    name: "Stamina Regen",
    description: "+2/s stamina regen per level",
    maxLevel: 5,
    costs: [60, 120, 200, 300, 440],
    effect: (level) => level * 2.0, // +2.0 per level (base 10.0 → 20.0/s)
  },
  ATTACK_POWER: {
    name: "Attack Power",
    description: "+1 per level",
    maxLevel: 5,
    costs: [80, 140, 220, 320, 460],
    effect: (level) => level * 1.0, // +1 per level (base 1.0 → 6.0)
  },
};

// Ring and parry constants
const RING_TYPES = {
  WHITE: "W",
  BLUE: "B",
  RED: "R",
};

const PARRY_WINDOWS = {
  PERFECT: 80, // ±80ms
  GOOD: 160, // ±160ms
};

// Enemy archetype patterns (vitesse augmentée + progression)
const ENEMY_ARCHETYPES = {
  A: {
    // Mice - ennemi rapide et agile
    name: "Mice",
    patterns: { white: 0.7, red: 0.3 },
    interval: 800, // Plus rapide
    ringDurations: { white: 950, red: 1000 },
  },
  B: {
    // Fox - rusé avec attaques rapides
    name: "Fox",
    patterns: { white: 0.6, red: 0.4 },
    interval: 1000, // Plus lent
    ringDurations: { white: 650, red: 950 },
  },
  C: {
    // Dog - équilibré avec attaques rapides
    name: "Dog",
    patterns: { white: 0.8, red: 0.2 },
    interval: 1000, // Intervalle standard
    ringDurations: { white: 850, red: 800 },
  },
  D: {
    // Bear - fort avec attaques lourdes
    name: "Bear",
    patterns: { white: 0.3, red: 0.7 },
    interval: 1200, // Plus lent mais plus fort
    ringDurations: { white: 1100, red: 800 },
  },
};

const RING_DAMAGE = {
  MINIBOSS: { W: 1, B: 0, R: 1 },
  MAJOR: { W: 1, B: 0, R: 1 },
};

// Enemy and combat constants
const ENEMY_BASE_HP = [0, 12, 14, 25, 18, 20, 40, 26, 28, 60, 34, 36, 85]; // Index = floor

// Skills system removed - no longer used in current gameplay

// Game states
const GAME_STATES = {
  LOBBY: "lobby",
  DRAFT: "draft",
  FIGHT: "fight",
  VICTORY: "victory",
  DEFEAT: "defeat",
  ENDLESS: "endless",
};

// Export for browser global namespace
if (typeof window !== "undefined") {
  window.ClickerPawryConstants = {
    FONT_SCALE,
    PLAYER_BASE_STATS,
    DRAFT_OPTIONS,
    SAVE_KEYS,
    META_UPGRADES,
    RING_TYPES,
    PARRY_WINDOWS,
    ENEMY_ARCHETYPES,
    RING_DAMAGE,
    ENEMY_BASE_HP,
    GAME_STATES,
  };
}
