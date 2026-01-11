// ui/render/entities.js
import { ASSETS } from "../assets.js";
import { makeItem } from "../../entities/item_factory.js";
import { CONFIG } from "../../core/config.js";
import { getSkillVFXSpec } from "../../data/skill_vfx_db.js";
import * as UIASSETS from "../assets.js";

function clamp01(x){
  return Math.max(0, Math.min(1, x));
}

function resolveAsset(assetKey){
  if (!assetKey) return null;

  // 1) ASSETS[...] (imagenes sueltas)
  const fromMap = ASSETS?.[assetKey];
  if (fromMap) return fromMap;

  // 2) exports directos: UIASSETS.FIREBALL, UIASSETS.SHIELD_HIT, etc.
  if (UIASSETS?.[assetKey]) return UIASSETS[assetKey];

  const upper = String(assetKey).toUpperCase();
  if (UIASSETS?.[upper]) return UIASSETS[upper];

  return null;
}

// ✅ drawImage seguro (evita crash por imágenes rotas / 404 / decode fail)
function safeDrawImage(ctx, img, x, y, w, h){
  if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return false;
  try {
    ctx.drawImage(img, x, y, w, h);
    return true;
  } catch (e) {
    return false;
  }
}

function drawSprite(ctx, img, x, y, targetH){
  if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

  const scale = targetH / img.naturalHeight;
  const w = img.naturalWidth * scale;
  const h = targetH;

  // y = suelo (pies)
  safeDrawImage(ctx, img, x - w / 2, y - h, w, h);
}

// ✅ Barra de vida de enemigo (solo tras recibir daño reciente)
function drawEnemyHpBar(ctx, e, now){
  if (!e || e.kind !== "enemy") return;

  // si está full vida, no hace falta mostrar nada
  if (typeof e.hp !== "number" || typeof e.hpMax !== "number" || e.hpMax <= 0) return;
  if (e.hp >= e.hpMax) return;

  // si nunca recibió daño (o no existe timestamp), no mostrar
  if (e.lastHitAt == null) return;

  const HP_BAR_VISIBLE_MS = 1800;
  const dt = now - e.lastHitAt;
  if (dt < 0 || dt > HP_BAR_VISIBLE_MS) return;

  const t = Math.max(0, Math.min(1, e.hp / e.hpMax));

  const w = 26;
  const h = 4;
  const x = Math.floor(e.px - w / 2);
  const y = Math.floor(e.py - 36);

  // opcional: pequeño fade al final
  const fadeStart = HP_BAR_VISIBLE_MS * 0.7;
  const alpha = dt <= fadeStart ? 0.9 : 0.9 * (1 - (dt - fadeStart) / (HP_BAR_VISIBLE_MS - fadeStart));

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(0.9, alpha));

  // fondo
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  // vida (verde/amarillo/rojo)
  ctx.fillStyle = (t > 0.5) ? "#3bd16f" : (t > 0.25) ? "#e6c94c" : "#d64545";
  ctx.fillRect(x, y, Math.floor(w * t), h);

  ctx.restore();
}

function drawPickupBarOverItem(ctx, state, e){
  const job = state.pickup;
  if (!job || job.kind !== "item") return;

  const TILE = CONFIG.TILE;
  const targetCx = (job.fx + 0.5) * TILE;
  const targetCy = (job.fy + 0.5) * TILE;

  const dx = e.px - targetCx;
  const dy = e.py - targetCy;
  const tol = TILE * 0.45;
  if (Math.abs(dx) > tol || Math.abs(dy) > tol) return;

  const t = clamp01((performance.now() - job.startedAt) / job.durationMs);

  const w = Math.floor(TILE * 0.9);
  const h = 6;
  const x = Math.floor(e.px - w / 2);
  const y = Math.floor(e.py - 26);

  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillRect(x, y, Math.floor(w * t), h);
  ctx.restore();
}

export function drawEntities(ctx, state){
  if (!(state.entities instanceof Map) || !state.entities.size) return;

  const now = performance.now();

  // ============================
  // ENTIDADES NORMALES
  // ============================
  for (const e of state.entities.values()){
    // ENEMIGOS
    if (e.kind === "enemy"){
      let img = null;
      if (e.type === "slime") img = ASSETS.enemy_slime;
      else if (e.type === "goblin") img = ASSETS.enemy_goblin;
      else if (e.type === "wolf") img = ASSETS.enemy_wolf;
      else if (e.type === "spider") img = ASSETS.enemy_spider;

      drawSprite(ctx, img, e.px, e.py, 32);

      // ✅ barra de vida (solo si recibió daño hace poco)
      drawEnemyHpBar(ctx, e, now);
    }

    // ITEMS
    if (e.kind === "item"){
      let img = null;
      if (e.type === "mushroom") img = ASSETS.item_mushroom;
      if (e.type === "stone_ore") img = ASSETS.item_stone_ore;

      if (img && img.complete && img.naturalWidth !== 0){
        safeDrawImage(ctx, img, e.px - 16, e.py - 16, 32, 32);
      } else {
        const it = makeItem(e.type);
        ctx.font = "16px sans-serif";
        ctx.fillText(it?.icon ?? "✨", e.px - 8, e.py + 6);
      }

      drawPickupBarOverItem(ctx, state, e);
    }

    // ANIMALES
    if (e.kind === "animal"){
      const img = ASSETS.animal_hare;
      safeDrawImage(ctx, img, e.px - 16, e.py - 16, 32, 32);
    }
  }

  // ============================
  // PROJECTILES (ANIMADOS)
  // ============================
  const projectiles = state.projectiles ?? [];

  for (const p of projectiles){
    const vfx = getSkillVFXSpec(p.skillId);
    if (!vfx) continue;

    const frames = resolveAsset(vfx.asset); // array de frames (Image[])
    if (!Array.isArray(frames) || frames.length === 0) continue;

    // si no existe startedAt (por compat), lo creamos una vez
    if (!p.startedAt) p.startedAt = now;

    const dur = vfx.duration ?? 300;
    const t01 = clamp01((now - p.startedAt) / dur);

    const idx = Math.min(frames.length - 1, Math.floor(t01 * frames.length));
    const img = frames[idx];

    const size = vfx.size ?? 24;

    // Dirección hacia el target (homing)
    const tx = p.target?.px ?? p.px;
    const ty = p.target?.py ?? p.py;

    const dx = tx - p.px;
    const dy = ty - p.py;

    // ángulo hacia el target (0 rad = derecha)
    const ang = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(p.px, p.py);
    ctx.rotate(ang);

    // si tu sprite "mira" hacia arriba por defecto, suma/resta PI/2.
    // Si "mira" a la derecha (como dices), no hace falta offset.
    const ROT_OFFSET = 0; // prueba: 0, Math.PI/2, -Math.PI/2
    ctx.rotate(ROT_OFFSET);

    // dibuja centrado
    safeDrawImage(ctx, img, -size / 2, -size / 2, size, size);

    ctx.restore();
  }
}
