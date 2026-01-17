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

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

export function drawNpcDialog(ctx, state, TILE){
  const d = state.dialog;
  if (!d?.open) return;

  const npc = state.npcs?.find(n => n.id === d.npcId);
  if (!npc) return;

  const page = d.pages?.[d.pageIndex];
  if (!page) return;

  // --- NPC en WORLD ---
  const npcX = (npc.tx + 0.5) * TILE;
  const npcY = (npc.ty + 0.5) * TILE;

  const pad = 16; //medidas panel
  const lineH = 26; //medidas separación letra

  const isMenu = page.type === "menu";
  const isChoice = page.type === "choice";

  const text =
    (typeof page === "string" ? page :
      page.text ?? page.message ?? page.say ?? "");

  const options =
    isMenu ? (Array.isArray(page.options) ? page.options.map(String) : []) :
    isChoice ? ["Sí", "No"] :
    [];

  const selRaw = (page.choice ?? 0) | 0;
  const sel = options.length ? Math.max(0, Math.min(options.length - 1, selRaw)) : 0;

  const icons = (isMenu && Array.isArray(page.optionIcons)) ? page.optionIcons : [];
  const iconColors = (isMenu && Array.isArray(page.optionIconColors)) ? page.optionIconColors : [];

  // =========================================================
  // 1) WORLD -> SCREEN usando el transform actual
  // =========================================================
  const T = ctx.getTransform(); // incluye zoom + cámara (setTransform de render)
  const npcSX = npcX * T.a + npcY * T.c + T.e;
  const npcSY = npcX * T.b + npcY * T.d + T.f;

  // =========================================================
  // 2) Medir layout en SCREEN (sin zoom)
  // =========================================================
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // UI en pantalla
  ctx.font = "bold 25px system-ui";// medida letra

  const maxW = Math.min(460, ctx.canvas.width - 40); //medidas
  const textLines = wrapTextWithNewlines(ctx, text, maxW);

  const lines = [...textLines];
  const optStartLine = lines.length + (options.length ? 1 : 0);

  if (options.length) lines.push("");
  for (let i = 0; i < options.length; i++) lines.push(options[i]);

  const cursorCol = 25; //mediadas panel
  const iconCol = 25; //medidas panel

  let wText = 0;
  for (const line of lines) wText = Math.max(wText, ctx.measureText(line).width);

  const w = Math.min(maxW, Math.max(180, wText)) + pad * 2 + cursorCol + iconCol;
  const h = pad * 2 + lines.length * lineH;

  // =========================================================
  // 3) Posicionar en pantalla y CLAMP a viewport
  // =========================================================
  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;
  const margin = 8;

  let boxX = npcSX - w / 2;
  let boxY = npcSY - 60 - h;

  // clamp para que la caja no se salga
  boxX = clamp(boxX, margin, canvasW - w - margin);
  boxY = clamp(boxY, margin, canvasH - h - margin);

  // =========================================================
  // 4) Dibujar caja + triángulo (apuntando al NPC en pantalla)
  // =========================================================
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#111";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  drawRoundedRect(ctx, boxX, boxY, w, h, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();

  // Triángulo: clamp para que no salga de la caja si el NPC está fuera
  const triBaseY = boxY + h;
  const tipX = clamp(npcSX, boxX + 14, boxX + w - 14);
  const tipY = Math.min(canvasH - margin, triBaseY + 10);

  ctx.beginPath();
  ctx.moveTo(tipX - 6, triBaseY);
  ctx.lineTo(tipX + 6, triBaseY);
  ctx.lineTo(tipX, tipY);
  ctx.closePath();
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.stroke();

  // Texto + opciones
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const hasOptions = options.length > 0;

  const textX = hasOptions
  ? boxX + pad + cursorCol + iconCol
  : boxX + pad;

  const iconX = boxX + pad + cursorCol + 8;
  const cursorX = boxX + pad;

  let ty = boxY + pad;


  for (let i = 0; i < lines.length; i++){
    const isOptLine = options.length && i >= optStartLine && i < optStartLine + options.length;
    const optIdx = isOptLine ? (i - optStartLine) : -1;
  
    if (isOptLine && optIdx === sel){
      ctx.save();
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = "#fff";
      ctx.fillRect(boxX + pad + cursorCol, ty - 1, w - pad * 2 - cursorCol, lineH);
      ctx.restore();
    }
  
    if (isMenu && isOptLine){
      const icon = icons[optIdx];
      const color = iconColors[optIdx] ?? "#ffd400";
      if (icon){
        ctx.save();
    
        // ✅ que el icono tenga el MISMO tamaño visual que el texto del menú
        ctx.font = "bold 25px system-ui";
    
        // ✅ centra verticalmente el icono dentro de la línea
        const m = ctx.measureText(icon);
        const iconH = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) || 25;
        const iy = ty + (lineH - iconH) / 2;
    
        ctx.fillStyle = color;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
    
        ctx.strokeText(icon, iconX, iy);
        ctx.fillText(icon, iconX, iy);
    
        ctx.restore();
      }
    }

  
    ctx.fillStyle = "#fff";
  
    if (!hasOptions) {
      // ✅ diálogo simple: centrar texto
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillText(lines[i], boxX + w / 2, ty);
      ctx.restore();
    } else {
      // ✅ menú normal
      ctx.fillText(lines[i], textX, ty);
    }
  
    ty += lineH;
  }


  if (options.length){
    const cursorLineIndex = optStartLine + sel;
    const cursorY = boxY + pad + cursorLineIndex * lineH;

    ctx.save();
    ctx.font = "bold 25px system-ui"; // medidas cursor
    ctx.fillStyle = "#ffd400";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeText("▶", cursorX, cursorY);
    ctx.fillText("▶", cursorX, cursorY);
    ctx.restore();
  }

  ctx.restore();
}
