// ui/render/objects.js
import { ASSETS } from "../assets.js";
import { npcQuestIndicatorState } from "../../entities/quests.js";
import { canDraw, hash01, pickFrom } from "./draw_common.js";

// ===============================
// DECORACIÓN SUELO (procedural, sin colisión)
// ===============================
const DECO_GROUPS = {
  yerva: [ASSETS.yerva1, ASSETS.yerva2, ASSETS.yerva3, ASSETS.yerva4, ASSETS.yerva5],
  flor: [ASSETS.flor1, ASSETS.flor2],
  piedra: [ASSETS.piedra1, ASSETS.piedra2, ASSETS.piedra3],
  //tronco: [ASSETS.tronco1, ASSETS.tronco2, ASSETS.tronco3],
  barro: [ASSETS.barro],
};

function npcAtTile(state, tx, ty){
  return state.npcs?.find(n => n.tx === tx && n.ty === ty) ?? null;
}

function drawNPC(ctx, img, tx, ty, TILE){
  if (!canDraw(img)) return;
  const x = tx * TILE + TILE / 2;
  const y = ty * TILE + TILE / 2;
  ctx.drawImage(img, x - 16, y - 16, 32, 32);
}

function isRectTopLeft(tiles, tx, ty, ch, w, h){
  for (let oy = 0; oy < h; oy++){
    for (let ox = 0; ox < w; ox++){
      if (tiles?.[ty + oy]?.[tx + ox] !== ch) return false;
    }
  }
  if (tiles?.[ty]?.[tx - 1] === ch) return false;
  if (tiles?.[ty - 1]?.[tx] === ch) return false;
  return true;
}

function isHouseTopLeft(tiles, tx, ty){
  const ok =
    tiles?.[ty]?.[tx] === "H" &&
    tiles?.[ty]?.[tx + 1] === "H" &&
    tiles?.[ty + 1]?.[tx] === "H" &&
    tiles?.[ty + 1]?.[tx + 1] === "H";

  if (!ok) return false;
  if (tiles?.[ty]?.[tx - 1] === "H") return false;
  if (tiles?.[ty - 1]?.[tx] === "H") return false;
  return true;
}

function drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE){
  const npc = npcAtTile(state, tx, ty);
  if (!npc) return;

  const kind = npcQuestIndicatorState(state, npc);
  if (!kind) return;

  const x = tx * TILE + TILE / 2;
  const bob = Math.sin(performance.now() / 250) * 3;
  const y = ty * TILE - 6 + bob;

  let fill = "#ffd400";
  switch (kind){
    case "available": fill = "#ffd400"; break;
    case "active":    fill = "#55a7ff"; break;
    case "ready":     fill = "#55ff7a"; break;
    default:          fill = "#ffd400"; break;
  }

  ctx.save();
  ctx.font = "bold 16px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = fill;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.strokeText("!", x, y);
  ctx.fillText("!", x, y);
  ctx.restore();
}

