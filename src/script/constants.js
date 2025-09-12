const FONT_SCALE = 1.2;
const PLAYER_BASE_STATS = {
  MAX_HP: 9,
  MAX_STAMINA: 100,
  BASE_STAMINA_REGEN: 10.0,
  BASE_DAMAGE: 1.0,
};
const DRAFT_OPTIONS = {
  HEAL: { name: "Heal", description: "Restore 2 hearts", effect: "heal" },
  GOLD: {
    name: "Bonus Gold",
    description: "Gain 20 extra gold",
    effect: "gold",
  },
};
const SAVE_KEYS = {
  PERSISTENT_DATA: "js13k25_clickerpawry",
  RUN_DATA: "js13k25_clickerpawry_run",
};
const META_UPGRADES = {
  MAX_STAMINA: {
    name: "Max Stamina",
    description: "+20 max stamina per level",
    maxLevel: 5,
    costs: [60, 120, 200, 300, 440],
    effect: (e) => e * 20,
  },
  STAMINA_REGEN: {
    name: "Stamina Regen",
    description: "+2/s stamina regen per level",
    maxLevel: 5,
    costs: [60, 120, 200, 300, 440],
    effect: (e) => e * 2.0,
  },
  ATTACK_POWER: {
    name: "Attack Power",
    description: "+1 per level",
    maxLevel: 5,
    costs: [80, 140, 220, 320, 460],
    effect: (e) => e * 1.0,
  },
};
const RING_TYPES = { WHITE: "W", BLUE: "B", RED: "R" };
const PARRY_WINDOWS = { PERFECT: 80, GOOD: 160 };
const ENEMY_ARCHETYPES = {
  A: {
    name: "Mice",
    patterns: { white: 0.7, red: 0.3 },
    interval: 800,
    ringDurations: { white: 950, red: 1000 },
  },
  C: {
    name: "Dog",
    patterns: { white: 0.8, red: 0.2 },
    interval: 1000,
    ringDurations: { white: 850, red: 800 },
  },
};
const RING_DAMAGE = {
  MINIBOSS: { W: 1, B: 0, R: 1 },
  MAJOR: { W: 1, B: 0, R: 1 },
};
const ENEMY_BASE_HP = [0, 12, 14, 25, 18, 20, 40, 26, 28, 60, 34, 36, 85];
const GAME_STATES = {
  LOBBY: "lobby",
  DRAFT: "draft",
  FIGHT: "fight",
  VICTORY: "victory",
  DEFEAT: "defeat",
  ENDLESS: "endless",
};
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
