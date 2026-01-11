//js/core/state.js
import { mulberry32 } from "./utils.js";
import { loadMap } from "../world/map.js";
import { CARP_ITEMS } from "../data/items/carp_items.js";

// ✅ Ajusta esta ruta si tu inventory.js está en otro sitio.
// Por el código que pegaste, parece estar en: js/systems/inventory.js o js/core/...
import { recomputeStats } from "../entities/inventory.js";

export const state = {
  rng: mulberry32(Date.now() & 0xffffffff),
  seed: (Date.now() & 0xffffffff),

  // mapa actual
  mapId: null,

  // colisión: 0 suelo, 1 pared
  map: [],

  // tiles “lógicos/visuales” (chars del ASCII)
  tiles: [],

  // fog of war
  discovered: [],

  // npc / exits del mapa
  npcs: [],
  exits: [],

  // entidades en mundo continuo (px/py)
  entities: new Map(),

  // recogida con tiempo
  pickup: null,

  // flags
  inCombat: null,
  turn: 0,
  over: false,

  // dialogos
  dialog: {
    open: false,
    npcId: null,        // "maestro"
    pages: [],          // [{ type:"text", text:"..." } | { type:"choice", text:"...", questId:"...", choice:0 }]
    pageIndex: 0,
  },

  // ✅ quests
  quests: {
    active: {},     // { [questId]: { progress, startedAt } }
    completed: {},  // { [questId]: true }
  },

  player: {
    facingX: 0,
    facingY: 1, // por defecto mira hacia abajo

    lookX: 0,
    lookY: 1,
    lookDirStr: "down",

    // ✅ animación del héroe
    anim: {
      dir: "down",   // "up" | "down" | "left" | "right"
      frame: 0,      // 0..N-1
      time: 0,       // acumulador en segundos
    },

    atkAnimUntil: 0,
    atkAnimTiles: [],
    nextAtkTime: 0,

    px: 64,
    py: 64,
    r: 12,
    vx: 0,
    vy: 0,

    hp: 20,
    hpMax: 20,
    mp: 12,
    mpMax: 12,
    hunger: 100,
    hungerMax: 100,

    lvl: 1,
    xp: 0,
    xpNext: 10,

    // ✅ Skills (Punto 1)
    skillPoints: 0,
    skills: {}, // { [skillId]: rank }

    // ✅ Combat runtime (skills)
    skillCooldowns: {},
    buffs: {},
    casting: null, // { skillId, untilMs } | null

    atk: 3,
    def: 0,
    gold: 0,

    actionBar: {
      // 0 = consumible de cocina
      0: { type: "consumable", id: "stew" },   // ejemplo: guiso
      // 5 = ataque básico (reservado)
      5: { type: "basic_attack" },

      // el resto empieza vacío
      1: null, 2: null, 3: null, 4: null,
      6: null, 7: null, 8: null, 9: null,
    },

    consumables: {
      stew: 0,
    },

    inventory: Array(9).fill(null),
    bank: Array(36).fill(null),

    equipment: {
      head: null,
      chest: null,
      legs: null,
      feet: null,
      // ✅ Empieza equipada como OBJETO (no string)
      mainHand: { ...CARP_ITEMS.wood_sword },
      offHand: null
    }
  }
};

export function setSeed(seed){
  state.seed = seed >>> 0;
  state.rng = mulberry32(state.seed);
}

function makeFreshPlayer(){
  return {
    facingX: 0,
    facingY: 1,

    lookX: 0,
    lookY: 1,
    lookDirStr: "down",

    anim: {
      dir: "down",
      frame: 0,
      time: 0,
    },

    atkAnimUntil: 0,
    atkAnimTiles: [],
    nextAtkTime: 0,

    px: 64,
    py: 64,
    r: 12,
    vx: 0,
    vy: 0,

    hp: 20,
    hpMax: 20,
    mp: 12,
    mpMax: 12,

    hunger: 100,
    hungerMax: 100,

    lvl: 1,
    xp: 0,
    xpNext: 10,

    skillPoints: 0,
    skills: {},

    skillCooldowns: {},
    buffs: {},
    casting: null,

    atk: 3,
    def: 0,
    potions: 1,
    gold: 0,

    actionBar: {
      0: { type: "consumable", id: "stew" },
      5: { type: "basic_attack" },

      1: null, 2: null, 3: null, 4: null,
      6: null, 7: null, 8: null, 9: null,
    },

    consumables: {
      stew: 0,
    },

    inventory: Array(9).fill(null),

    equipment: {
      head: null,
      chest: null,
      legs: null,
      feet: null,
      // ✅ Empieza equipada también en reset
      mainHand: { ...CARP_ITEMS.wood_sword },
      offHand: null
    }
  };
}

export function resetState(){
  state.entities = new Map();
  state.pickup = null;
  state.inCombat = null;
  state.turn = 0;
  state.over = false;
  state.quests = { active: {}, completed: {} };
  state.dialog = { open:false, npcId:null, pages:[], pageIndex:0 };

  // limpia mapa actual
  state.mapId = null;
  state.map = [];
  state.tiles = [];
  state.discovered = [];
  state.npcs = [];
  state.exits = [];

  // resetea player (nota: loadMap recoloca px/py según spawn)
  state.player = makeFreshPlayer();

  // 👇 carga el primer mapa
  loadMap(state, "town_01", "S");

  // ✅ igual que al equipar desde inventario: recalcula stats con el equipo inicial
  recomputeStats(state);
}
