// maps/index.js
import { TOWN_01 } from "./town_01.js";
import { PISO1 } from "./piso1.js";
import { PISO2 } from "./piso2.js";
import { PISO3 } from "./piso3.js";

export const MAPS = {
  [TOWN_01.id]: TOWN_01,
  [PISO1.id]: PISO1,
  [PISO2.id]: PISO2,
  [PISO3.id]: PISO3,
};


// Construye un mapa de colisión 0/1 a partir de tiles (matriz de chars)
export function buildCollisionMap(tiles){
  const H = tiles?.length ?? 0;
  const W = tiles?.reduce((m, row) => Math.max(m, row?.length ?? 0), 0) ?? 0;

  const BLOCK = new Set(["#", "H", "T", "A", "G", "C", "R", "P", "y", "Y"]);

  return Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => {
      const c = tiles?.[y]?.[x] ?? ".";
      return BLOCK.has(c) ? 1 : 0;
    })
  );
}
