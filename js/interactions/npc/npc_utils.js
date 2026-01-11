// js/interactions/npc/npc_utils.js
import { CONFIG } from "../../core/config.js";

import {
  hideSkillsPanel
} from "../../ui/menu/menu_skills_panel.js";

function dist2(ax, ay, bx, by){
  const dx = ax - bx, dy = ay - by;
  return dx*dx + dy*dy;
}

export function nearestNpc(state, rangePx = CONFIG.TILE * 1.2){
  const p = state.player;
  const r2 = rangePx * rangePx;
  let best = null, bestD2 = Infinity;

  for (const n of (state.npcs || [])){
    const nx = (n.tx + 0.5) * CONFIG.TILE;
    const ny = (n.ty + 0.5) * CONFIG.TILE;
    const d2 = dist2(p.px, p.py, nx, ny);
    if (d2 <= r2 && d2 < bestD2){
      bestD2 = d2;
      best = n;
    }
  }
  return best;
}

export function openDialog(state, npc, pages){
  state.dialog = { open: true, npcId: npc.id, pages, pageIndex: 0 };
}

export function closeDialog(state){
  state.dialog = { open:false, npcId:null, pages:[], pageIndex:0 };
  hideSkillsPanel(); // ✅ cierra panel gráfico de habilidades
}
