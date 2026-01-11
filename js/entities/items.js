//js/entities/items.js

import { key } from "../core/utils.js";
import { logOk, logBad } from "../ui/log.js";
import { addToInventory, removeFromInventory } from "./inventory.js";
import { randomGear } from "./loot.js";
import { makeItem } from "./item_factory.js";

/* =========================
   PICKUP DE ÍTEMS
   ========================= */
export function handleItemPickup(state, ent){
  if (!ent || ent.kind !== "item") return;

  const k = key(ent.x, ent.y);

  // Casos especiales legacy
  if (ent.type === "potion"){
    state.player.potions += 1;
    state.entities.delete(k);
    logOk("Recogiste una poción (+1).");
    return;
  }

  if (ent.type === "chest"){
    state.player.gold += 25;

    const gear = randomGear(state);
    const ok = addToInventory(state, gear);

    state.entities.delete(k);

    if (ok) logOk(`¡Cofre! +25 oro y encontraste: ${gear.icon ?? "✨"} ${gear.name}`);
    else logBad(`¡Cofre! +25 oro. Pero el inventario está lleno, no pudiste guardar ${gear.name}.`);
    return;
  }

  // Ítems normales desde catálogo
  const item = makeItem(ent.type);
  if (!item){
    logBad("Objeto desconocido.");
    return;
  }

  const ok = addToInventory(state, item);
  state.entities.delete(k);

  if (ok) logOk(`Recogiste: ${item.icon ?? "📦"} ${item.name}.`);
  else logBad(`Inventario lleno, no pudiste guardar ${item.name}.`);
}

/* =========================
   USO DE ÍTEMS
   ========================= */

export function useItem(state, item){
  if (!item || !item.kind) return false;

  switch (item.kind){
    case "food":
      return consumeFood(state, item);

    case "consumable":
      return consumeGeneric(state, item);

    default:
      logBad("No puedes usar este objeto.");
      return false;
  }
}

// ✅ Helper: determina si algo es comida consumible (para drag & drop al slot 0)
export function isFoodConsumable(obj){
  if (!obj) return false;

  // En tu juego la comida se usa con kind === "food"
  // (ver switch de useItem)
  if (obj.kind === "food") return true;

  // Por si en algún item/def viniera como consumable+food
  if (obj.kind === "consumable" && obj.subtype === "food") return true;

  return false;
}

// ✅ NUEVO: usar por ID (para actionbar slot 0)
export function useItemById(state, itemId){
  const inv = state.player?.inventory ?? [];
  const idx = inv.findIndex(it => it && ((it.type ?? it.id) === itemId));
  if (idx < 0) {
    logBad("No te quedan de ese objeto.");
    return false;
  }

  const it = inv[idx];
  const ok = useItem(state, it);

  if (ok){
    // si tras consumir ya no queda nada, limpia slot 0
    const stillThere = state.player.inventory.some(x => x && ((x.type ?? x.id) === itemId));
    if (!stillThere && state.player?.actionBar?.[0]?.id === itemId){
      state.player.actionBar[0] = null;
    }
  }

  return ok;
}




/* =========================
   EFECTOS
   ========================= */

function num(v, fallback){
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(x){ return Math.max(0, x); }

function consumeFood(state, item){
  let used = false;
  const p = state.player;

  const hp = Number(p.hp);
  const hpMax = Number(p.hpMax);
  const hunger = Number(p.hunger);
  const hungerMax = Number(p.hungerMax);

  const addH = Number(item.hungerRestore) || 0;
  const addHP = Number(item.hpRestore) || 0;

  if (addH > 0){
    const baseH = Number.isFinite(hunger) ? hunger : hungerMax;
    const capH  = Number.isFinite(hungerMax) ? hungerMax : baseH;
    p.hunger = Math.min(capH, baseH + addH);
    used = true;
  }

  if (addHP > 0){
    const baseHP = Number.isFinite(hp) ? hp : hpMax;
    const capHP  = Number.isFinite(hpMax) ? hpMax : baseHP;
    p.hp = Math.min(capHP, baseHP + addHP);
    used = true;
  }

  if (!used){
    logBad("Este alimento no tiene efecto.");
    return false;
  }

  removeFromInventory(state, item, 1);

  logOk(
    `${item.icon ?? "🍽️"} Consumiste ${item.name}` +
    ` (Hambre +${addH}, HP +${addHP})`
  );

  return true;
}

