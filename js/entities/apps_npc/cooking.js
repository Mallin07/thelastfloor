// js/entities/apps_npc/cooking.js
import { RECIPES } from "../../data/recipes/cook_recipes_db.js";
import { addToInventory } from "../inventory.js";
import { logOk, logBad } from "../../ui/log.js";
import { makeItem } from "../item_factory.js";
import { onQuestEvent } from "../quests.js";
import { playSound } from "../../ui/audio.js"; 


// ----------------------------
// Helpers de inventario (copiados del estilo quests.js)
// ----------------------------
function invQty(item){
  return Number.isFinite(item?.qty) ? item.qty : (item ? 1 : 0);
}

function countInventoryType(state, type){
  const inv = state.player?.inventory ?? [];
  let total = 0;
  for (const it of inv){
    if (!it) continue;
    if (it.type === type) total += invQty(it);
  }
  return total;
}

function consumeInventoryType(state, type, amount){
  const inv = state.player?.inventory ?? [];
  let left = amount;

  for (let i = 0; i < inv.length && left > 0; i++){
    const it = inv[i];
    if (!it || it.type !== type) continue;

    const q = invQty(it);
    if (q <= left){
      inv[i] = null;
      left -= q;
    } else {
      inv[i] = { ...it, qty: q - left };
      left = 0;
    }
  }

  return left === 0;
}

// ----------------------------
// Requisitos (nivel + quest completada)
// ----------------------------
export function recipeRequirementsStatus(state, recipe){
  const r = recipe?.requires;
  if (!r) return { ok: true };

  if (r.level != null && (state.player?.lvl ?? 1) < r.level){
    return { ok: false, reason: "level", value: r.level };
  }
  if (r.completedQuest && !state.quests?.completed?.[r.completedQuest]){
    return { ok: false, reason: "quest", value: r.completedQuest };
  }
  return { ok: true };
}

// ----------------------------
// Checks de materiales + oro
// ----------------------------
export function canCook(state, recipeId){
  const recipe = RECIPES?.[recipeId];
  if (!recipe) return { ok:false, reason:"missing_recipe" };

  const req = recipeRequirementsStatus(state, recipe);
  if (!req.ok) return { ok:false, reason:req.reason, value:req.value };

  const cost = recipe.costGold ?? 0;
  const gold = state.player?.gold ?? 0;
  if (gold < cost) return { ok:false, reason:"gold", value: cost };

  const needs = recipe.ingredients ?? [];
  for (const ing of needs){
    const have = countInventoryType(state, ing.type);
    if (have < ing.qty){
      return { ok:false, reason:"ingredients", value:{ type: ing.type, need: ing.qty, have } };
    }
  }

  return { ok:true };
}

// ----------------------------
// Cocinar (pagar + consumir + crear item)
// ----------------------------
export function cookRecipe(state, recipeId){
  const recipe = RECIPES?.[recipeId];
  if (!recipe){
    logBad("Esa receta no existe.");
    return false;
  }

  const check = canCook(state, recipeId);
  if (!check.ok){
    if (check.reason === "level") logBad(`Necesitas nivel ${check.value}.`);
    else if (check.reason === "quest") logBad(`Primero completa la misión: ${check.value}.`);
    else if (check.reason === "gold") logBad(`Necesitas ${recipe.costGold ?? 0} oro.`);
    else if (check.reason === "ingredients"){
      const v = check.value;
      logBad(`Te falta: ${v.type} (${v.have}/${v.need}).`);
    } else {
      logBad("No puedes cocinar ahora mismo.");
    }
    return false;
  }

  // 1) Restar oro
  const cost = recipe.costGold ?? 0;
  state.player.gold = (state.player.gold ?? 0) - cost;

  // 2) Consumir ingredientes
  for (const ing of (recipe.ingredients ?? [])){
    const ok = consumeInventoryType(state, ing.type, ing.qty);
    if (!ok){
      logBad("Error: faltan ingredientes.");
      return false;
    }
  }

  // 3) Crear el item resultado (desde el catálogo)
  const result = recipe.result;
  if (!result || !result.type){
    logBad("Error: esta receta no tiene resultado válido.");
    return false;
  }

  const outQty = Number.isFinite(result.qty) ? result.qty : 1;
  let firstItem = null;

  for (let i = 0; i < outQty; i++){
    const item = makeItem(result.type);
    if (!item){
      logBad("Error: item de resultado desconocido.");
      return false;
    }

    if (!firstItem) firstItem = item;

    const ok = addToInventory(state, item);
    if (!ok){
      logBad(`Inventario lleno: no pudiste guardar ${item.name}.`);
      return false;
    }
  }

  logOk(
    `Cocinaste: ${outQty} × ${firstItem.icon ?? "🍲"} ${firstItem.name} (-${cost} oro).`
  );
  
  playSound("cook");

  onQuestEvent(state, {
  type: "cook",
  item: result.type,
  amount: outQty
});

  return true;
}

