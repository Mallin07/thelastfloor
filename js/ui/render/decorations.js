// ui/render/decorations.js
import { ASSETS } from "../assets.js";
import { canDraw } from "./draw_common.js";

export function drawDecorations(ctx, state, TILE, bounds){
  const arr = state.decorations || [];
  if (!arr.length) return;

  const x0 = bounds?.x0 ?? -Infinity;
  const y0 = bounds?.y0 ?? -Infinity;
  const x1 = bounds?.x1 ??  Infinity;
  const y1 = bounds?.y1 ??  Infinity;

  for (const d of arr){
    const tx = d.tx ?? 0;
    const ty = d.ty ?? 0;
    const wT = d.w ?? 1;
    const hT = d.h ?? 1;

    // culling simple por tiles
    if (tx + wT < x0 || ty + hT < y0 || tx > x1 || ty > y1) continue;

    const img = ASSETS[d.asset];
    if (!canDraw(img)) continue;

    ctx.drawImage(img, tx * TILE, ty * TILE, wT * TILE, hT * TILE);
  }
}
