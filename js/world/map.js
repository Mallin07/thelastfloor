// map.js
import { CONFIG } from "../core/config.js";
import { MAPS } from "./maps/index.js";
import { enterMap } from "./enter_map.js";
import { playMusic, pauseMusic } from "../ui/music.js"; 
import { PROTECTED_TILES, PREFAB_SETS } from "./map_prefabs.js";
import { spawnDecorationsForMap } from "./decor_spawn.js";

function normalizeTiles(rows){
  const cleanRows = (rows || []).filter(r => typeof r === "string");
  const H = cleanRows.length;
  const W = cleanRows.reduce((m, r) => Math.max(m, r.length), 0);
  const tiles = cleanRows.map(r => r.padEnd(W, ".").split(""));
  return { tiles, H, W };
}

function findChar(tiles, ch){
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

function findAdjacentWalkable(tiles, pos){
  if (!pos) return null;
  const dirs = [
    {x: 1, y: 0},
    {x:-1, y: 0},
    {x: 0, y: 1},
    {x: 0, y:-1},
    // diagonales opcionales:
    {x: 1, y: 1},
    {x:-1, y: 1},
    {x: 1, y:-1},
    {x:-1, y:-1},
  ];

  const H = tiles.length, W = tiles[0].length;

  for (const d of dirs){
    const x = pos.x + d.x;
    const y = pos.y + d.y;
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const c = tiles[y][x];

    // caminable: suelo o "=" (ajusta si quieres)
    if (c === "." || c === "=") return { x, y };
  }

  return null;
}


// ===============================
// APLICAR PREFABS A MAPAS EXISTENTES
// ===============================
// ✅ Ahora acepta rng para ser determinista con seed
function applyPrefabsToTiles(tiles, prefabs, triesPerPrefab = 200, rng = Math.random){
  if (!Array.isArray(tiles) || tiles.length === 0) return;
  const H = tiles.length;
  const W = tiles[0].length;

  const PROTECTED = PROTECTED_TILES;

  function canPlaceHere(grid, x, y){
    const ph = grid.length;
    const pw = grid[0].length;

    if (x < 0 || y < 0 || x + pw > W || y + ph > H) return false;

    for (let py = 0; py < ph; py++){
      for (let px = 0; px < pw; px++){
        const ch = grid[py][px];
        if (ch === ".") continue; // no escribe

        const current = tiles[y + py][x + px];

        // no pisar tiles importantes
        if (PROTECTED.has(current)) return false;

        // evita solaparse con cosas ya puestas
        if (current !== ".") return false;
      }
    }
    return true;
  }

  function place(grid, x, y){
    for (let py = 0; py < grid.length; py++){
      for (let px = 0; px < grid[0].length; px++){
        const ch = grid[py][px];
        if (ch === ".") continue;
        tiles[y + py][x + px] = ch;
      }
    }
  }

  for (const prefab of prefabs){
    const grid = prefab.map(r => r.split(""));
    const ph = grid.length;
    const pw = grid[0].length;

    // no intentes si es más grande que el mapa
    if (ph > H || pw > W) continue;

    for (let i = 0; i < triesPerPrefab; i++){
      const x = Math.floor(rng() * (W - pw + 1));
      const y = Math.floor(rng() * (H - ph + 1));
      if (canPlaceHere(grid, x, y)){
        place(grid, x, y);
        break;
      }
    }
  }
}

// ===============================
// POST-PROCESO DE PREFABS
// ===============================
function convertHashToYIfSupported(tiles) {
  const H = tiles.length;
  const W = tiles[0].length;

  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W; x++) {
      if (tiles[y][x] === "#" && tiles[y + 1][x] === "Y") {
        tiles[y][x] = "Y";
      }
    }
  }
}

function fixDiagonalCornerLeaks(tiles) {
  const H = tiles.length;
  const W = tiles[0].length;

  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W - 1; x++) {
      // Caso: "#." / ".Y"  -> convierte (x+1, y) a "Y"
      if (tiles[y][x] === "#" && tiles[y][x + 1] === "." && tiles[y + 1][x] === "." && tiles[y + 1][x + 1] === "Y") {
        tiles[y][x + 1] = "Y";
      }

      // Caso espejo: ".#" / "Y." -> convierte (x, y) a "Y"
      if (tiles[y][x] === "." && tiles[y][x + 1] === "#" && tiles[y + 1][x] === "Y" && tiles[y + 1][x + 1] === ".") {
        tiles[y][x] = "Y";
      }
    }
  }
}

function convertYToHashIfFloating(tiles) {
  const H = tiles.length;
  const W = tiles[0].length;

  for (let y = 0; y < H - 1; y++) { // H-1 para poder mirar abajo
    for (let x = 0; x < W; x++) {
      if (tiles[y][x] === "Y" && tiles[y + 1][x] === ".") {
        tiles[y][x] = "#";
      }
    }
  }
}

