// ui/render/terrain.js
import { ASSETS } from "../assets.js";
import { canDraw } from "./draw_common.js";

export function pickGrass(tx, ty){
  const arr = ASSETS.grass;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const idx = (tx * 37 + ty * 17) % arr.length;
  const img = arr[idx];
  return canDraw(img) ? img : null;
}

export function drawGround(ctx, c, tx, ty, TILE, tiles){
  const x = tx * TILE;
  const y = ty * TILE;

  ctx.fillStyle = "#3a7d44";
  ctx.fillRect(x, y, TILE, TILE);

  const grassImg = pickGrass(tx, ty);
  if (grassImg) ctx.drawImage(grassImg, x, y, TILE, TILE);

  if (c === "="){
    const up    = tiles?.[ty - 1]?.[tx] === "=";
    const down  = tiles?.[ty + 1]?.[tx] === "=";
    const left  = tiles?.[ty]?.[tx - 1] === "=";
    const right = tiles?.[ty]?.[tx + 1] === "=";

    const vertical = (up || down) && !(left || right);
    const horizontal = (left || right) && !(up || down);

    const img =
      vertical ? ASSETS.caminoV :
      horizontal ? ASSETS.caminoH :
      ASSETS.caminoH;

    if (canDraw(img)) ctx.drawImage(img, x, y, TILE, TILE);
  }
}
