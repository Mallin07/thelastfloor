// ui/render/draw_common.js
export function canDraw(img){
  return img && img.complete && img.naturalWidth > 0;
}

// UI HELPERS
export function wrapText(ctx, text, maxWidth){
  const words = (text ?? "").split(" ");
  const lines = [];
  let line = "";

  for (const w of words){
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line){
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawRoundedRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// DECORACIÓN SUELO (noise)
export function hash01(seed, tx, ty, salt = 0){
  let h = (seed ^ (tx * 374761393) ^ (ty * 668265263) ^ (salt * 1442695041)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function pickFrom(arr, seed, tx, ty, salt = 0){
  if (!arr || arr.length === 0) return null;
  const r = hash01(seed, tx, ty, salt);
  const idx = Math.floor(r * arr.length);
  return arr[idx];
}
