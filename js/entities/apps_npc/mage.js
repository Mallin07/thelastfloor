// js/entities/apps_npc/mage_craft.js
import { RECIPES as MAGE_RECIPES } from "../../data/recipes/mage_recipes_db.js";
import { addToInventory } from "../inventory.js";
import { logOk, logBad } from "../../ui/log.js";
import { makeItem } from "../item_factory.js";
import { onQuestEvent } from "../quests.js";
import { playSound } from "../../ui/audio.js";

// Igual que cooking/forge: valida oro, nivel, quest, ingredientes, etc.
// Si ya tienes una función genérica en cooking.js, replica el mismo patrón aquí.

export function canMageCraft(state, recipeId) {
  const r = MAGE_RECIPES?.[recipeId];
  if (!r) return { ok: false, reason: "missing", value: recipeId };

  // Requisitos (si tu DB usa requires.level, requires.quest, etc.)
  const lvl = state.player?.lvl ?? 1;
  const reqLvl = r.requires?.level ?? 0;
  if (reqLvl && lvl < reqLvl) return { ok: false, reason: "level", value: reqLvl };

  const q = r.requires?.quest;
  if (q) {
    const done = !!state.player?.questsDone?.[q];
    if (!done) return { ok: false, reason: "quest", value: q };
  }

  // Oro
  const gold = state.player?.gold ?? 0;
  const cost = r.costGold ?? 0;
  if (gold < cost) return { ok: false, reason: "gold", value: cost };

  // Ingredientes
  const inv = state.player?.inventory ?? [];
  for (const ing of (r.ingredients ?? [])) {
    const have = countHave(inv, ing.type);
    if (have < ing.qty) {
      return { ok: false, reason: "ingredients", value: { type: ing.type, have, need: ing.qty } };
    }
  }

  return { ok: true };
}

export function mageCraftRecipe(state, recipeId) {
  const r = MAGE_RECIPES?.[recipeId];
  if (!r) {
    logBad(`Receta no existe: ${recipeId}`);
    return false;
  }

  const check = canMageCraft(state, recipeId);
  if (!check.ok) {
    logBad("No puedes crear eso todavía.");
    return false;
  }

  // 1) pagar oro
  state.player.gold = (state.player.gold ?? 0) - (r.costGold ?? 0);

  // 2) consumir ingredientes
  for (const ing of (r.ingredients ?? [])) {
    consumeInv(state, ing.type, ing.qty);
  }

  // 3) crear item
  const outType = r.result?.type;
  const item = makeItem(outType);

  // 4) meter en inventario
  const ok = addToInventory(state, item);
  if (!ok) {
    // IMPORTANTE: si tu addToInventory falla, aquí quedaría “craft perdido”.
    // Si quieres, luego hacemos rollback (devolver oro + ingredientes).
    logBad("No se pudo añadir al inventario.");
    return false;
  }

  // 5) quest event (ajusta el nombre del evento si usas uno específico)
  onQuestEvent(state, "craft", { recipeId, kind: "mage" });

  logOk(`Has creado: ${r.name}`);

  playSound("enchant");

  return true;
}

// --- helpers (igual que cooking.js) ---

function invQty(it) {
  return Number.isFinite(it?.qty) ? it.qty : (it ? 1 : 0);
}

function countHave(inv, type) {
  let total = 0;
  for (const it of inv) if (it && it.type === type) total += invQty(it);
  return total;
}

function consumeInv(state, type, qty) {
  let left = qty;
  const inv = state.player?.inventory ?? [];
  for (let i = 0; i < inv.length && left > 0; i++) {
    const it = inv[i];
    if (!it || it.type !== type) continue;

    const have = invQty(it);
    const take = Math.min(have, left);

    if (Number.isFinite(it.qty)) {
      it.qty -= take;
      if (it.qty <= 0) inv[i] = null;
    } else {
      // no apilable
      inv[i] = null;
    }

    left -= take;
  }
}


