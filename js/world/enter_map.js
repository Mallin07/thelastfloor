// js/world/enter_map.js
import { loadMap } from "./map.js";
import { MAPS } from "./maps/index.js";
import { spawnEnemiesForMap, spawnAnimalsForMap, spawnItemsForMap } from "./spawner.js";
import { CONFIG } from "../core/config.js";

// ---------- helpers para spawn en mapas cacheados ----------
function findCharOnce(tiles, ch){
  const H = tiles?.length ?? 0;
  for (let y = 0; y < H; y++){
    const row = tiles[y];
    const W = row?.length ?? 0;
    for (let x = 0; x < W; x++){
      if (row[x] === ch) return { x, y };
    }
  }
  return null;
}

function isWalkableTile(c){
  return c === "." || c === "=";
}

function findAdjacentWalkable(tiles, pos){
  if (!pos) return null;

  const dirs = [
    {x: 1, y: 0},
    {x:-1, y: 0},
    {x: 0, y: 1},
    {x: 0, y:-1},
    // diagonales opcionales (si quieres, déjalas)
    {x: 1, y: 1},
    {x:-1, y: 1},
    {x: 1, y:-1},
    {x:-1, y:-1},
  ];

  const H = tiles.length;
  const W = tiles[0]?.length ?? 0;

  for (const d of dirs){
    const x = pos.x + d.x;
    const y = pos.y + d.y;
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const c = tiles[y][x];
    if (isWalkableTile(c)) return { x, y };
  }
  return null;
}

function positionPlayerOnSpawnChar(state, tiles, spawnChar){
  let sp = null;

  if (spawnChar === "@<"){
    const portal = findCharOnce(tiles, "<");
    sp = findAdjacentWalkable(tiles, portal) || portal;
  } else if (spawnChar === "@>"){
    const portal = findCharOnce(tiles, ">");
    sp = findAdjacentWalkable(tiles, portal) || portal;
  } else {
    // fallback: busca el char directo (S, 2, etc.)
    const p = findCharOnce(tiles, spawnChar) || findCharOnce(tiles, "S");
    sp = p;
  }

  if (sp){
    state.player.px = (sp.x + 0.5) * CONFIG.TILE;
    state.player.py = (sp.y + 0.5) * CONFIG.TILE;
  }
}

// -----------------------------------------------------------

export function enterMap(state, mapId, spawnChar = "S", opts = {}){
  const {
    regen = false,          // si true: ignora cache, regenera y respawnea
    resetDungeon = false,   // si true: borra cache de pisos (nueva run)
    useCache = true,        // si true: restaura si existe
  } = opts;

  state.mapCache ??= {};

  // 1) guardar snapshot del mapa actual antes de salir
  if (state.mapId){
    const filteredEntities = new Map();

    for (const [k, e] of state.entities){
      // ❌ NO cachear decoraciones procedurales si alguna vez se meten en entities
      if (e?.kind === "deco") continue;
      filteredEntities.set(k, e);
    }

    state.mapCache[state.mapId] = {
      tiles: state.tiles,
      map: state.map,
      npcs: state.npcs,
      exits: state.exits,
      discovered: state.discovered,
      entities: filteredEntities,

      // ✅ cachear decoraciones para que vuelvan a dibujarse (y coincidan con la colisión)
      decorations: state.decorations ?? [],
    };
  }

  // 2) reset de mazmorra: borrar SOLO pisos cacheados
  if (resetDungeon){
    for (const k of Object.keys(state.mapCache)){
      if (k.startsWith("piso")) delete state.mapCache[k];
    }
  }

  // 3) restaurar desde cache (sin respawn), PERO recolocando al jugador junto al portal correcto
  if (useCache && !regen && state.mapCache[mapId]){
    const snap = state.mapCache[mapId];
  
    state.mapId = mapId;
  
    // ✅ CLAVE: si no haces esto, te quedas con el mapDef del mapa anterior (piso1)
    // y se activan cosas como groundDeco en town.
    state.mapDef = MAPS[mapId];
  
    state.tiles = snap.tiles;
    state.map = snap.map;
    state.npcs = snap.npcs;
    state.exits = snap.exits;
    state.discovered = snap.discovered;
    state.entities = snap.entities;
  
    // ✅ restaura runas/decoraciones visibles
    state.decorations = snap.decorations ?? [];
  
    positionPlayerOnSpawnChar(state, state.tiles, spawnChar);
    return;
  }


  // 4) no hay cache (o regen=true): generar y spawnear UNA vez
  loadMap(state, mapId, spawnChar);

  // 🔒 entidades gameplay SIEMPRE empiezan limpias
  state.entities = new Map();

  // 🔒 decoraciones procedurales viven aparte
  state.decorations ??= [];

  const def = MAPS[mapId];
  spawnEnemiesForMap(state, def?.enemies);
  spawnAnimalsForMap(state, def?.animals);
  spawnItemsForMap(state, def?.items);
}
