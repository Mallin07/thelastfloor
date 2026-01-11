// ui/render_canvas.js
import { CONFIG } from "../core/config.js";
import { ASSETS, HERO_ANIMS } from "./assets.js";

import { ZOOM, VISIBLE_MARGIN } from "./render/render_constants.js";
import { resizeCanvasToScreen } from "./render/canvas_resize.js";
import { computeCamera, computeVisibleBounds } from "./render/camera.js";
import { canDraw } from "./render/draw_common.js";

import { drawGround } from "./render/terrain.js";
import { drawObjects } from "./render/objects.js";
import { drawEntities } from "./render/entities.js";
import { drawAttackVFX } from "./render/vfx_attack.js";
import { drawNpcDialog } from "./render/dialog.js";
import { drawDecorations } from "./render/decorations.js";

function vecToDirStr(fx, fy){
  if (Math.abs(fx) > Math.abs(fy)) return fx > 0 ? "right" : "left";
  if (fy !== 0) return fy > 0 ? "down" : "up";
  return "down";
}

export function renderCanvas(state){
  const canvas = document.getElementById("canvas");
  if (!canvas) return;

  resizeCanvasToScreen(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;

  const { TILE } = CONFIG;
  const p = state.player;

  const MAP_H = state.map?.length || 0;
  const MAP_W = state.map?.[0]?.length || 0;
  if (!MAP_W || !MAP_H) return;

  const viewW = canvas.width / ZOOM;
  const viewH = canvas.height / ZOOM;

  const { camX, camY } = computeCamera({ p, viewW, viewH, MAP_W, MAP_H, TILE });
  const { x0, y0, x1, y1 } = computeVisibleBounds({
    camX, camY, viewW, viewH, MAP_W, MAP_H, TILE, VISIBLE_MARGIN
  });

  // =========================
  // 1) LIMPIEZA + CÁMARA
  // =========================
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(ZOOM, 0, 0, ZOOM, -camX * ZOOM, -camY * ZOOM);

  // =========================
  // 2) TERRENO (tiles)
  // =========================
  for (let ty = y0; ty <= y1; ty++){
    for (let tx = x0; tx <= x1; tx++){
      const c = state.tiles?.[ty]?.[tx] ?? ".";
      drawGround(ctx, c, tx, ty, TILE, state.tiles);
    }
  }

  // =========================
  // 3) DECORACIONES (capa)
  // =========================
  drawDecorations(ctx, state, TILE);

  // =========================
  // 4) OBJETOS (tiles)
  // =========================
  for (let ty = y0; ty <= y1; ty++){
    for (let tx = x0; tx <= x1; tx++){
      const c = state.tiles?.[ty]?.[tx] ?? ".";
      drawObjects(ctx, state, c, tx, ty, TILE, state.tiles);
    }
  }

  // =========================
  // 5) HÉROE
  // =========================
  const now = performance.now();
  const attacking = p?.atkAnimUntil && now < p.atkAnimUntil;

  let dir;
  if (attacking) {
    // ✅ durante ataque: NO dependas de anim.dir
    dir = p?.atkDirStr;

    if (!dir && p?.atkDir) dir = vecToDirStr(p.atkDir.x, p.atkDir.y);
    if (!dir && p?._facingLock) dir = vecToDirStr(p._facingLock.x, p._facingLock.y);
    if (!dir) dir = "down";
  } else {
    dir = p?.lookDirStr ?? p?.anim?.dir ?? "down";
  }

  // ✅ permite animar caminar durante el ataque (sin girarse)
  const frame = p?.anim?.frame ?? 0;
  const heroFrameImg = HERO_ANIMS[dir]?.[frame];

  if (canDraw(heroFrameImg)){
    ctx.drawImage(heroFrameImg, p.px - 16, p.py - 16, 32, 32);
  }

  // =========================
  // 6) CAPAS SUPERIORES (orden CLARO)
  // =========================
  drawEntities(ctx, state);           // enemigos/items/animales
  drawAttackVFX(ctx, state, TILE);    // ✅ ataques encima de enemies
  drawNpcDialog(ctx, state, TILE);    // UI encima de todo
}
