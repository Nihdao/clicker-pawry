/**
 * Clicker Pawry - Enemy System
 * Contains enemy classes and logic using centralized constants
 */

// Import constants
import {
  RING_TYPES,
  ARCHETYPE_IDS,
  COMBAT_CONSTANTS,
  FLOOR_HP,
  MAJOR_BOSS_FLOORS,
  ENEMY_ARCHETYPES,
  ENEMY_HELPERS,
} from "../data/index.js";

// Base Enemy class
class Enemy {
  constructor(archetype, floor, isUltimate = false) {
    this.archetype = archetype;
    this.floor = floor;
    this.isUltimate = isUltimate;
    this.maxHp = this.calculateHp();
    this.hp = this.maxHp;
    this.lastRingSpawn = 0;
    this.ringQueue = [];
    this.isDefeated = false;
    this.combatTime = 0;

    // Get archetype data
    this.data = ENEMY_HELPERS.getArchetypeData(archetype);
    if (!this.data) {
      console.error(`Unknown enemy archetype: ${archetype}`);
    }
  }

  calculateHp() {
    let baseHp = ENEMY_HELPERS.getFloorHp(this.floor);

    // Apply archetype modifier if any
    if (this.data && this.data.hpModifier) {
      baseHp *= this.data.hpModifier;
    }

    // Apply endless scaling if floor > 12
    if (this.floor > 12) {
      const endlessLevel = this.floor - 12;
      baseHp *= Math.pow(
        COMBAT_CONSTANTS.ENDLESS_SCALING.HP_MULTIPLIER,
        endlessLevel
      );
    }

    return Math.floor(baseHp);
  }

  isMajorBoss() {
    return ENEMY_HELPERS.isMajorBossFloor(this.floor) || this.isUltimate;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.isDefeated = true;
    }
    return this.isDefeated;
  }

  getBaseDamage(ringType) {
    const isMajor = this.isMajorBoss();
    const damageTable = isMajor
      ? COMBAT_CONSTANTS.MAJOR_BOSS_DAMAGE
      : COMBAT_CONSTANTS.MINIBOSS_DAMAGE;

    let damage = damageTable[ringType] || 0;

    // Apply Ultimate modifier
    if (this.isUltimate && this.data.ultimateModifiers.damage) {
      damage += this.data.ultimateModifiers.damage;
    }

    // Apply endless scaling if needed
    if (this.floor > 12) {
      const endlessLevel = this.floor - 12;
      damage *= Math.pow(
        COMBAT_CONSTANTS.ENDLESS_SCALING.DAMAGE_MULTIPLIER,
        endlessLevel
      );
      damage = Math.floor(damage);
    }

    return damage;
  }

  update(deltaTime, currentTime) {
    this.combatTime += deltaTime;

    if (this.isDefeated) return;

    // Check if it's time to spawn a new ring
    const timeSinceLastRing = currentTime - this.lastRingSpawn;
    const spawnInterval = this.getSpawnInterval();

    if (timeSinceLastRing >= spawnInterval) {
      this.spawnRing(currentTime);
      this.lastRingSpawn = currentTime;
    }
  }

  getSpawnInterval() {
    return this.data.interval;
  }

  spawnRing(currentTime) {
    const ringType = this.selectRingType();
    const ring = this.createRing(ringType, currentTime);
    this.ringQueue.push(ring);
    return ring;
  }

  selectRingType() {
    // This will be implemented by each archetype
    const pattern = this.data.pattern;
    const rand = Math.random();

    let cumulative = 0;
    for (const [type, probability] of Object.entries(pattern)) {
      cumulative += probability;
      if (rand <= cumulative) {
        return type;
      }
    }

    return RING_TYPES.WHITE; // Fallback
  }

  createRing(ringType, spawnTime) {
    const data =
      this.data.ringTimings[ringType] || this.data.ringTimings.default;

    const duration = data.duration;

    return {
      type: ringType,
      spawnTime: spawnTime,
      duration: duration,
      startRadius: COMBAT_CONSTANTS.RING_VISUALS.START_RADIUS,
      targetRadius: COMBAT_CONSTANTS.RING_VISUALS.TARGET_RADIUS,
      damage: this.getBaseDamage(ringType),
      isActive: true,
      wasParried: false,
    };
  }
}

// Enemy archetypes data is now imported from data/enemies.js

// Factory function to create enemies
function createEnemy(archetype, floor, isUltimate = false) {
  return new Enemy(archetype, floor, isUltimate);
}

// Enemy helper functions (now using imported helpers)
const getMajorBossArchetype = ENEMY_HELPERS.getMajorBossArchetype;
const getAvailableMinibossArchetypes =
  ENEMY_HELPERS.getAvailableMinibossArchetypes;

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    Enemy,
    createEnemy,
    getMajorBossArchetype,
    getAvailableMinibossArchetypes,
    // Re-export imported constants for backward compatibility
    RING_TYPES,
    ARCHETYPE_IDS,
    ENEMY_ARCHETYPES,
    COMBAT_CONSTANTS,
    FLOOR_HP,
    MAJOR_BOSS_FLOORS,
  };
}