// ===============================
// FALLBACK LEGACY (para mapas sin legend completo)
// ===============================
function drawLegacy(ctx, state, c, tx, ty, TILE, tiles){
  const x = tx * TILE;
  const y = ty * TILE;

  // edificios
  if (c === "H" && isHouseTopLeft(tiles, tx, ty) && canDraw(ASSETS.house)){
    ctx.drawImage(ASSETS.house, x, y, TILE * 2, TILE * 2);
    return true;
  }
  if (c === "A" && isRectTopLeft(tiles, tx, ty, "A", 11, 7) && canDraw(ASSETS.ayuntamiento)){
    ctx.drawImage(ASSETS.ayuntamiento, x, y, TILE * 11, TILE * 7);
    return true;
  }
  if (c === "G" && isRectTopLeft(tiles, tx, ty, "G", 6, 7) && canDraw(ASSETS.gremio)){
    ctx.drawImage(ASSETS.gremio, x, y, TILE * 6, TILE * 7);
    return true;
  }
  if (c === "C" && isRectTopLeft(tiles, tx, ty, "C", 6, 6) && canDraw(ASSETS.carpinteria)){
    ctx.drawImage(ASSETS.carpinteria, x, y, TILE * 6, TILE * 6);
    return true;
  }
  if (c === "R" && isRectTopLeft(tiles, tx, ty, "R", 6, 6) && canDraw(ASSETS.herreria)){
    ctx.drawImage(ASSETS.herreria, x, y, TILE * 6, TILE * 6);
    return true;
  }
  if (c === "P" && isRectTopLeft(tiles, tx, ty, "P", 8, 6) && canDraw(ASSETS.peleteria)){
    ctx.drawImage(ASSETS.peleteria, x, y, TILE * 8, TILE * 6);
    return true;
  }
  if (c === "E" && isRectTopLeft(tiles, tx, ty, "E", 8, 6) && canDraw(ASSETS.restaurante)){
    ctx.drawImage(ASSETS.restaurante, x, y, TILE * 8, TILE * 6);
    return true;
  }
  if (c === "B" && isRectTopLeft(tiles, tx, ty, "B", 8, 6) && canDraw(ASSETS.banco)){
    ctx.drawImage(ASSETS.banco, x, y, TILE * 8, TILE * 6);
    return true;
  }
  if (c === "F" && isRectTopLeft(tiles, tx, ty, "F", 8, 6) && canDraw(ASSETS.fuente)){
    ctx.drawImage(ASSETS.fuente, x, y, TILE * 8, TILE * 6);
    return true;
  }
  if (c === "I" && isRectTopLeft(tiles, tx, ty, "I", 8, 6) && canDraw(ASSETS.tienda)){
    ctx.drawImage(ASSETS.tienda, x, y, TILE * 8, TILE * 6);
    return true;
  }
  if (c === "O" && isRectTopLeft(tiles, tx, ty, "O", 8, 6) && canDraw(ASSETS.taller)){
    ctx.drawImage(ASSETS.taller, x, y, TILE * 8, TILE * 6);
    return true;
  }

  // NPCs
  if (c === "h"){ drawNPC(ctx, ASSETS.npc_herrero, tx, ty, TILE);     drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE); return true; }
  if (c === "c"){ drawNPC(ctx, ASSETS.npc_carpintero, tx, ty, TILE);  drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE); return true; }
  if (c === "m"){ drawNPC(ctx, ASSETS.npc_maestro, tx, ty, TILE);     drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE); return true; }
  if (c === "p"){ drawNPC(ctx, ASSETS.npc_peletero, tx, ty, TILE);    drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE); return true; }
  if (c === "b"){ drawNPC(ctx, ASSETS.npc_banquero, tx, ty, TILE);    drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE); return true; }
  if (c === "k"){ drawNPC(ctx, ASSETS.npc_cocinero, tx, ty, TILE);    drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE); return true; }
  if (c === "v"){ drawNPC(ctx, ASSETS.npc_vendedor, tx, ty, TILE);    drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE); return true; }
  if (c === "o"){ drawNPC(ctx, ASSETS.npc_mago, tx, ty, TILE);        drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE); return true; }

  // mapa: salidas / pared / techo / árbol
  if (c === "<" && canDraw(ASSETS.exit_back)){ ctx.drawImage(ASSETS.exit_back, x, y, TILE, TILE); return true; }
  if (c === ">" && canDraw(ASSETS.exit_next)){ ctx.drawImage(ASSETS.exit_next, x, y, TILE, TILE); return true; }
  if (c === "T" && canDraw(ASSETS.arbol)){ ctx.drawImage(ASSETS.arbol, x, y, TILE, TILE); return true; }
  if (c === "Y" && canDraw(ASSETS.techo)){drawImageOriginalSize(ctx, ASSETS.techo, tx, ty, TILE, { anchor: "bottom", offsetY: 12 }); return true;} 
  if (c === "#" && canDraw(ASSETS.wall)){ ctx.drawImage(ASSETS.wall, x, y, TILE, TILE); return true; }
  
  return false;
}

