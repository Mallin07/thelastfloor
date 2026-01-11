//dialog.js
import { acceptQuest, tryCompleteQuest } from "../entities/quests.js";

export function dialogLeft(state){
  const d = state.dialog;
  const p = d.pages[d.pageIndex];
  if (!p || p.type !== "choice") return;
  p.choice = 0; // Sí
}

export function dialogRight(state){
  const d = state.dialog;
  const p = d.pages[d.pageIndex];
  if (!p || p.type !== "choice") return;
  p.choice = 1; // No
}

export function advanceDialog(state){
  const d = state.dialog;
  const p = d.pages[d.pageIndex];
  if (!p) { closeDialog(state); return; }

  // Choice: confirmar
  if (p.type === "choice"){
    const yes = (p.choice === 0);
    if (yes){
      acceptQuest(state, p.questId);
    }
    closeDialog(state);
    return;
  }

  // Complete: completar quest al confirmar
  if (p.type === "complete"){
    tryCompleteQuest(state, p.questId);
    closeDialog(state);
    return;
  }

  // Texto normal: siguiente página o cerrar
  d.pageIndex++;
  if (d.pageIndex >= d.pages.length){
    closeDialog(state);
  }
}

export function closeDialog(state){
  state.dialog = { open:false, npcId:null, pages:[], pageIndex:0 };
}
