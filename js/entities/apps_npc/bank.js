// js/entities/apps_npc/bank.js
import { addToInventory } from "../inventory.js";
import { logBad, logOk } from "../../ui/log.js";

const MAX_STACK = 10;
const BANK_SIZE = 40;

// --- helpers (copiados del inventario para mantener mismo comportamiento) ---
function stackKey(item){ return item?.id ?? item?.name ?? null; }
function getQty(item){ return !item ? 0 : (Number.isFinite(item.qty) ? item.qty : 1); }
function isStackable(item){
  if (!item) return false;
  if (item.kind === "gear") return false;
  if (item.stackable === false) return false;
  return true;
}
function oneUnit(item){ const copy = { ...item }; delete copy.qty; return copy; }

// ✅ asegura que el banco existe y tiene al menos BANK_SIZE slots (migra de 12 -> 36 sin perder items)
function ensureBank(state){
  const p = state.player;

  if (!Array.isArray(p.bank)) {
    p.bank = Array(BANK_SIZE).fill(null);
  } else if (p.bank.length < BANK_SIZE) {
    p.bank = p.bank.concat(Array(BANK_SIZE - p.bank.length).fill(null));
  }

  return p.bank;
}

// --- add genérico a una "bolsa" de slots (bank) ---
function addToBag(bag, item){
  if (!item) return false;

  // 1) apilar
  if (isStackable(item)){
    const key = stackKey(item);
    if (key){
      const stackIdx = bag.findIndex(x =>
        x && stackKey(x) === key && isStackable(x) && getQty(x) < MAX_STACK
      );
      if (stackIdx !== -1){
        const current = bag[stackIdx];
        bag[stackIdx] = { ...current, qty: getQty(current) + 1 };
        return true;
      }
    }
  }

  // 2) hueco libre
  const idx = bag.findIndex(x => x === null);
  if (idx === -1) return false;

  bag[idx] = isStackable(item) ? { ...item, qty: 1 } : item;
  return true;
}

// ✅ Depositar 1 unidad desde inventario -> banco
export function depositToBank(state, invIndex){
  const inv = state.player.inventory;
  const bank = ensureBank(state);

  const item = inv[invIndex];
  if (!item){ logBad("No hay objeto en ese slot."); return false; }

  const qty = getQty(item);
  const moving = (qty > 1) ? oneUnit(item) : item;

  const ok = addToBag(bank, moving);
  if (!ok){ logBad("El banco está lleno."); return false; }

  // quitar 1 unidad del inventario
  if (qty > 1) inv[invIndex] = { ...item, qty: qty - 1 };
  else inv[invIndex] = null;

  logOk(`Depositaste: ${moving.icon ?? "🎒"} ${moving.name}.`);
  return true;
}

// ✅ Retirar 1 unidad desde banco -> inventario (usa addToInventory)
export function withdrawFromBank(state, bankIndex){
  const bank = ensureBank(state);

  const item = bank[bankIndex];
  if (!item){ logBad("No hay objeto en ese slot del banco."); return false; }

  const qty = getQty(item);
  const moving = (qty > 1) ? oneUnit(item) : item;

  const ok = addToInventory(state, moving); // respeta stacking y “Inventario lleno (3x3)”
  if (!ok) return false;

  // quitar 1 unidad del banco
  if (qty > 1) bank[bankIndex] = { ...item, qty: qty - 1 };
  else bank[bankIndex] = null;

  logOk(`Retiraste: ${moving.icon ?? "🎒"} ${moving.name}.`);
  return true;
}
