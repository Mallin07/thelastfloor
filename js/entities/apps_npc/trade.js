// js/entities/apps_npc/trade.js
import { logBad, logOk } from "../../ui/log.js";
import { playSound } from "../../ui/audio.js";

const MAX_STACK = 10;

// --- helpers (igual idea que bank) ---
function stackKey(item){ return item?.id ?? item?.type ?? item?.name ?? null; }
function getQty(item){ return !item ? 0 : (Number.isFinite(item.qty) ? item.qty : 1); }
function isStackable(item){
  if (!item) return false;
  if (item.kind === "gear") return false; // equipo no apila
  if (item.stackable === false) return false;
  return true;
}
function oneUnit(item){ const copy = { ...item }; delete copy.qty; return copy; }
function unitGold(item){ return (item?.gold ?? item?.value ?? item?.price ?? 0) | 0; }

export function ensureSellBag(state){
  const invSize = state.player.inventory.length;
  const p = state.player;

  // si no existe, crearla del mismo tamaño que el inventario
  if (!Array.isArray(p.sellBag)) {
    p.sellBag = Array(invSize).fill(null);
    return p.sellBag;
  }

  // si el inventario cambia de tamaño, re-ajustar sin perder lo que ya había (hasta donde quepa)
  if (p.sellBag.length !== invSize) {
    const old = p.sellBag;
    p.sellBag = Array(invSize).fill(null);
    for (let i = 0; i < Math.min(old.length, invSize); i++) {
      p.sellBag[i] = old[i];
    }
  }

  return p.sellBag;
}

function addToBag(bag, item){
  if (!item) return false;

  // 1) apilar
  if (isStackable(item)){
    const key = stackKey(item);
    if (key){
      const stackIdx = bag.findIndex(x => x && stackKey(x) === key && isStackable(x) && getQty(x) < MAX_STACK);
      if (stackIdx !== -1){
        const cur = bag[stackIdx];
        bag[stackIdx] = { ...cur, qty: getQty(cur) + 1 };
        return true;
      }
    }
  }

  // 2) hueco
  const idx = bag.findIndex(x => x === null);
  if (idx === -1) return false;
  bag[idx] = isStackable(item) ? { ...item, qty: 1 } : item;
  return true;
}

// ✅ Click inventario: mover 1 unidad inv -> sellBag
export function addInvToSell(state, invIndex){
  const inv = state.player.inventory;
  const bag = ensureSellBag(state);
  const item = inv?.[invIndex];
  if (!item){ logBad("No hay objeto en ese slot."); return false; }

  const qty = getQty(item);
  const moving = (qty > 1) ? oneUnit(item) : item;

  const ok = addToBag(bag, moving);
  if (!ok){ logBad("La bandeja de venta está llena."); return false; }

  // quitar 1 unidad del inventario
  if (qty > 1) inv[invIndex] = { ...item, qty: qty - 1 };
  else inv[invIndex] = null;

  return true;
}

// ✅ Doble clic inventario: mover TODAS las unidades inv -> sellBag
export function addInvToSellAll(state, invIndex){
  const inv = state.player.inventory;
  const bag = ensureSellBag(state);
  const item = inv?.[invIndex];
  if (!item){ logBad("No hay objeto en ese slot."); return false; }

  let qty = getQty(item);
  if (qty <= 0) return false;

  let moved = 0;

  // mover unidades de 1 en 1 (respeta MAX_STACK y huecos)
  while (qty > 0){
    const moving = (qty > 1) ? oneUnit(item) : item;
    const ok = addToBag(bag, moving);
    if (!ok) break;

    qty--;
    moved++;
  }

  if (moved === 0){
    logBad("La bandeja de venta está llena.");
    return false;
  }

  // actualizar inventario con lo que quedó
  if (qty > 0) inv[invIndex] = { ...item, qty };
  else inv[invIndex] = null;

  return true;
}

// ✅ Click en venta: devolver 1 unidad sellBag -> inventario (usando addToInventory real)
import { addToInventory } from "../inventory.js";

export function removeSellToInv(state, sellIndex){
  const bag = ensureSellBag(state);
  const item = bag?.[sellIndex];
  if (!item){ logBad("No hay objeto en ese slot de venta."); return false; }

  const qty = getQty(item);
  const moving = (qty > 1) ? oneUnit(item) : item;

  const ok = addToInventory(state, moving);
  if (!ok) return false; // addToInventory ya loguea “inventario lleno” en tu proyecto

  if (qty > 1) bag[sellIndex] = { ...item, qty: qty - 1 };
  else bag[sellIndex] = null;

  return true;
}

// ✅ Doble clic en venta: devolver TODAS las unidades sellBag -> inventario
export function removeSellToInvAll(state, sellIndex){
  const bag = ensureSellBag(state);
  const item = bag?.[sellIndex];
  if (!item){ logBad("No hay objeto en ese slot de venta."); return false; }

  let qty = getQty(item);
  if (qty <= 0) return false;

  let moved = 0;

  while (qty > 0){
    const moving = (qty > 1) ? oneUnit(item) : item;

    const ok = addToInventory(state, moving);
    if (!ok) break; // inventario lleno (addToInventory ya loguea)

    qty--;
    moved++;
  }

  if (moved === 0) return false;

  if (qty > 0) bag[sellIndex] = { ...item, qty };
  else bag[sellIndex] = null;

  return true;
}

export function sellTotalGold(state){
  const bag = ensureSellBag(state);
  let total = 0;
  for (const it of bag){
    if (!it) continue;
    total += unitGold(it) * getQty(it);
  }
  return total;
}

// ✅ Botón vender: vaciar sellBag y sumar oro
export function commitSale(state){
  const bag = ensureSellBag(state);
  const total = sellTotalGold(state);
  if (total <= 0){ logBad("No tienes nada para vender."); return false; }

  // vaciar
  for (let i = 0; i < bag.length; i++) bag[i] = null;

  state.player.gold = (state.player.gold ?? 0) + total;
  logOk(`Vendiste objetos por 💰 ${total} oro.`);

  playSound("trade");

  return true;
}
