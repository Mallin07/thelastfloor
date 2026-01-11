// js/ui/render/dialog.js
import { wrapText, drawRoundedRect } from "./draw_common.js";

function wrapTextWithNewlines(ctx, text, maxW){
  const out = [];
  const paragraphs = String(text ?? "").split("\n");
  for (const p of paragraphs){
    if (p.trim() === "") out.push("");
    else out.push(...wrapText(ctx, p, maxW));
  }
  return out;
}

export function drawNpcDialog(ctx, state, TILE){
  const d = state.dialog;
  if (!d?.open) return;

  const npc = state.npcs?.find(n => n.id === d.npcId);
  if (!npc) return;

  const page = d.pages?.[d.pageIndex];
  if (!page) return;

  const npcX = (npc.tx + 0.5) * TILE;
  const npcY = (npc.ty + 0.5) * TILE;

  const pad = 10;
  const lineH = 14;

  const isMenu = page.type === "menu";
  const isChoice = page.type === "choice";

  const text =
    (typeof page === "string" ? page :
      page.text ?? page.message ?? page.say ?? "");

  // Opciones:
  const options =
    isMenu ? (Array.isArray(page.options) ? page.options.map(String) : []) :
    isChoice ? ["Sí", "No"] :
    [];

  // ÍNDICE: en tu juego vive en page.choice
  const selRaw = (page.choice ?? 0) | 0;
  const sel = options.length ? Math.max(0, Math.min(options.length - 1, selRaw)) : 0;

  // Iconos y colores (solo menú)
  const icons = (isMenu && Array.isArray(page.optionIcons)) ? page.optionIcons : [];
  const iconColors = (isMenu && Array.isArray(page.optionIconColors)) ? page.optionIconColors : [];

  ctx.save();
  ctx.font = "12px system-ui";

  const maxW = 260;
  const textLines = wrapTextWithNewlines(ctx, text, maxW);

  // líneas del cuadro (texto + blanco + opciones SIN icono incrustado)
  const lines = [...textLines];
  const optStartLine = lines.length + (options.length ? 1 : 0);

  if (options.length) lines.push("");
  for (let i = 0; i < options.length; i++){
    lines.push(options[i]);
  }

  // Medidas: reservamos 2 columnas
  // - cursor (▶) ~ 14px
  // - icono (!) ~ 14px
  const cursorCol = 16;
  const iconCol = 16;

  let wText = 0;
  for (const line of lines) wText = Math.max(wText, ctx.measureText(line).width);

  const w = Math.min(maxW, Math.max(180, wText)) + pad * 2 + cursorCol + iconCol;
  const h = pad * 2 + lines.length * lineH;

  const boxX = npcX - w / 2;
  const boxY = npcY - 60 - h;

  // Caja
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#111";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  drawRoundedRect(ctx, boxX, boxY, w, h, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();

  // Triángulo
  ctx.beginPath();
  ctx.moveTo(npcX - 6, boxY + h);
  ctx.lineTo(npcX + 6, boxY + h);
  ctx.lineTo(npcX, boxY + h + 10);
  ctx.closePath();
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.stroke();

  // Texto + opciones
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const textX = boxX + pad + cursorCol + iconCol;
  const iconX = boxX + pad + cursorCol; // columna iconos
  const cursorX = boxX + pad;           // columna cursor

  let ty = boxY + pad;

  for (let i = 0; i < lines.length; i++){
    const isOptLine = options.length && i >= optStartLine && i < optStartLine + options.length;
    const optIdx = isOptLine ? (i - optStartLine) : -1;

    // Resaltado opción seleccionada
    if (isOptLine && optIdx === sel){
      ctx.save();
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = "#fff";
      ctx.fillRect(boxX + pad + cursorCol, ty - 1, w - pad * 2 - cursorCol, lineH);
      ctx.restore();
    }

// Dibuja icono (solo para menú y solo en líneas de opción)
if (isMenu && isOptLine){
  const icon = icons[optIdx];
  const color = iconColors[optIdx] ?? "#ffd400";

  if (icon) {
    ctx.save();
    ctx.font = "bold 12px system-ui";
    ctx.fillStyle = color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;

    // un pelín más abajo para centrar visualmente
    ctx.strokeText(icon, iconX, ty);
    ctx.fillText(icon, iconX, ty);
    ctx.restore();
  }
}


    // texto línea
    ctx.fillStyle = "#fff";
    ctx.fillText(lines[i], textX, ty);

    ty += lineH;
  }

  // Cursor ▶
  if (options.length){
    const cursorLineIndex = optStartLine + sel;
    const cursorY = boxY + pad + cursorLineIndex * lineH;

    ctx.save();
    ctx.font = "bold 12px system-ui";
    ctx.fillStyle = "#ffd400";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeText("▶", cursorX, cursorY);
    ctx.fillText("▶", cursorX, cursorY);
    ctx.restore();
  }

  ctx.restore();
}
