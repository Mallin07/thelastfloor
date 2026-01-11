// js/entities/skills.js
import { SKILLS, getSkill } from "../data/skills_db.js";

/** Devuelve el rank actual (0 si no está aprendida) */
export function getSkillRank(state, skillId){
  const p = state.player;
  const r = p?.skills?.[skillId];
  return Number.isFinite(r) ? r : 0;
}

/** Devuelve true si el player cumple el prerequisito de una skill */
function hasPrereq(state, prereqArr){
  if (!Array.isArray(prereqArr) || prereqArr.length === 0) return true;
  for (const req of prereqArr){
    const id = req?.id;
    const rankNeeded = req?.rank ?? 1;
    if (!id) return false;
    if (getSkillRank(state, id) < rankNeeded) return false;
  }
  return true;
}

/** Devuelve true si la quest está completada (si no hay requisito -> true) */
function hasQuestReq(state, questId){
  if (!questId) return true;
  return !!state?.quests?.completed?.[questId];
}

/** Calcula coste de comprar el siguiente rank */
export function getNextRankCost(state, skillId){
  const s = getSkill(skillId);
  if (!s) return null;

  const current = getSkillRank(state, skillId);
  const nextRank = current + 1;

  const c = s.costPerRank;
  if (typeof c === "function") return c(nextRank, state);
  if (Number.isFinite(c)) return c;

  return 1;
}

export function canLearnSkill(state, skillId){
  const p = state.player;
  const s = getSkill(skillId);
  if (!s) return { ok: false, reason: "unknown_skill" };

  const current = getSkillRank(state, skillId);
  const maxRank = s.maxRank ?? 1;

  if (current >= maxRank) return { ok: false, reason: "max_rank" };

  const req = s.requires ?? {};
  const lvlReq = req.level ?? 0;
  if ((p.lvl ?? 1) < lvlReq) {
    return { ok: false, reason: "low_level", info: { needLevel: lvlReq } };
  }

  if (!hasQuestReq(state, req.completedQuest)){
    return { ok: false, reason: "missing_quest", info: { needQuest: req.completedQuest } };
  }

  if (!hasPrereq(state, req.prereq)){
    return { ok: false, reason: "missing_prereq", info: { need: req.prereq } };
  }

  const cost = getNextRankCost(state, skillId);
  const realCost = Number.isFinite(cost) && cost > 0 ? cost : 1;

  const sp = p.skillPoints ?? 0;
  if (sp < realCost){
    return { ok: false, reason: "no_points", info: { needPoints: realCost } };
  }

  return { ok: true, info: { cost: realCost, nextRank: current + 1 } };
}

/**
 * Aprende/mejora una skill (gasta puntos y sube rank).
 */
export function learnSkill(state, skillId){
  const p = state.player;
  p.skills ??= {};
  p.skillPoints ??= 0;

  const check = canLearnSkill(state, skillId);
  if (!check.ok) return { ok: false, reason: check.reason, info: check.info };

  const spent = check.info.cost;
  const newRank = getSkillRank(state, skillId) + 1;

  p.skillPoints -= spent;
  p.skills[skillId] = newRank;

  return { ok: true, newRank, spent };
}

/**
 * Helpers para UI
 */
export function getSkillStatus(state, skillId){
  const s = getSkill(skillId);
  if (!s) return { status: "unknown" };

  const rank = getSkillRank(state, skillId);
  const maxRank = s.maxRank ?? 1;

  if (rank >= maxRank) return { status: "maxed", rank, maxRank };

  const check = canLearnSkill(state, skillId);
  if (check.ok){
    return { status: "available", rank, maxRank, nextCost: check.info.cost };
  }

  return { status: "locked", rank, maxRank, reason: check.reason, info: check.info };
}

// --------------------------------------------------
// ARMAS / VALIDACIÓN DE SKILLS
// --------------------------------------------------

function normStr(s){
  return String(s ?? "").toLowerCase();
}

// plural → singular
function normWeaponType(wt){
  const s = normStr(wt);
  if (s === "wands") return "wand";
  if (s === "bows") return "bow";
  if (s === "swords") return "sword";
  if (s === "shields") return "shield";
  return s;
}

function detectWeaponFromItem(item){
  if (!item) return "none";

  // prioridad: weaponType explícito
  const wt = normWeaponType(item.weaponType);
  if (wt === "wand" || wt === "bow" || wt === "sword" || wt === "shield") {
    return wt;
  }

  // fallback por type / name
  const type = normStr(item.type);
  const name = normStr(item.name);

  if (type.includes("shield") || name.includes("escudo")) return "shield";
  if (type.includes("sword")  || name.includes("espada")) return "sword";
  if (type.includes("bow")    || name.includes("arco"))   return "bow";
  if (type.includes("wand")   || name.includes("varita")) return "wand";

  return "none";
}

/** Devuelve el tipo de arma equipada en MAIN HAND */
export function getMainWeaponType(state){
  const main = state?.player?.equipment?.mainHand ?? null;
  return detectWeaponFromItem(main);
}

/** Devuelve el tipo de arma equipada en OFF HAND */
export function getOffWeaponType(state){
  const off = state?.player?.equipment?.offHand ?? null;
  return detectWeaponFromItem(off);
}

/**
 * Valida si una habilidad se puede USAR según arma equipada.
 * Regla de diseño:
 * - sword  → MAIN hand
 * - wand   → OFF hand
 * - bow    → OFF hand
 * - shield → OFF hand
 */
export function canUseSkill(state, skillId){
  const s = getSkill(skillId);
  if (!s) return { ok: false, reason: "unknown_skill" };

  const required = s.weapon ?? null;
  if (!required) return { ok: true };

  let equipped = "none";

  if (required === "sword") {
    equipped = getMainWeaponType(state);
  } else {
    equipped = getOffWeaponType(state);
  }

  if (equipped !== required){
    return {
      ok: false,
      reason: "wrong_weapon",
      info: { need: required, equipped }
    };
  }

  return { ok: true };
}

