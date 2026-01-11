// js/core/save_system.js
import { setSeed } from "./state.js"; // tu setSeed ya existe
import { ensureActionBar, renderActionBar } from "../systems/actionbar_system.js";
import { resetKeys } from "../input/input.js";

const STORAGE_KEY = "rol_saves_v1";
const MAX_SLOTS = 3;

function safeParse(json, fallback){
  try {
    if (json == null) return fallback;
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function ensureArray(x){
  return Array.isArray(x) ? x : [];
}

function deepClone(obj){
  // structuredClone es lo ideal, pero no siempre está disponible
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

export function listSaves(){
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw, []);
  const arr = ensureArray(parsed);

  return Array.from({ length: MAX_SLOTS }, (_, i) => arr[i] ?? null);
}

function tilesToStrings(tiles){
  // tiles en runtime: array de arrays de chars
  return (tiles || []).map(row => Array.isArray(row) ? row.join("") : String(row));
}
function stringsToTiles(rows){
  return (rows || []).map(r => String(r).split(""));
}

function mapCacheToJSON(mapCache){
  const out = {};
  for (const [mapId, snap] of Object.entries(mapCache || {})){
    if (!snap) continue;
    out[mapId] = {
      tilesRows: tilesToStrings(snap.tiles),
      map: snap.map,
      npcs: snap.npcs,
      exits: snap.exits,
      discovered: snap.discovered,
      entities: Array.from((snap.entities instanceof Map) ? snap.entities.entries() : [])
    };
  }
  return out;
}

function mapCacheFromJSON(obj){
  const out = {};
  for (const [mapId, snap] of Object.entries(obj || {})){
    out[mapId] = {
      tiles: stringsToTiles(snap.tilesRows),
      map: snap.map,
      npcs: snap.npcs,
      exits: snap.exits,
      discovered: snap.discovered,
      entities: new Map(snap.entities || [])
    };
  }
  return out;
}

function normalizeLoadedPlayer(p){
  if (!p || typeof p !== "object") return;

  // Dirección base
  p.dir = p.dir ?? "s";

  // Locks / cooldowns (timers basados en performance.now → RESET OBLIGATORIO)
  p.turnLockUntil = 0;
  p.dirLockUntil = 0;
  p.moveLockUntil = 0;
  p.cooldownUntil = 0;
  p.nextTurnAt = 0;
  p.nextMoveAt = 0;
  p.attackLockUntil = 0;
  p.actionLockUntil = 0;

  // 🔴 NUEVOS CONTROLES (causa del bug)
  p._shiftHeldUntil = 0;
  p.shiftHeldUntil = 0;
  p._lookHeldUntil = 0;
  p._facingLock = null;

  // Seguridad: si se guardó durante un ataque
  p.atkAnimUntil = 0;
  p.atkAnimTiles = [];
  p.atkDir = null;
  p.atkDirStr = null;
  p.nextAtkTime = 0;

  // Estado de animación / movimiento
  p.moving = false;
  p.walking = false;
  p.running = false;
  p.step = 0;
  p.animT = 0;
  p.frame = 0;
  p.facingX ??= 0;
  p.facingY ??= 1;

  // Buffers de input
  p.intentDir = null;
  p.queuedDir = null;
  p.bufferedDir = null;

  // =========================
  // ✅ HABILIDADES HUD
  // =========================
  p.actionBar ??= {};
  // asegurar slots 0–9
  for (let i = 0; i <= 9; i++) {
    if (!(i in p.actionBar)) p.actionBar[i] = null;
  }

  // defaults
  p.actionBar[0] ??= { type: "consumable", id: "stew" };

  // reservado siempre
  p.actionBar[5] = { type: "basic_attack" };

  p.consumables ??= {};
  p.consumables.stew ??= 0;

  // =========================
  // ✅ SKILLS
  // =========================
  // Skills aprendidas
  p.skills ??= {}; // { [skillId]: rank }

  // Puntos de habilidad
  if (p.skillPoints == null) {
    const lvl = Number.isFinite(p.lvl) ? p.lvl : 1;
    // nivel 1 => 0 puntos, nivel 2 => 1 punto, etc.
    p.skillPoints = Math.max(0, lvl - 1);
  }

  // =========================
  // ✅ SKILL COMBAT RUNTIME (transitorio)
  // =========================
  p.skillCooldowns = {};  // cooldowns por skill (performance.now)
  p.buffs = {};           // buffs temporales (expiran con performance.now)
  p.casting = null;       // si luego metes cast-times
}

function serializeState(state) {
  // 👉 1) clonamos el player
  const p = deepClone(state.player);

  // 👉 2) eliminamos datos TEMPORALES (no deben guardarse)
  delete p.skillCooldowns;
  delete p.buffs;
  delete p.casting;

  // 👉 3) usamos el player limpio en la save
  return {
    version: 1,
    savedAt: Date.now(),
    seed: state.seed >>> 0,
    mapId: state.mapId,

    player: p, // ⬅️ aquí está el cambio real
    quests: deepClone(state.quests),

    tilesRows: tilesToStrings(state.tiles),
    map: state.map,
    npcs: state.npcs,
    exits: state.exits,
    discovered: state.discovered,

    entities: Array.from(state.entities.entries()),
    mapCache: mapCacheToJSON(state.mapCache),

    flags: {
      inCombat: state.inCombat,
      turn: state.turn,
      over: state.over
    }
  };
}

function applyLoadedState(state, data){
  // RNG/seed
  setSeed((data.seed ?? Date.now()) >>> 0);

  state.mapId = data.mapId ?? "town_01";

  // mapas
  state.tiles = stringsToTiles(data.tilesRows);
  state.map = data.map ?? [];
  state.npcs = data.npcs ?? [];
  state.exits = data.exits ?? [];
  state.discovered = data.discovered ?? [];

  // entidades
  state.entities = new Map(data.entities ?? []);

  // cache de mapas
  state.mapCache = mapCacheFromJSON(data.mapCache);

  // player/quests
  state.player = data.player ?? state.player;
  state.quests = data.quests ?? state.quests;

  // IMPORTANTÍSIMO: limpiar transitorios del player al cargar
  normalizeLoadedPlayer(state.player);

  // ✅ IMPORTANTÍSIMO: asegurar + renderizar action bar al cargar (evita “no aparece hasta pulsar”)
  ensureActionBar(state.player);
  renderActionBar(state);

  // flags
  state.inCombat = data.flags?.inCombat ?? null;
  state.turn = data.flags?.turn ?? 0;
  state.over = data.flags?.over ?? false;

  // cierra diálogo si estaba abierto
  state.dialog = { open:false, npcId:null, pages:[], pageIndex:0 };
}

export function saveToSlot(state, slotIndex){
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY), []);
  const saves = Array.isArray(parsed) ? parsed : [];

  const snap = serializeState(state);
  const meta = {
    savedAt: snap.savedAt,
    mapId: snap.mapId,
    lvl: snap.player?.lvl ?? 1,
    hp: snap.player?.hp ?? 0,
    hpMax: snap.player?.hpMax ?? 0
  };

  saves[slotIndex] = { meta, data: snap };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  return true;
}

export function loadFromSlot(state, slotIndex){
  const saves = safeParse(localStorage.getItem(STORAGE_KEY), []);
  const entry = saves?.[slotIndex];
  if (!entry?.data) return false;

  applyLoadedState(state, entry.data);

  // ✅ reset input tras cargar (arregla Shift/Space/teclas fantasma)
  resetKeys();

  return true;
}

export function deleteSlot(slotIndex){
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY), []);
  const saves = Array.isArray(parsed) ? parsed : [];

  if (slotIndex < 0 || slotIndex >= saves.length) return false;

  saves[slotIndex] = null;

  // Opcional: limpia nulls finales para no crecer infinito
  while (saves.length && saves[saves.length - 1] == null){
    saves.pop();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  return true;
}
