// ui/render/camera.js
export function computeCamera({ p, viewW, viewH, MAP_W, MAP_H, TILE }){
  let camX = p.px - viewW / 2;
  let camY = p.py - viewH / 2;

  const worldW = MAP_W * TILE;
  const worldH = MAP_H * TILE;

  camX = Math.max(0, Math.min(camX, Math.max(0, worldW - viewW)));
  camY = Math.max(0, Math.min(camY, Math.max(0, worldH - viewH)));

  return { camX, camY, worldW, worldH };
}

export function computeVisibleBounds({ camX, camY, viewW, viewH, MAP_W, MAP_H, TILE, VISIBLE_MARGIN }){
  const x0 = Math.max(0, Math.floor(camX / TILE) - VISIBLE_MARGIN);
  const y0 = Math.max(0, Math.floor(camY / TILE) - VISIBLE_MARGIN);
  const x1 = Math.min(MAP_W - 1, Math.ceil((camX + viewW) / TILE) + VISIBLE_MARGIN);
  const y1 = Math.min(MAP_H - 1, Math.ceil((camY + viewH) / TILE) + VISIBLE_MARGIN);
  return { x0, y0, x1, y1 };
}
