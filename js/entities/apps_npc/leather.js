// js/entities/apps_npc/leather.js

import { RECIPES as LEATHER_RECIPES } from "../../data/recipes/leather_recipes_db.js";
import { addToInventory } from "../inventory.js";
import { logOk, logBad } from "../../ui/log.js";
import { makeItem } from "../item_factory.js";
import { onQuestEvent } from "../quests.js";
import { playSound } from "../../ui/audio.js";

export function canLeatherCraft(state, recipeId) {
  const r = LEATHER_RECIPES?.[recipeId];
  if (!r) return { ok:false, reason:"missing", value: recipeId };

  const lvl = state.player?.lvl ?? 1;
  if (r.requires?.level && lvl < r.requires.level) {
    return { ok:false, reason:"level", value: r.requires.level };
  }

  if (r.requires?.quest && !state.player?.questsDone?.[r.requires.quest]) {
    return { ok:false, reason:"quest", value: r.requires.quest };
  }

  const gold = state.player?.gold ?? 0;
  if ((r.costGold ?? 0) > gold) {
    return { ok:false, reason:"gold", value: r.costGold };
  }

  for (const ing of (r.ingredients ?? [])) {
    const have = countHave(state.player.inventory, ing.type);
    if (have < ing.qty) {
      return {
        ok:false,
        reason:"ingredients",
        value:{ type: ing.type, have, need: ing.qty }
      };
    }
  }

  return { ok:true };
}

export function leatherCraftRecipe(state, recipeId) {
  const r = LEATHER_RECIPES?.[recipeId];
  if (!r) {
    logBad(`Receta no existe: ${recipeId}`);
    return false;
  }

  const check = canLeatherCraft(state, recipeId);
  if (!check.ok) {
    logBad("No puedes crear eso todavía.");
    return false;
  }

  // pagar
  state.player.gold -= (r.costGold ?? 0);

  // consumir ingredientes
  for (const ing of (r.ingredients ?? [])) {
    consumeInv(state, ing.type, ing.qty);
  }

  // crear item
  const item = makeItem(r.result.type);
  if (!addToInventory(state, item)) {
    logBad("Inventario lleno.");
    return false;
  }

  onQuestEvent(state, "craft", { recipeId, kind:"leather" });
  logOk(`Has creado: ${r.name}`);

  playSound("leatherwork"); // 🔊 sonido peletería

  return true;
}

// helpers (idénticos a carpintería)
function invQty(it){ return Number.isFinite(it?.qty) ? it.qty : (it ? 1 : 0); }
function countHave(inv, type){
  let total = 0;
  for (const it of inv) if (it && it.type === type) total += invQty(it);
  return total;
}
function consumeInv(state, type, qty){
  let left = qty;
  const inv = state.player.inventory;
  for (let i=0;i<inv.length && left>0;i++){
    const it = inv[i];
    if (!it || it.type !== type) continue;
    const have = invQty(it);
    const take = Math.min(have, left);
    if (Number.isFinite(it.qty)){
      it.qty -= take;
      if (it.qty <= 0) inv[i] = null;
    } else inv[i] = null;
    left -= take;
  }
}
