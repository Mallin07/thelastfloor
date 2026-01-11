// js/entities/item_factory.js
import { ITEMS } from "../data/items_db.js";

export function makeItem(type, overrides = {}){
  const base = ITEMS[type];
  if (!base) return null;
  return { ...base, ...overrides };
}
