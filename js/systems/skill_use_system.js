// js/systems/skill_use_system.js
import { logBad, logOk } from "../ui/log.js";
import { getSkillRank, canUseSkill } from "../entities/skills.js";
import { nearestEnemy, damageEnemy, spawnProjectile } from "./combat_system.js";
import { getSkillCombatSpec } from "../data/skill_combat_db.js";
import { getSkillVFXSpec } from "../data/skill_vfx_db.js";
import { spawnSkillVFX } from "../ui/render/vfx_attack.js";


function num(x, fallback) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function getNow() {
  return performance.now();
}

export function getCooldownRemainingMs(state, skillId) {
  const p = state.player;
  const now = getNow();
  const t = num(p.skillCooldowns?.[skillId], 0);
  return Math.max(0, t - now);
}

/**
 * Valida si una skill se puede USAR ya (en combate).
 * Devuelve { ok, reason?, info? }
 *
 * reason:
 * - "unknown_skill"
 * - "not_learned"
 * - "wrong_weapon" (viene de canUseSkill)
 * - "no_mana"
 * - "cooldown"
 * - "no_target"
 */
export function canCastSkill(state, skillId) {
  const p = state.player;

  const spec = getSkillCombatSpec(skillId);
  if (!spec) return { ok: false, reason: "unknown_skill" };

  const rank = getSkillRank(state, skillId);
  if (rank <= 0) return { ok: false, reason: "not_learned" };

  // arma equipada (tu lógica ya existe)
  const weaponCheck = canUseSkill(state, skillId);
  if (!weaponCheck.ok) return weaponCheck; // reason: "unknown_skill" | "wrong_weapon"

  // cooldown
  const cdLeft = getCooldownRemainingMs(state, skillId);
  if (cdLeft > 0) return { ok: false, reason: "cooldown", info: { ms: cdLeft } };

  // mana
  const mpCost = num(typeof spec.mpCost === "function" ? spec.mpCost(rank, state) : spec.mpCost, 0);
  const mp = num(p.mp, 0);
  if (mp < mpCost) return { ok: false, reason: "no_mana", info: { need: mpCost, have: mp } };

  // target (solo para skills que lo necesiten)
  const needsTarget = (spec.kind === "projectile" || spec.kind === "melee" || spec.kind === "melee_cc");
  if (needsTarget) {
    const rangePx = num(spec.rangePx, 0);
    const t = nearestEnemy(state, rangePx); // ya existe :contentReference[oaicite:1]{index=1}
    if (!t) return { ok: false, reason: "no_target", info: { rangePx } };
  }

  return { ok: true, info: { rank, mpCost } };
}

