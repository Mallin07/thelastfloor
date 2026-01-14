// js/entities/enemy.js
import { CONFIG } from "../core/config.js";

const ENEMY_DEFS = {
slime: {
  r: 12,
  hp: 8,
  atk: 2,
  xp: 4,
  speedMul: 0.85,
  aggroRange: 4.0,
  attackRange: 0.8,
  attackCooldownMs: 900,
  wanderRadiusPx: 1.1 * CONFIG.TILE,
  wanderSpeedMul: 0.18,
  drops: [
    {
      chance: 0.3,
      item: { type: "slime_soul", qty: 1 }
    }
  ]
},

spider: {
  r: 12,
  hp: 12,
  atk: 2,
  xp: 6,
  speedMul: 0.9,
  aggroRange: 4.0,
  attackRange: 0.8,
  attackCooldownMs: 650,
  wanderRadiusPx: 4.0 * CONFIG.TILE,
  wanderSpeedMul: 0.28,

  drops: [
    {
      chance: 0.3,
      item: { type: "hilo", qty: 1 }
    }
  ]
},

goblin: {
  r: 12,
  hp: 12,
  atk: 3,
  xp: 6,
  speedMul: 0.9,
  aggroRange: 4.0,
  attackRange: 0.8,
  attackCooldownMs: 650,
  wanderRadiusPx: 4.0 * CONFIG.TILE,
  wanderSpeedMul: 0.28,
  // ✅ DROP DEL GOBLIN
  drops: [
    {
      chance: 0.3,
      item: { type: "goblin_claw", qty: 1 }
    }
  ]
},


wolf: {
  r: 12,
  hp: 18,
  atk: 4,
  xp: 8,
  speedMul: 1,
  aggroRange: 4.0,
  attackRange: 0.8,
  attackCooldownMs: 650,
  wanderRadiusPx: 4.0 * CONFIG.TILE,
  wanderSpeedMul: 0.28,

  drops: [
    {
      chance: 0.3,
      item: { type: "wolf_leather", qty: 1 }
    }
  ]
}


};

function defFor(type){
  return ENEMY_DEFS[type] ?? ENEMY_DEFS.goblin;
}

export function makeEnemy(type, px, py){
  const d = defFor(type);

  return {
    kind: "enemy",
    type,

    px,
    py,

    r: d.r,

    hp: d.hp,
    hpMax: d.hp,

    lastHitAt: -Infinity,

    atk: d.atk,
    xp: d.xp,

    speedMul: d.speedMul,
    aggroRangePx: d.aggroRange * CONFIG.TILE,
    attackRangePx: d.attackRange * CONFIG.TILE,
    attackCooldownMs: d.attackCooldownMs,

    wanderRadiusPx: d.wanderRadiusPx,
    wanderSpeedMul: d.wanderSpeedMul,

    // ✅ PASAMOS LOS DROPS
    drops: d.drops ?? []
  };
}

