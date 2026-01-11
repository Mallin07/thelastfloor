// js/entities/animal.js
import { CONFIG } from "../core/config.js";

const ANIMAL_DEFS = {
  hare: {
    r: 10,
    hp: 6,
    speedMul: 0.9,          // rápida
    fearRangeTiles: 3.5,     // empieza a huir si te acercas
    fleeSpeedMul: 0.9,      // aún más rápida huyendo
    wanderRadiusPx: 3.0 * CONFIG.TILE,
    wanderSpeedMul: 0.22,
    drop: "hare_meat",
  }
};

function defFor(type){
  return ANIMAL_DEFS[type] ?? ANIMAL_DEFS.hare;
}

export function makeAnimal(type, px, py){
  const d = defFor(type);
  return {
    kind: "animal",
    type,

    px, py,
    r: d.r,

    hp: d.hp,
    hpMax: d.hp,

    // IA
    speedMul: d.speedMul,
    fearRangePx: d.fearRangeTiles * CONFIG.TILE,
    fleeSpeedMul: d.fleeSpeedMul,
    wanderRadiusPx: d.wanderRadiusPx,
    wanderSpeedMul: d.wanderSpeedMul,

    drop: d.drop,
  };
}