export function useSkill(state, skillId) {
  if (state.over) return { ok: false, reason: "game_over" };

  const p = state.player;
  p.skillCooldowns ??= {};

  const check = canCastSkill(state, skillId);
  if (!check.ok) return check;

  const spec = getSkillCombatSpec(skillId);
  const rank = check.info.rank;

  const mpCost = check.info.mpCost ?? 0;
  p.mp = num(p.mp, 0) - mpCost;

  const cdMs = num(
    typeof spec.cooldownMs === "function" ? spec.cooldownMs(rank, state) : spec.cooldownMs,
    0
  );
  p.skillCooldowns[skillId] = getNow() + Math.max(0, cdMs);

  const dir = p.lookDirStr || p.atkDirStr || p.dir || "s"; // dirección actual

  // ==================================================
  // ✅ projectile: VFX + daño
  // ==================================================
  if (spec.kind === "projectile") {
    const rangePx = Number(spec.rangePx) || 0;
    const target = nearestEnemy(state, rangePx);
    if (!target) return { ok: false, reason: "no_target", info: { rangePx } };
  
    const dmg = typeof spec.damage === "function" ? spec.damage(rank, state) : 1;
  
    // velocidad real desde skill_vfx_db (fallback 360)
    const vfxSpec = getSkillVFXSpec(skillId);
    const speed = Number(vfxSpec?.speed) || 360;
  
    spawnProjectile(state, {
      px: p.px,
      py: p.py,
      r: 6,
      target,
      speedPxPerSec: speed,
      maxRangePx: rangePx,
      dmg,
      skillId,
    });
  
    return { ok: true, info: { rank, mpCost, cdMs, dmg, speed } };
  }

  // ==================================================
  // ✅ melee: VFX + daño
  // ==================================================
  if (spec.kind === "melee") {
    const rangePx = Number(spec.rangePx) || 0;
    const target = nearestEnemy(state, rangePx);
    if (!target) return { ok: false, reason: "no_target", info: { rangePx } };

    // ✅ VFX
    spawnSkillVFX(state, skillId, { dir });

    const dmg = typeof spec.damage === "function" ? spec.damage(rank, state) : 1;

    damageEnemy(
      state,
      target,
      dmg,
      `Usas ${skillId} y golpeas a ${target.type} por ${dmg} daño.`
    );

    return { ok: true, info: { rank, mpCost, cdMs, dmg } };
  }

  // ==================================================
  // ✅ melee_cc: VFX + daño + stun
  // ==================================================
  if (spec.kind === "melee_cc") {
    const rangePx = Number(spec.rangePx) || 0;
    const target = nearestEnemy(state, rangePx);
    if (!target) return { ok: false, reason: "no_target", info: { rangePx } };

    // ✅ VFX
    spawnSkillVFX(state, skillId, { dir });

    const dmg = typeof spec.damage === "function" ? spec.damage(rank, state) : 1;

    damageEnemy(
      state,
      target,
      dmg,
      `Usas ${skillId} y golpeas a ${target.type} por ${dmg} daño.`
    );

    const stunMs = typeof spec.stunMs === "function" ? spec.stunMs(rank, state) : (spec.stunMs ?? 0);
    const until = getNow() + Math.max(0, stunMs);
    target.stunnedUntil = Math.max(target.stunnedUntil || 0, until);

    logOk(`${target.type} queda aturdido ${Math.ceil(stunMs / 1000)}s.`);
    return { ok: true, info: { rank, mpCost, cdMs, dmg, stunMs } };
  }

  // ==================================================
  // ✅ buff: VFX + aplicar buff
  // ==================================================
  if (spec.kind === "buff") {
    // ✅ VFX (ej: aura/flash)
    spawnSkillVFX(state, skillId, { dir });

    p.buffs ??= {};

    const durationMs =
      typeof spec.durationMs === "function" ? spec.durationMs(rank, state) : (spec.durationMs ?? 0);

    const defBonus =
      typeof spec.defBonus === "function" ? spec.defBonus(rank, state) : (spec.defBonus ?? 0);

    const prev = p.buffs[skillId];
    if (prev && prev.defBonusApplied) {
      p.def = (p.def || 0) - prev.defBonusApplied;
    }

    const applied = Math.max(0, Math.floor(defBonus));
    p.def = (p.def || 0) + applied;

    p.buffs[skillId] = {
      untilMs: getNow() + Math.max(0, durationMs),
      defBonusApplied: applied,
    };

    logOk(`Activaste ${skillId} (+${applied} DEF).`);
    return { ok: true, info: { rank, mpCost, cdMs, durationMs, defBonus: applied } };
  }

  // fallback
  logOk(`Usas ${skillId} (rango ${rank}).`);
  return { ok: true, info: { rank, mpCost, cdMs } };
}



export function humanCastFail(check) {
  switch (check.reason) {
    case "not_learned": return "No has aprendido esa habilidad.";
    case "wrong_weapon": return `Necesitas ${check.info?.need} (llevas ${check.info?.equipped}).`;
    case "no_mana": return `No tienes maná suficiente (${check.info?.have}/${check.info?.need}).`;
    case "cooldown": return `Aún en enfriamiento (${Math.ceil((check.info?.ms ?? 0)/1000)}s).`;
    case "no_target": return "No hay enemigo en rango.";
    default: return "No puedes usar esa habilidad.";
  }
}