function drawImageOriginalSize(ctx, img, tx, ty, TILE, {
  anchor = "bottom",
  centerX = true,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
} = {}){
  if (!canDraw(img)) return;

  const iw = (img.naturalWidth  || img.width  || TILE);
  const ih = (img.naturalHeight || img.height || TILE);

  const w = iw * scale;
  const h = ih * scale;

  const baseX = tx * TILE;
  const baseY = ty * TILE;

  const x = baseX + (centerX ? (TILE - w) / 2 : 0) + offsetX;
  const y = baseY + (anchor === "bottom" ? (TILE - h) : (TILE - h) / 2) + offsetY;

  ctx.drawImage(img, x, y, w, h);
}

// ===============================
// OBJETOS
// ===============================
export function drawObjects(ctx, state, c, tx, ty, TILE, tiles){
  const def = state.mapDef ?? null;
  const legend = def?.legend?.objects ?? null;
  const entry = legend ? legend[c] : null;

  const x = tx * TILE;
  const y = ty * TILE;

  // === SAVE POINT (Z) ===
  if (c === "Z"){
    const cx = x + TILE/2;
    const cy = y + TILE/2;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#1ee3ff";
    ctx.beginPath();
    ctx.ellipse(cx, cy, TILE*0.22, TILE*0.32, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy - 5, TILE*0.10, TILE*0.14, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#1ee3ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy + TILE*0.15, TILE*0.28, TILE*0.10, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // ===============================
  // NUEVO SISTEMA (por mapa)
  // ===============================
  
  // edificios / rectángulos
  if (entry){
    if (entry.w && entry.h){
      if (isRectTopLeft(tiles, tx, ty, c, entry.w, entry.h)){
        const img = ASSETS[entry.asset];
        if (canDraw(img)){
          ctx.drawImage(img, x, y, TILE * entry.w, TILE * entry.h);
        }
      }
      return;
    }

    // npc
    if (entry.kind === "npc"){
      const img = ASSETS[entry.asset];
      drawNPC(ctx, img, tx, ty, TILE);
      drawQuestIndicatorIfNeeded(ctx, state, tx, ty, TILE);
      return;
    }

    // objeto tile 1x1
    if (entry.asset){
      const img = ASSETS[entry.asset];
      if (canDraw(img)){
        if (c === "Y") {
          drawImageOriginalSize(ctx, img, tx, ty, TILE, { anchor: "bottom", offsetY: 12 });
        } else {
          ctx.drawImage(img, x, y, TILE, TILE);
        }
      }
      return;
    }

  }

  // ===============================
  // FALLBACK LEGACY (mientras migras)
  // ===============================
  if (drawLegacy(ctx, state, c, tx, ty, TILE, tiles)) return;

  // ===============================
  // DECORACIÓN SUELO (procedural)
  // ===============================
  if (def?.legend?.groundDeco === true && c === ".") {
    const seed = state.seed ?? 0;

    if (hash01(seed, tx, ty, 1) < 0.08){
      const img = pickFrom(DECO_GROUPS.yerva, seed, tx, ty, 11);
      if (canDraw(img)){ ctx.drawImage(img, x, y, TILE, TILE); return; }
    }

    if (hash01(seed, tx, ty, 2) < 0.015){
      const img = pickFrom(DECO_GROUPS.flor, seed, tx, ty, 22);
      if (canDraw(img)){ ctx.drawImage(img, x, y, TILE, TILE); return; }
    }

    if (hash01(seed, tx, ty, 3) < 0.02){
      const img = pickFrom(DECO_GROUPS.piedra, seed, tx, ty, 33);
      if (canDraw(img)){ ctx.drawImage(img, x, y, TILE, TILE); return; }
    }

    if (hash01(seed, tx, ty, 4) < 0.006){
      const img = pickFrom(DECO_GROUPS.tronco, seed, tx, ty, 44);
      if (canDraw(img)){ ctx.drawImage(img, x, y, TILE, TILE); return; }
    }
  }
}
