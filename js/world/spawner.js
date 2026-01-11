// js/world/spawner.js
import { CONFIG } from "../core/config.js";
import { key } from "../core/utils.js";
import { makeEnemy } from "../entities/enemy.js";
import { makeAnimal } from "../entities/animal.js";

function tileFromPx(px) {
  return Math.floor(px / CONFIG.TILE);
}

function tooCloseToPlayer(state, x, y, safeTiles) {
  if (!safeTiles || safeTiles <= 0) return false;
  const px = tileFromPx(state.player.px);
  const py = tileFromPx(state.player.py);
  const dx = x - px;
  const dy = y - py;
  return (dx * dx + dy * dy) < (safeTiles * safeTiles);
}

/**
 * Devuelve un tile {x,y} válido para spawn (suelo y sin ocupación),
 * evitando además estar cerca del jugador (safeTiles).
 * Usa state.rng para que sea reproducible con seed.
 */
export function pickSpawnSpot(state, maxTries = 250, safeTiles = 0) {
  const map = state.map;
  if (!map?.length) return null;

  const H = map.length;
  const W = map[0]?.length ?? 0;
  if (!W) return null;

  for (let i = 0; i < maxTries; i++) {
    const x = Math.floor(state.rng() * W);
    const y = Math.floor(state.rng() * H);

    // 1) solo suelo (colisión 0)
    if (map[y]?.[x] !== 0) continue;

    // 2) evita spawnear cerca del jugador
    if (tooCloseToPlayer(state, x, y, safeTiles)) continue;

    // 3) evita ocupar el mismo tile que otra entidad
    const k = key(x, y);
    if (state.entities.has(k)) continue;

    return { x, y };
  }

  return null;
}

const SAFE_TILES = 5;

/**
 * Enemies: tabla { slime: 3, goblin: 2 }
 */
export function spawnEnemiesForMap(state, enemiesTable) {
  if (!enemiesTable) return;

  for (const [type, count] of Object.entries(enemiesTable)) {
    const n = Number(count) || 0;

    for (let i = 0; i < n; i++) {
      const spot = pickSpawnSpot(state, 250, SAFE_TILES);
      if (!spot) return;

      const px = (spot.x + 0.5) * CONFIG.TILE;
      const py = (spot.y + 0.5) * CONFIG.TILE;

      const e = makeEnemy(type, px, py);
      // mantener x/y es útil para rekeying / debug
      e.x = spot.x;
      e.y = spot.y;

      state.entities.set(key(spot.x, spot.y), e);
    }
  }
}

/**
 * Animals: tabla { hare: 2 }
 */
export function spawnAnimalsForMap(state, animalsTable) {
  if (!animalsTable) return;

  for (const [type, count] of Object.entries(animalsTable)) {
    const n = Number(count) || 0;

    for (let i = 0; i < n; i++) {
      const spot = pickSpawnSpot(state, 250, SAFE_TILES);
      if (!spot) return;

      const px = (spot.x + 0.5) * CONFIG.TILE;
      const py = (spot.y + 0.5) * CONFIG.TILE;

      const a = makeAnimal(type, px, py);
      a.x = spot.x;
      a.y = spot.y;

      state.entities.set(key(spot.x, spot.y), a);
    }
  }
}

/**
 * Items: tabla { potion: 2, chest: 1, mushroom: 4 }
 */
export function spawnItemsForMap(state, itemsTable) {
  if (!itemsTable) return;

  for (const [type, count] of Object.entries(itemsTable)) {
    const n = Number(count) || 0;

    for (let i = 0; i < n; i++) {
      const spot = pickSpawnSpot(state, 250, SAFE_TILES);
      if (!spot) return;

      const ent = {
        kind: "item",
        type,
        x: spot.x,
        y: spot.y,
        // opcional: por si haces colisión por radio
        px: (spot.x + 0.5) * CONFIG.TILE,
        py: (spot.y + 0.5) * CONFIG.TILE,
        r: 10
      };

      state.entities.set(key(spot.x, spot.y), ent);
    }
  }
}
