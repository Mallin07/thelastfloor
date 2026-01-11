// ui/render/vfx_attack.js
import * as UIASSETS from "../assets.js";          // <- para poder resolver exports dinámicamente
import { ASSETS, ATK_SLASH_01 } from "../assets.js";

// ✅ AJUSTA ESTE IMPORT si tu archivo se llama distinto:
// - skill_vfx_db.js
// - skill_vfz_db.js
import { getSkillVFXSpec } from "../../data/skill_vfx_db.js";

function dirToAngle(dir){
  const BASE = -Math.PI / 2; // sprite base vertical
  switch (dir){
    case "right": return BASE + 0;
    case "down":  return BASE + Math.PI / 2;
    case "left":  return BASE + Math.PI;
    case "up":    return BASE - Math.PI / 2;
    default:      return BASE;
  }
}

function dirToOffset(dir, dist){
  switch (dir){
    case "right": return { dx: dist, dy: 0 };
    case "left":  return { dx: -dist, dy: 0 };
    case "down":  return { dx: 0, dy: dist };
    case "up":    return { dx: 0, dy: -dist };
    default:      return { dx: 0, dy: dist };
  }
}

function getPlayerDir(state){
  const p = state.player;
  let dir = p.atkDirStr || p.lookDirStr;

  if (!dir) {
    const fx = p._facingLock?.x ?? p.facingX ?? 0;
    const fy = p._facingLock?.y ?? p.facingY ?? 0;

    dir = "down";
    if (Math.abs(fx) > Math.abs(fy)) dir = fx > 0 ? "right" : "left";
    else if (fy !== 0) dir = fy > 0 ? "down" : "up";
  }
  return dir || "down";
}

function isDrawableImage(img){
  return img && img.complete && img.naturalWidth !== 0;
}

// Resuelve spec.asset a:
// - ASSETS[asset] (imagen)
// - exports de ../assets.js (UIASSETS[...]) por si es array de frames o imagen
function resolveAsset(assetKey){
  if (!assetKey) return null;

  // 1) ASSETS.fireball (imagen)
  const fromMap = ASSETS?.[assetKey];
  if (fromMap) return fromMap;

  // 2) export directo: UIASSETS.fireball / UIASSETS.FIREBALL / UIASSETS.FIREBALL_01...
  if (UIASSETS?.[assetKey]) return UIASSETS[assetKey];

  const upper = String(assetKey).toUpperCase();
  if (UIASSETS?.[upper]) return UIASSETS[upper];

  // 3) heurísticas comunes
  const tryKeys = [
    `${upper}_01`,
    `${upper}_FRAMES`,
    `${upper}_ANIM`,
    `${upper}_SPRITE`,
  ];
  for (const k of tryKeys){
    if (UIASSETS?.[k]) return UIASSETS[k];
  }

  return null;
}

// Si el asset es array -> frames animados
function pickFrame(asset, t01){
  if (Array.isArray(asset)){
    if (asset.length === 0) return null;
    const idx = Math.min(asset.length - 1, Math.floor(t01 * asset.length));
    return asset[idx];
  }
  return asset; // imagen única
}

/**
 * ✅ API pública para spawnear VFX de skill.
 *
 * Ejemplo de uso desde useSkill():
 * spawnSkillVFX(state, skillId, {
 *   from: { x: p.px, y: p.py },
 *   to: { x: target.px, y: target.py },
 *   dir: p.lookDirStr,
 * });
 */
export function spawnSkillVFX(state, skillId, payload = {}){
  const p = state.player;
  p.vfx ??= [];

  const spec = getSkillVFXSpec(skillId);
  if (!spec) return false;

  const now = performance.now();
  const dir = payload.dir || getPlayerDir(state);

  p.vfx.push({
    kind: "skill",
    skillId,
    type: spec.type,                 // "projectile" | "melee" | "aoe"...
    asset: spec.asset,               // string
    startedAt: now,
    duration: spec.duration ?? 250,
    rotOffset: spec.rotOffset ?? 0,

    // posiciones (projectile)
    from: payload.from ?? { x: p.px, y: p.py },
    to: payload.to ?? payload.target ?? null,

    // dirección (melee)
    dir,

    // params extra opcionales
    speed: spec.speed ?? null,
    scale: spec.scale ?? 1,
    offsetPx: spec.offsetPx ?? null,
  });

  return true;
}