function findAllChars(tiles, ch){
  const out = [];
  for (let y = 0; y < tiles.length; y++){
    for (let x = 0; x < tiles[0].length; x++){
      if (tiles[y][x] === ch) out.push({x,y});
    }
  }
  return out;
}

function findCharOnce(tiles, ch){
  for (let y = 0; y < tiles.length; y++){
    for (let x = 0; x < tiles[0].length; x++){
      if (tiles[y][x] === ch) return {x,y};
    }
  }
  return null;
}

function isWalkableTile(c){
  // ajusta si quieres: "." y "=" son suelo en tus mapas
  return c === "." || c === "=";
}

function hasAdjacentWalkable(tiles, x, y) {
  const dirs = [
    {x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}
  ];
  for (const d of dirs) {
    const nx = x + d.x, ny = y + d.y;
    if (!tiles[ny]?.[nx]) continue;
    if (tiles[ny][nx] === "." || tiles[ny][nx] === "=") return true;
  }
  return false;
}

function placeRandomNextExit(tiles, rng, { minDist = 40 } = {}){
  const back = findCharOnce(tiles, "<");
  if (!back) return false;

  // elimina cualquier ">" previo
  for (const p of findAllChars(tiles, ">")){
    tiles[p.y][p.x] = ".";
  }

  const H = tiles.length, W = tiles[0].length;
  const minD2 = minDist * minDist;

  // recoge candidatos walkables lejos de "<"
  const candidates = [];
  for (let y = 1; y < H-1; y++){
    for (let x = 1; x < W-1; x++){
      const c = tiles[y][x];
      if (!isWalkableTile(c)) continue;
  
      if (!hasAdjacentWalkable(tiles, x, y)) continue;
  
      const dx = x - back.x, dy = y - back.y;
      if ((dx*dx + dy*dy) < minD2) continue;
  
      candidates.push({x,y});
    }
  }


  if (!candidates.length) return false;

  const pick = candidates[Math.floor(rng() * candidates.length)];
  tiles[pick.y][pick.x] = ">";
  return true;
}


// ===============================
// ✅ CONECTIVIDAD: evita áreas selladas por prefabs
// ===============================
function isWalkableForConnectivity(c){
  // suelo + portales/spawn cuentan como “walkable” para conectividad
  return c === "." || c === "=" || c === "S" || c === "<" || c === ">";
}

