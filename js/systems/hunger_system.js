import { logBad } from "../ui/log.js";

const HUNGER_DRAIN_PER_MIN = 5;     // puntos por minuto
const STARVE_HP_PCT_PER_MIN = 0.05; // 5% de la vida máxima por minuto
const SAFE_MAPS = new Set(["town_01"]);

export function updateHunger(state, dt){
  const p = state.player;
  if (state.over) return;

  // Inicialización defensiva
  p.hungerMax ??= 100;
  p.hunger ??= p.hungerMax;

  // En town no hay hambre
  if (SAFE_MAPS.has(state.mapId)) return;

  // ↓ hambre con el tiempo
  const drainPerSec = HUNGER_DRAIN_PER_MIN / 60;
  p.hunger = Math.max(0, p.hunger - drainPerSec * dt);

  // Daño por inanición
  if (p.hunger === 0){
    p._starveAcc ??= 0;
    p._starveAcc += dt;

    while (p._starveAcc >= 1){
      p._starveAcc -= 1;

      const dmg = Math.max(
        1,
        Math.floor((STARVE_HP_PCT_PER_MIN / 60) * p.hpMax)
      );

      p.hp -= dmg;
      logBad("Te mueres de hambre…");

      if (p.hp <= 0){
        p.hp = 0;
        state.over = true;
        logBad("Has muerto de inanición.");
        break;
      }
    }
  } else {
    p._starveAcc = 0;
  }
}
