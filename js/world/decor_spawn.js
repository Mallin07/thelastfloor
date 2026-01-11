// js/world/decor_spawn.js
import { PROTECTED_TILES } from "./map_prefabs.js";

// Reglas:
// - Coloca N instancias por regla
// - Solo sobre tiles permitidos (por defecto ".")
// - Evita pisar tiles protegidos y exits/spawn
// - Opcional: blocking marca colisión

function mulberry32(seed){
  let t = seed >>> 0;
  return function(){
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(s){
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isWalkableForDeco(c, allowSet){
  if (allowSet?.has(c)) return true;
  return c === "." || c === "="; // default
}

function canPlaceRect(tiles, occ, x, y, w, h, allowSet){
  const H = tiles.length, W = tiles[0].length;
  if (x < 0 || y < 0 || x + w > W || y + h > H) return false;

  for (let oy = 0; oy < h; oy++){
    for (let ox = 0; ox < w; ox++){
      const tx = x + ox, ty = y + oy;
      const c = tiles[ty][tx];

      // no pisar tiles protegidos del layout
      if (PROTECTED_TILES.has(c)) return false;

      // no pisar cosas ya colocadas
      if (occ[ty][tx]) return false;

      // solo sobre suelo permitido
      if (!isWalkableForDeco(c, allowSet)) return false;
    }
  }
  return true;
}

function markOcc(occ, x, y, w, h){
  for (let oy = 0; oy < h; oy++){
    for (let ox = 0; ox < w; ox++){
      occ[y + oy][x + ox] = true;
    }
  }
}

// API
export function spawnDecorationsForMap(state, tiles, mapDef){
  // ✅ Kill switch por mapa (ignora defaults)
  if (mapDef?.procDecor?.enabled === false) return [];

  const rules = mapDef?.procDecor?.rules ?? [];
  if (!rules.length) return [];

  const seedBase = (state.seed ?? 0) ^ hashStringToSeed(String(mapDef.id ?? ""));
  const H = tiles.length, W = tiles[0].length;

  // ocupación (solo para decoraciones)
  const occ = Array.from({ length: H }, () => Array(W).fill(false));
  const out = [];

  for (const rule of rules){
    const count = rule.count ?? 0;
    if (!count) continue;

    const w = Number.isFinite(rule.w) ? rule.w : 1;
    const h = Number.isFinite(rule.h) ? rule.h : 1;
    const tries = Number.isFinite(rule.tries) ? rule.tries : 200;

    const allowSet = rule.on ? new Set(rule.on) : null;

    // RNG por regla (determinista)
    const rng = mulberry32(seedBase ^ hashStringToSeed(String(rule.id ?? rule.asset ?? "rule")));

    let placed = 0;
    for (let i = 0; i < tries && placed < count; i++){
      const x = Math.floor(rng() * (W - w + 1));
      const y = Math.floor(rng() * (H - h + 1));

      if (!canPlaceRect(tiles, occ, x, y, w, h, allowSet)) continue;

      markOcc(occ, x, y, w, h);

      // elegir asset por instancia (string o array de variantes)
      let asset = rule.asset;
      if (Array.isArray(rule.asset)) {
        asset = rule.asset[Math.floor(rng() * rule.asset.length)];
      }

      out.push({
        id: `${rule.id ?? asset}_${placed}`,
        kind: rule.kind ?? "deco",
        asset,
        tx: x,
        ty: y,
        w,
        h,
        blocking: !!rule.blocking,
      });

      placed++;
    }
  }
  
  console.log("[decor_spawn]", mapDef?.id, mapDef?.procDecor);

  return out;
}
