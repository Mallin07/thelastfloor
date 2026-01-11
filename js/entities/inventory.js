import { logBad, logOk } from "../ui/log.js";

export const SLOT = {
  head: "head",
  chest: "chest",
  legs: "legs",
  feet: "feet",
  mainHand: "mainHand",
  offHand: "offHand"
};

const MAX_STACK = 10;

/** Identificador para apilar: preferimos item.id; si no existe, usamos name */
function stackKey(item){
  return item?.id ?? item?.name ?? null;
}

/** Cantidad en slot (si no existe qty, es 1) */
function getQty(item){
  if (!item) return 0;
  return Number.isFinite(item.qty) ? item.qty : 1;
}

/** Devuelve si un item se puede apilar */
function isStackable(item){
  if (!item) return false;
  // Regla: gear NO apila. El resto sí, salvo que explícitamente lo marques como no apilable.
  if (item.kind === "gear") return false;
  if (item.stackable === false) return false;
  return true;
}

/** Crea una copia "1 unidad" del item (sin qty) */
function oneUnit(item){
  const copy = { ...item };
  delete copy.qty;
  return copy;
}

export function addToInventory(state, item){
  const inv = state.player.inventory;
  if (!item){
    logBad("Objeto inválido.");
    return false;
  }

  // 1) Intentar apilar si procede
  if (isStackable(item)){
    const key = stackKey(item);
    if (key){
      const stackIdx = inv.findIndex(x =>
        x &&
        stackKey(x) === key &&
        isStackable(x) &&
        getQty(x) < MAX_STACK
      );

      if (stackIdx !== -1){
        const current = inv[stackIdx];
        const nextQty = getQty(current) + 1;
        inv[stackIdx] = { ...current, qty: nextQty };
        logOk(`+1 ${item.name} (x${nextQty}).`);
        return true;
      }
    }
  }

  // 2) Si no se pudo apilar, usar hueco libre
  const idx = inv.findIndex(x => x === null);
  if (idx === -1){
    logBad("Inventario lleno (3x3).");
    return false;
  }

  // Si es stackable, guardamos con qty:1 para que el UI pueda dibujar el contador
  inv[idx] = isStackable(item) ? { ...item, qty: 1 } : item;

  logOk(`Guardado en inventario: ${item.name}.`);
  return true;
}

export function removeFromInventory(state, item, amount = 1){
  const inv = state.player.inventory;
  if (!item) return false;

  let left = Number.isFinite(amount) ? amount : 1;
  if (left <= 0) return true;

  const targetKey = stackKey(item);

  // 1) Si es apilable: quitar unidades de stacks con la misma key
  if (isStackable(item) && targetKey){
    for (let i = 0; i < inv.length && left > 0; i++){
      const it = inv[i];
      if (!it) continue;
      if (!isStackable(it)) continue;
      if (stackKey(it) !== targetKey) continue;

      const q = getQty(it);
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

  // 2) No apilable (gear u otros): intenta quitar el slot exacto primero
  const exactIdx = inv.findIndex(x => x === item);
  if (exactIdx !== -1){
    const q = getQty(inv[exactIdx]);
    if (q <= left){
      inv[exactIdx] = null;
      left -= q;
    } else {
      inv[exactIdx] = { ...inv[exactIdx], qty: q - left };
      left = 0;
    }
    return left === 0;
  }

  // 3) Fallback: quitar por key (si existe), o por type/name
  for (let i = 0; i < inv.length && left > 0; i++){
    const it = inv[i];
    if (!it) continue;

    const same =
      (targetKey && stackKey(it) === targetKey) ||
      (item.type && it.type === item.type) ||
      (item.name && it.name === item.name);

    if (!same) continue;

    const q = getQty(it);
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

export function equipFromInventory(state, index){
  const inv = state.player.inventory;
  const item = inv[index];
  if (!item) return;

  // Si por algún motivo llega un stack > 1 de gear (no debería), equipamos 1 unidad
  const qty = getQty(item);
  const actualItem = (qty > 1) ? oneUnit(item) : item;

  if (actualItem.kind !== "gear" || !actualItem.slot){
    logBad("Ese objeto no se puede equipar.");
    return;
  }

  const slot = actualItem.slot;
  const equipped = state.player.equipment[slot] ?? null;

  // Intercambio
  state.player.equipment[slot] = actualItem;

  // Si había stack, decrementa; si no, reemplaza slot por el equipado
  if (qty > 1){
    inv[index] = { ...item, qty: qty - 1 };
    // Intentar meter el item equipado en algún hueco libre si no es null
    if (equipped){
      addToInventory(state, equipped); // respeta stacking y espacio
    }
  } else {
    inv[index] = equipped;
  }

  recomputeStats(state);
  logOk(`Equipaste: ${actualItem.name} (${prettySlot(slot)}).`);
}

export function recomputeStats(state){
  const p = state.player;
  const eq = p.equipment ?? {};

  const baseMeleeAtk = 3; // tu base actual
  let armorDef = 0;

  // 1) Defensa de armaduras (siempre suma)
  for (const slot of ["head", "chest", "legs", "feet"]){
    const it = eq[slot];
    if (!it) continue;
    armorDef += Number(it.defense || 0);
  }

  // 2) Main hand obligatorio: meleeAtk
  const main = eq.mainHand ?? null;
  const mainBonus = main ? Number(main.bonusAtk || 0) : 0;

  const meleeAtk = baseMeleeAtk + mainBonus;

  // 3) Offhand variable: bow / wand / shield
  const off = eq.offHand ?? null;
  const offType = String(off?.weaponType || "").toLowerCase();

  let rangedAtk = 0;
  let spellPower = 0;
  let shieldDef = 0;

  if (off){
    const offBonusAtk = Number(off.bonusAtk || 0);
    const offDefense  = Number(off.defense || 0);

    if (offType === "bow" || offType === "bows"){
      rangedAtk = Math.max(1, offBonusAtk);   // o 1 + offBonusAtk si prefieres
    } else if (offType === "wand" || offType === "wands"){
      spellPower = Math.max(1, offBonusAtk);  // o 1 + offBonusAtk
    } else if (offType === "shield" || offType === "shields"){
      shieldDef = offDefense;
    }
  }

  // 4) Publicar stats
  p.meleeAtk = meleeAtk;
  p.rangedAtk = rangedAtk;
  p.spellPower = spellPower;

  // Compat con tu código actual (usa player.atk para melee/básico)
  p.atk = meleeAtk;

  // Defensa total
  p.def = armorDef + shieldDef;
}


export function prettySlot(slot){
  return ({
    head: "Casco",
    chest: "Armadura",
    legs: "Pantalones",
    feet: "Botas",
    mainHand: "Mano derecha",
    offHand: "Mano izquierda"
  })[slot] ?? slot;
}