/**
 * Dibuja el slash del ataque básico (igual que antes).
 */
function drawBasicAttackSlash(ctx, state, TILE){
  const p = state.player;
  const now = performance.now();

  if (!p.atkAnimUntil || now > p.atkAnimUntil) return;

  const frames = ATK_SLASH_01;
  if (!frames || frames.length === 0) return;

  const DUR = 140;
  const t01 = 1 - (p.atkAnimUntil - now) / DUR; // 0..1
  const img = pickFrame(frames, t01);
  if (!isDrawableImage(img)) return;

  const dir = getPlayerDir(state);
  const angle = dirToAngle(dir);

  // sprite 96x32 => 3 tiles x 1 tile
  const SCALE = 0.5;   // 3 tiles → ~2 tiles
  const w = TILE * 3 * SCALE;
  const h = TILE * SCALE;

  // ✅ distancia adelantada
  const dist = TILE * 0.60;
  const { dx, dy } = dirToOffset(dir, dist);

  ctx.save();
  ctx.translate(p.px + dx, p.py + dy);
  ctx.rotate(angle);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/**
 * Dibuja VFX de skills (projectile / melee).
 * Limpia automáticamente los VFX expirados.
 */
function drawSkillVFX(ctx, state, TILE){
  const p = state.player;
  if (!p.vfx || p.vfx.length === 0) return;

  const now = performance.now();

  // mantenemos solo los activos
  p.vfx = p.vfx.filter(vfx => {
    const dur = Math.max(1, vfx.duration || 1);
    const t01 = (now - vfx.startedAt) / dur;
    if (t01 >= 1) return false;

    const asset = resolveAsset(vfx.asset);
    const img = pickFrame(asset, t01);
    if (!isDrawableImage(img)) return true; // si aún no carga, no lo matamos

    const scale = Number(vfx.scale ?? 1) || 1;

    // --- PROJECTILE ---
    if (vfx.type === "projectile" && vfx.to){
      const fx = vfx.from?.x ?? p.px;
      const fy = vfx.from?.y ?? p.py;
      const tx = vfx.to?.x ?? fx;
      const ty = vfx.to?.y ?? fy;

      const x = fx + (tx - fx) * t01;
      const y = fy + (ty - fy) * t01;

      // tamaño: por defecto 1 tile (ajusta en spec.scale si quieres)
      const w = TILE * 1.0 * scale;
      const h = TILE * 1.0 * scale;

      // rotación hacia el objetivo (opcional, queda bien en flechas)
      const ang = Math.atan2(ty - fy, tx - fx);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      return true;
    }

    // --- MELEE ---
    if (vfx.type === "melee"){
      const dir = vfx.dir || getPlayerDir(state);
      const angle = dirToAngle(dir) + (vfx.rotOffset ?? 0);

      // slash por defecto: ancho 2 tiles, alto 1 tile
      const w = TILE * 2.0 * scale;
      const h = TILE * 1.0 * scale;

      // offset delante del jugador
      const dist = (vfx.offsetPx != null) ? vfx.offsetPx : TILE * 0.65;
      const { dx, dy } = dirToOffset(dir, dist);

      ctx.save();
      ctx.translate(p.px + dx, p.py + dy);
      ctx.rotate(angle);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      return true;
    }

    // otros tipos: no dibujamos todavía, pero lo mantenemos hasta expirar
    return true;
  });
}

/**
 * ✅ Mantén el mismo nombre público para no tocar el resto del render.
 * Ahora dibuja:
 * 1) slash básico
 * 2) VFX de skills
 */
export function drawAttackVFX(ctx, state, TILE){
  drawBasicAttackSlash(ctx, state, TILE);
  drawSkillVFX(ctx, state, TILE);
}
