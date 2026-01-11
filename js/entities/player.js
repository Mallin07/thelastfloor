//player.js
import { playerAttack } from "../systems/combat_system.js";
import { logOk } from "../ui/log.js";

export function attack(state){
  playerAttack(state);
}

export function usePotion(state){
  if (state.over) return;
  const p = state.player;
  if (p.potions <= 0) return;
  if (p.hp >= p.hpMax) return;

  p.potions -= 1;
  const heal = Math.min(10, p.hpMax - p.hp);
  p.hp += heal;
  logOk(`Te curas ${heal} HP usando una poción.`);
}