function ensureNoSealedAreas(tiles, rng = Math.random){
  const H = tiles.length;
  const W = tiles[0].length;
  const inb = (x,y)=> x>=0 && y>=0 && x<W && y<H;
  const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];

  // Semilla del componente principal
  function findSeed(){
    for (const ch of ["S","<",">"]){
      for (let y=0;y<H;y++) for (let x=0;x<W;x++){
        if (tiles[y][x] === ch) return {x,y};
      }
    }
    for (let y=0;y<H;y++) for (let x=0;x<W;x++){
      if (isWalkableForConnectivity(tiles[y][x])) return {x,y};
    }
    return null;
  }

  function bfsFrom(seed){
    const seen = Array.from({length:H}, ()=>Array(W).fill(false));
    const q = [seed];
    seen[seed.y][seed.x] = true;

    while(q.length){
      const p = q.shift();
      for (const d of dirs){
        const nx = p.x + d.x, ny = p.y + d.y;
        if (!inb(nx,ny) || seen[ny][nx]) continue;
        if (!isWalkableForConnectivity(tiles[ny][nx])) continue;
        seen[ny][nx] = true;
        q.push({x:nx,y:ny});
      }
    }
    return seen;
  }

  // Etiquetar componentes de walkable
  const compId = Array.from({length:H}, ()=>Array(W).fill(-1));
  const comps = [];
  let cid = 0;

  for (let y=0;y<H;y++){
    for (let x=0;x<W;x++){
      if (compId[y][x] !== -1) continue;
      if (!isWalkableForConnectivity(tiles[y][x])) continue;

      const cells = [];
      const q = [{x,y}];
      compId[y][x] = cid;

      while(q.length){
        const p = q.shift();
        cells.push(p);
        for (const d of dirs){
          const nx = p.x + d.x, ny = p.y + d.y;
          if (!inb(nx,ny) || compId[ny][nx] !== -1) continue;
          if (!isWalkableForConnectivity(tiles[ny][nx])) continue;
          compId[ny][nx] = cid;
          q.push({x:nx,y:ny});
        }
      }

      comps.push({ cells });
      cid++;
    }
  }

  if (comps.length <= 1) return;

  const seed = findSeed();
  if (!seed) return;

  const main = compId[seed.y][seed.x];
  if (main < 0) return;

  function manhattan(a, b){ return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

function openStepTowardComponent(reachable, targetCompId){
  // Abre UNA pared/techo (#/Y) en la "frontera" del área alcanzable,
  // eligiendo la que mejor acerque hacia el componente objetivo.
  let best = null;

  const targetRep = comps?.[targetCompId]?.cells?.[0] || null;

  for (let y = 1; y < H - 1; y++){
    for (let x = 1; x < W - 1; x++){
      const t = tiles[y][x];
      if (t !== "#" && t !== "Y") continue;

      // 1) Debe tocar el área alcanzable (frontera desde main)
      let touchesReachable = false;
      for (const d of dirs){
        const ax = x + d.x, ay = y + d.y;
        if (!inb(ax, ay)) continue;
        if (reachable[ay][ax]) { touchesReachable = true; break; }
      }
      if (!touchesReachable) continue;

      // 2) ✅ CLAVE: debe EXPANDIR a zona NO alcanzable (si no, abrir aquí no sirve)
      let expandsFrontier = false;
      let touchesTargetDirect = false;

      for (const d of dirs){
        const bx = x + d.x, by = y + d.y;
        if (!inb(bx, by)) continue;

        if (!reachable[by][bx]) {
          const ot = tiles[by][bx];

          // si al otro lado hay algo "compatible" con conectividad o muro/techo, abrir tiene sentido
          if (ot === "#" || ot === "Y" || isWalkableForConnectivity(ot)) {
            expandsFrontier = true;
          }

          // bonus: si al otro lado ya está el componente objetivo, conectas directo
          if (compId?.[by]?.[bx] === targetCompId) {
            touchesTargetDirect = true;
          }
        }

        if (touchesTargetDirect) break;
      }

      if (!expandsFrontier) continue;

      // 3) Score: prioriza conectar directo; si no, acercarse al componente objetivo
      let score;
      if (touchesTargetDirect) {
        score = 0;
      } else if (targetRep) {
        score = manhattan({ x, y }, targetRep);
      } else {
        score = 999999; // fallback raro
      }

      if (!best || score < best.score) {
        best = { x, y, score };
      }
    }
  }

  if (!best) return false;

  tiles[best.y][best.x] = "."; // abre “puerta”
  return true;
}



// Intenta conectar componentes secundarios abriendo 1 pared (# o Y) que toque ambos
for (let c = 0; c < comps.length; c++){
  if (c === main) continue;

  // Repite abriendo pasos hasta conectar o hasta límite
  for (let steps = 0; steps < 30; steps++){
    const reachable = bfsFrom(seed);

    const anyCell = comps[c].cells[0];
    if (reachable[anyCell.y][anyCell.x]) break; // ya conectado

    const ok = openStepTowardComponent(reachable, c);
    if (!ok) break; // no se pudo avanzar
  }
}

}


// ===============================
// LOAD MAP
// ===============================
export function loadMap(state, mapId, spawnChar = "S"){
  const def = MAPS[mapId];
  if (!def) throw new Error("Mapa no existe: " + mapId);

  state.mapDef = def;

  // 1) Normalizar tiles base
  const { tiles, H, W } = normalizeTiles(def.tiles);

  // ============================================
  // 2) Prefabs aleatorios (según mapa)
  // ============================================
  const pg = def.procgen ?? null;
  const prefabSetId = pg?.prefabs ?? null;
  const prefabSet = prefabSetId ? PREFAB_SETS?.[prefabSetId] : null;
  
  function expandPrefabSet(set, weights){
    if (!set) return [];
    const out = [];
    for (const [key, prefabRows] of Object.entries(set)){
      const w = weights?.[key] ?? 1;
      for (let i = 0; i < w; i++) out.push(prefabRows);
    }
    return out;
  }
  
  if (prefabSet){
    const weights = pg?.weights ?? { A:5, B:4, C:2, D:2, E:2, F:2, G:1, OA:3 };
    const triesPerPrefab = Number.isFinite(pg?.triesPerPrefab) ? pg.triesPerPrefab : 200;
    const minDist = Number.isFinite(pg?.minDistNextExit) ? pg.minDistNextExit : 20;
  
    const prefabList = expandPrefabSet(prefabSet, weights);
  
    applyPrefabsToTiles(tiles, prefabList, triesPerPrefab, state.rng);
  
    convertHashToYIfSupported(tiles);
    fixDiagonalCornerLeaks(tiles);
    convertYToHashIfFloating(tiles);
  
    ensureNoSealedAreas(tiles, state.rng);
  
    placeRandomNextExit(tiles, state.rng, { minDist });
  }

  // 3) guardar tiles
  state.mapId = mapId;
  state.tiles = tiles;
  state.decorations = spawnDecorationsForMap(state, tiles, def);

  // 🎵 Música por mapa
  if (mapId === "town_01") {
    playMusic("town_01");
  } else {
    pauseMusic();
  }

  // 4) colisiones (por mapa)
  const blocked = new Set(def.legend?.blocked ?? [
    "#", "Y" // fallback mínimo
  ]);
  
  state.map = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => (blocked.has(tiles[y][x]) ? 1 : 0))
  );

  // 4.5) colisión por decoraciones procedurales
  for (const d of (state.decorations || [])){
    if (!d?.blocking) continue;
  
    const w = d.w ?? 1;
    const h = d.h ?? 1;
  
    for (let oy = 0; oy < h; oy++){
      for (let ox = 0; ox < w; ox++){
        const x = d.tx + ox;
        const y = d.ty + oy;
        if (state.map?.[y]?.[x] !== undefined){
          state.map[y][x] = 1;
        }
      }
    }
  }  
  // 5) fog
  state.discovered = Array.from({ length: H }, () => Array(W).fill(false));

  // 6) spawn player
  let sp = null;
  
  if (spawnChar === "@<"){
    const portal = findChar(tiles, "<");
    sp = findAdjacentWalkable(tiles, portal) || portal;
  } else if (spawnChar === "@>"){
    const portal = findChar(tiles, ">");
    sp = findAdjacentWalkable(tiles, portal) || portal;
  } else {
    sp = findChar(tiles, spawnChar) || findChar(tiles, "S");
  }
  
  if (sp){
    state.player.px = (sp.x + 0.5) * CONFIG.TILE;
    state.player.py = (sp.y + 0.5) * CONFIG.TILE;
  }

