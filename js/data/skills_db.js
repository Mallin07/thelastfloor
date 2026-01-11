// js/data/skills_db.js
// Base de datos data-driven de habilidades.
// NOTA: "weapon" es el tipo lógico requerido (luego lo mapearemos al equipo real).

export const SKILL_BRANCH = {
  warrior: { name: "Guerrero", weapon: "sword"  },
  archer:  { name: "Arquero",  weapon: "bow"    },
  mage:    { name: "Mago",     weapon: "wand"   },
  defense: { name: "Defensa",  weapon: "shield" },
};

/**
 * Formato:
 * {
 *   id, name, desc,
 *   branch, weapon,
 *   maxRank,
 *   costPerRank: number | (rankNext)=>number,
 *   requires: {
 *     level?: number,
 *     completedQuest?: string,
 *     prereq?: Array<{ id:string, rank:number }>
 *   }
 * }
 */
export const SKILLS = {
  // =========================
  // Mago (Varita)
  // =========================
  fireball: {
    id: "fireball",
    name: "Bola de fuego",
    icon: "js/assets/habilidades_slot/boladefuego.png",
    desc: "Lanza una bola de fuego al objetivo.",
    branch: "mage",
    weapon: "wand",
    maxRank: 4,
    costPerRank: 1,
    requires: { level: 2 },
  },

  chain_lightning: {
    id: "chain_lightning",
    name: "Cadena de relámpagos",
    desc: "Relámpago que salta entre enemigos cercanos.",
    branch: "mage",
    weapon: "wand",
    maxRank: 3,
    costPerRank: 1,
    requires: { level: 5, prereq: [{ id: "fireball", rank: 1 }] },
  },

  flame_floor: {
    id: "flame_floor",
    name: "Suelo en llamas",
    desc: "Prende el suelo, dañando a quienes pisen la zona.",
    branch: "mage",
    weapon: "wand",
    maxRank: 3,
    costPerRank: 1,
    requires: { completedQuest: "kill_slimes_3", prereq: [{ id: "fireball", rank: 2 }] },
  },

  // =========================
  // Arquero (Arco)
  // =========================
  shoot_arrow: {
    id: "shoot_arrow",
    name: "Disparar flecha",
    icon: "js/assets/habilidades_slot/shoot_arrow.png",
    desc: "Disparo básico con arco.",
    branch: "archer",
    weapon: "bow",
    maxRank: 4,
    costPerRank: 1,
    requires: { level: 2 },
  },

  multishot: {
    id: "multishot",
    name: "Disparo múltiple",
    desc: "Dispara varias flechas en abanico.",
    branch: "archer",
    weapon: "bow",
    maxRank: 3,
    costPerRank: 1,
    requires: { level: 6, prereq: [{ id: "shoot_arrow", rank: 2 }] },
  },

  // =========================
  // Guerrero (Espada)
  // =========================
  power_strike: {
    id: "power_strike",
    name: "Golpe poderoso",
    icon: "js/assets/habilidades_slot/power_strike.png",
    desc: "Un ataque fuerte que aumenta el daño.",
    branch: "warrior",
    weapon: "sword",
    maxRank: 1,
    costPerRank: 3,
    requires: { level: 2 },
  },

  whirlwind: {
    id: "whirlwind",
    name: "Torbellino",
    desc: "Gira atacando a todos alrededor.",
    branch: "warrior",
    weapon: "sword",
    maxRank: 3,
    costPerRank: 1,
    requires: { level: 7, prereq: [{ id: "power_strike", rank: 2 }] },
  },

  // =========================
  // Defensa (Escudo)
  // =========================
  magic_shield: {
    id: "magic_shield",
    name: "Escudo mágico",
    desc: "Aumenta la defensa durante un tiempo.",
    branch: "defense",
    weapon: "shield",
    maxRank: 4,
    costPerRank: 1,
    requires: { level: 2 },
  },

  shield_bash: {
    id: "shield_bash",
    name: "Embate con escudo",
    desc: "Golpea con el escudo para aturdir.",
    branch: "defense",
    weapon: "shield",
    maxRank: 3,
    costPerRank: 1,
    requires: { level: 6, prereq: [{ id: "magic_shield", rank: 1 }] },
  },
};

// Helpers opcionales (por si los quieres ya para UI/logic)
export function getSkill(id){
  return SKILLS[id] ?? null;
}

export function allSkills(){
  return Object.values(SKILLS);
}

export function skillsByBranch(branchId){
  return allSkills().filter(s => s.branch === branchId);
}
