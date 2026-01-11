// js/ui/item_level_ui.js
import { ITEMS } from "../data/items_db.js"; // ajusta ruta

export function getItemLevelClass(lvl){
  const n = Number(lvl) || 0;
  if (n >= 7) return "ilvl-legendary";
  if (n >= 5) return "ilvl-epic";
  if (n >= 3) return "ilvl-rare";
  if (n >= 1) return "ilvl-uncommon";
  return "ilvl-common";
}

export function getItemLevelFromItem(item){
  // 1) si el item ya trae itemLevel
  if (item && Number.isFinite(item.itemLevel)) return item.itemLevel;

  // 2) si es un “item instance” con type y hay definición en ITEMS
  const t = item?.type;
  const def = t ? ITEMS[t] : null;
  if (def && Number.isFinite(def.itemLevel)) return def.itemLevel;

  return 0;
}

export function getItemLevelClassFromItem(item){
  return getItemLevelClass(getItemLevelFromItem(item));
}