// ✅ Curación al entrar en town_01 (funciona incluso con useCache)
if (mapId === "town_01") {
  const p = state.player;

  const hpMax = Number(p.hpMax);
  if (Number.isFinite(hpMax)) p.hp = hpMax;

  const mpMax = Number(p.mpMax);
  if (Number.isFinite(mpMax)) p.mp = mpMax;

  const manaMax = Number(p.manaMax);
  if (Number.isFinite(manaMax)) p.mana = manaMax;
}

  // 7) NPCs
  state.npcs = [];
  for (const n of (def.npcs || [])){
    const pos = n.at ? findChar(tiles, n.at) : { x: n.tx, y: n.ty };
    if (!pos) continue;
    state.npcs.push({ ...n, tx: pos.x, ty: pos.y });
  }

  // 8) salidas
  state.exits = def.exits || [];
}


export function tryExit(state){
  const tx = Math.floor(state.player.px / CONFIG.TILE);
  const ty = Math.floor(state.player.py / CONFIG.TILE);

  const c = state.tiles?.[ty]?.[tx];
  if (!c) return;

  const ex = state.exits.find(e => e.atChar === c);
  if (!ex) return;

  const goingToTown = (ex.to === "town_01"); // ✅ ahora sí

  const from = state.mapId;
  const spawnPortal = (c === ">") ? "@<" : (c === "<" ? "@>" : (ex.spawn || "S"));

  // ✅ nueva run solo al ir del pueblo hacia la mazmorra
  const enteringDungeonRun = (from === "town_01" && c === ">");

  enterMap(state, ex.to, spawnPortal, {
    resetDungeon: enteringDungeonRun,
    regen: goingToTown,
    useCache: true
  });

  // ✅ (RECOMENDADO) Curación + música garantizadas aunque haya caché
  if (goingToTown) {
    const p = state.player;

    const hpMax = Number(p.hpMax);
    if (Number.isFinite(hpMax)) p.hp = hpMax;

    const mpMax = Number(p.mpMax);
    if (Number.isFinite(mpMax)) p.mp = mpMax;

    const manaMax = Number(p.manaMax);
    if (Number.isFinite(manaMax)) p.mana = manaMax;

    playMusic("town_01");
  }
}




export function isWallAtPx(state, px, py){
  const { TILE } = CONFIG;
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);

  if (!state.map?.length) return true;
  if (ty < 0 || tx < 0 || ty >= state.map.length || tx >= state.map[0].length) return true;

  return state.map[ty][tx] === 1;
}

// (opcional) si lo sigues usando para town procedural
export function buildTownMap(){
  const W = 40;
  const H = 25;

  const map = makeMap(W, H, ".");

  for (let x = 0; x < W; x++){ map[0][x] = "#"; map[H-1][x] = "#"; }
  for (let y = 0; y < H; y++){ map[y][0] = "#"; map[y][W-1] = "#"; }

  // spawn
  map[Math.floor(H/2)][Math.floor(W/2)] = "S";

  placePrefabRandom(map, PREFAB_Y);

  return mapToStrings(map);
}
