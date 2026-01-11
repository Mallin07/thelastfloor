// js/interactions/npc/npc_actions.js
import { CONFIG } from "../../core/config.js";
import { QUESTS } from "../../data/quests_db.js";
import { openBank } from "../../ui/menu/menu_index.js";
import { listSaves, saveToSlot, loadFromSlot, deleteSlot } from "../../core/save_system.js";
import { openCraft } from "../../ui/menu/menu_craft.js";
import { openTrade } from "../../ui/menu/menu_trade.js";
import { SKILLS } from "../../data/skills_db.js";
import { learnSkill } from "../../entities/skills.js";
import { resetKeys } from "../../input/input.js";

import {
  renderSkillsTreePanel
} from "../../ui/menu/menu_skills_panel.js";

// ✅ action bar helpers (punto 6)
import {
  assignSkillToActionSlot,
  autoAssignLearnedSkill
} from "../../systems/actionbar_system.js";

import {
  acceptQuest,
  hasQuest,
  isCompleted,
  questStatusText,
  tryCompleteQuest,
  questRequirementsStatus
} from "../../entities/quests.js";

import { nearestNpc, openDialog, closeDialog } from "./npc_utils.js";
import { buildNpcMenuPages, NPC_PRIMARY_ACTION, NPC_ACTION_TEXT } from "./npc_menu.js";
import {
  offeredQuestsForNpc,
  rewardsText,
  isQuestReady
} from "./npc_quests.js";
import {
  buildSavePointMainMenu,
  buildSaveSlotsMenu,
  buildDeleteSlotsMenu,
  buildConfirmDeleteMenu,
  buildConfirmOverwriteMenu
} from "./npc_savepoint.js";
import {
  buildSkillsBranchMenu,
  buildSkillsTreeMenu,
  buildSkillInfoPages,
  buildAssignSkillSlotMenu,
  humanLearnFail
} from "./npc_skills.js";

// ---------- TALK ----------
export function talkToNearestNpc(state){
  if (state.dialog?.open) return true; // ya hay diálogo, se considera "handled"

  const npc = nearestNpc(state);
  if (!npc) return false;

  // ✅ NPC con acción primaria -> menú
  if (NPC_PRIMARY_ACTION[npc.id]){
    openDialog(state, npc, buildNpcMenuPages(state, npc));
    return true;
  }

  // ======= resto de NPCs: comportamiento clásico =======
  const pages = [];
  if (npc.dialog?.length){
    pages.push({ type:"text", text: npc.dialog[0] });
  }

  const offered = offeredQuestsForNpc(npc.id);

  // si tiene quest activa con ese NPC
  for (const q of offered){
    if (isCompleted(state, q.id)) continue;
    if (hasQuest(state, q.id)){
      pages.push({ type:"text", text: questStatusText(state, q.id) });

      // si está lista, permitir entregar (kill o deliver)
      if (isQuestReady(state, q)){
        pages.push({
          type:"complete",
          questId: q.id,
          text: ((q.text?.complete ?? "Acepta esta recompensa") + ":") + rewardsText(q)
        });
      }

      openDialog(state, npc, pages);
      return true;
    }
  }

  // si no tiene activa, ofrecer alguna disponible
  for (const q of offered){
    if (isCompleted(state, q.id)) continue;
    if (hasQuest(state, q.id)) continue;

    const req = questRequirementsStatus(state, q);
    if (!req.ok){
      if (req.reason === "level"){
        pages.push({ type:"text", text: q.text.lockedLevel?.(req.value) ?? `Necesitas nivel ${req.value}.` });
      } else if (req.reason === "quest"){
        pages.push({ type:"text", text: q.text.lockedQuest?.(req.value) ?? `Primero completa ${req.value}.` });
      }
      continue;
    }

    const offer = q.text?.offer ?? "…";

    if (Array.isArray(offer)){
      for (const line of offer){
        pages.push({ type: "text", text: line });
      }
    } else {
      pages.push({ type: "text", text: offer });
    }

    pages.push({
      type: "choice",
      text: "¿Aceptas la misión?",
      questId: q.id,
      choice: 0
    });

    openDialog(state, npc, pages);
    return true;
  }

  openDialog(state, npc, pages.length ? pages : [{ type:"text", text:"..." }]);
  return true;
}

// ---------- CONTROLES ----------
export function dialogUp(state){
  const d = state.dialog;
  const p = d?.pages?.[d.pageIndex];
  if (!p) return;

  if (p.type === "choice"){
    p.choice = 0;
    return;
  }

  if (p.type === "menu"){
    const n = (p.options?.length ?? 0);
    if (!n) return;
    p.choice = (p.choice - 1 + n) % n;
  }
}

export function dialogDown(state){
  const d = state.dialog;
  const p = d?.pages?.[d.pageIndex];
  if (!p) return;

  if (p.type === "choice"){
    p.choice = 1;
    return;
  }

  if (p.type === "menu"){
    const n = (p.options?.length ?? 0);
    if (!n) return;
    p.choice = (p.choice + 1) % n;
  }
}

export function advanceDialog(state){
  const d = state.dialog;
  if (!d?.open) return;

  const page = d.pages[d.pageIndex];
  if (!page){ closeDialog(state); return; }

  // ✅ confirmar menú
  if (page.type === "menu"){
    const idx = page.choice ?? 0;
    const action = page.actions?.[idx];

    const npc = state.npcs?.find(n => n.id === d.npcId);
    if (!npc){ closeDialog(state); return; }

    if (!action || action.kind === "exit"){
      closeDialog(state);
      return;
    }

    // === SAVEPOINT ===
    if (action.kind === "savepoint"){
      const pages = buildSavePointMainMenu(npc);
      openDialog(state, npc, pages);
      return;
    }

    if (action.kind === "openSaveSlots"){
      openDialog(state, npc, buildSaveSlotsMenu(npc, "save"));
      return;
    }

    if (action.kind === "openLoadSlots"){
      openDialog(state, npc, buildSaveSlotsMenu(npc, "load"));
      return;
    }

    if (action.kind === "doSave"){
      const saves = listSaves();
      const exists = !!saves?.[action.slot]?.data;

      if (exists){
        openDialog(state, npc, buildConfirmOverwriteMenu(npc, action.slot));
        return;
      }

      const ok = saveToSlot(state, action.slot);
      openDialog(state, npc, [{ type:"text", text: ok ? "Partida guardada." : "No se pudo guardar." }]);
      return;
    }

    if (action.kind === "doSaveConfirmed"){
      const ok = saveToSlot(state, action.slot);
      openDialog(state, npc, [{ type:"text", text: ok ? "Partida guardada." : "No se pudo guardar." }]);
      return;
    }


    if (action.kind === "doLoad"){
      const ok = loadFromSlot(state, action.slot);
      if (ok){
        resetKeys();
        closeDialog(state);
      } else {
        openDialog(state, npc, [{ type:"text", text: "Ese slot está vacío." }]);
      }
      return;
    }

    if (action.kind === "backToSaveMain"){
      openDialog(state, npc, buildSavePointMainMenu(npc));
      return;
    }

    if (action.kind === "openDeleteSlots"){
      openDialog(state, npc, buildDeleteSlotsMenu(npc));
      return;
    }

    if (action.kind === "confirmDelete"){
      openDialog(state, npc, buildConfirmDeleteMenu(action.slot));
      return;
    }

    if (action.kind === "doDelete"){
      deleteSlot(action.slot);
      openDialog(state, npc, [
        { type:"text", text:"La partida ha sido borrada." },
        ...buildDeleteSlotsMenu(npc)
      ]);
      return;
    }

    if (action.kind === "slotEmpty"){
      openDialog(state, npc, [
        { type:"text", text:"Ese slot está vacío." }
      ]);
      return;
    }

    // ✅ Banco: abre UI real (no placeholder)
    if (action.kind === "bank"){
      closeDialog(state);
      openBank(state);
      return;
    }

    // crafting //
    if (action.kind === "cook"){
      closeDialog(state);
      openCraft(state, "cook");
      return;
    }

    if (action.kind === "forge") {
      closeDialog(state);
      openCraft(state, "forge");
      return;
    }

    if (action.kind === "craft_wood") {
      closeDialog(state);
      openCraft(state, "carpenter");
      return;
    }

    if (action.kind === "leatherwork") {
      closeDialog(state);
      openCraft(state, "leather");
      return;
    }

    if (action.kind === "enchant") {
      closeDialog(state);
      openCraft(state, "mage");
      return;
    }

    if (action.kind === "trade"){
      closeDialog(state);
      openTrade(state);
      return;
    }

    // === SKILLS (MAESTRO) ===
    if (action.kind === "learn"){
      openDialog(state, npc, buildSkillsBranchMenu(state));
      return;
    }

    if (action.kind === "openSkillBranches"){
      openDialog(state, npc, buildSkillsBranchMenu(state));
      return;
    }

    if (action.kind === "openSkillBranch"){
      renderSkillsTreePanel(state, action.branch);
      openDialog(state, npc, buildSkillsTreeMenu(state, action.branch));
      return;
    }

    if (action.kind === "skillInfo"){
      openDialog(state, npc, buildSkillInfoPages(state, action.skillId, action.branch));
      return;
    }

    // ✅ NUEVO: abrir menú de asignación a barra
    if (action.kind === "openBindSkillSlots"){
      openDialog(state, npc, buildAssignSkillSlotMenu(state, action.skillId, action.branch));
      return;
    }

    // ✅ NUEVO: asignar skill al slot elegido
    if (action.kind === "doBindSkillToSlot"){
      const r = assignSkillToActionSlot(state.player, action.skillId, action.slot);

      if (r.ok){
        openDialog(state, npc, [
          { type:"text", text:`✅ Asignada a Slot ${action.slot}.` },
          ...buildSkillInfoPages(state, action.skillId, action.branch)
        ]);
      } else {
        const msg =
          (r.reason === "reserved") ? "Ese slot está reservado." :
          (r.reason === "invalid_slot") ? "Ese slot no es válido." :
          "No se pudo asignar a ese slot.";

        openDialog(state, npc, [
          { type:"text", text:`🔒 ${msg}` },
          ...buildSkillInfoPages(state, action.skillId, action.branch)
        ]);
      }
      return;
    }

    if (action.kind === "doLearnSkill"){
      const res = learnSkill(state, action.skillId);

      // ✅ refrescar panel izquierdo (árbol gráfico)
      renderSkillsTreePanel(state, action.branch);

      if (res.ok){
        // ✅ Auto-asignar solo si es la primera vez (rango 1)
        let autoTxt = "";
        if (res.newRank === 1){
          const a = autoAssignLearnedSkill(state.player, action.skillId);
          if (a.ok) autoTxt = `
(Asignada automáticamente al slot ${a.slot})`;
        }

        openDialog(state, npc, [
          {
            type:"text",
            text:`✅ Aprendiste/mejoraste ${SKILLS[action.skillId]?.name ?? action.skillId} (rango ${res.newRank}).${autoTxt}`
          },
          ...buildSkillsTreeMenu(state, action.branch)
        ]);
      } else {
        openDialog(state, npc, [
          {
            type:"text",
            text:`🔒 ${humanLearnFail(res.reason, res.info)}`
          },
          ...buildSkillsTreeMenu(state, action.branch)
        ]);
      }
      return;
    }


    // Placeholders (resto)
    const txt = NPC_ACTION_TEXT?.[action.kind];
    if (txt){
      openDialog(state, npc, [{ type:"text", text: txt }]);
      return;
    }

    // Quest activa seleccionada
    if (action.kind === "activeQuest"){
      const q = QUESTS[action.questId];
      if (!q){ closeDialog(state); return; }

      const stText = questStatusText(state, q.id) || "No hay progreso.";
      const pages = [{ type:"text", text: stText }];

      if (isQuestReady(state, q)){
        pages.push({
          type:"complete",
          questId: q.id,
          text: ((q.text?.complete ?? "Acepta esta recompensa") + ":") + rewardsText(q)
        });
      }

      openDialog(state, npc, pages);
      return;
    }

    // Quest disponible seleccionada
    if (action.kind === "offerQuest"){
      const q = QUESTS[action.questId];
      if (!q){ closeDialog(state); return; }

      const offer = q.text?.offer ?? "…";
      const pages = [];

      if (Array.isArray(offer)){
        for (const line of offer){
          pages.push({ type: "text", text: line });
        }
      } else {
        pages.push({ type: "text", text: String(offer) });
      }

      pages.push({
        type:"choice",
        text:"¿Aceptas la misión?",
        questId: q.id,
        choice: 0
      });

      openDialog(state, npc, pages);
      return;
    }

    closeDialog(state);
    return;
  }

  // choice sí/no
  if (page.type === "choice"){
    const yes = (page.choice === 0);
    if (yes) acceptQuest(state, page.questId);
    closeDialog(state);
    return;
  }

  // completar quest
  if (page.type === "complete"){
    tryCompleteQuest(state, page.questId);
    closeDialog(state);
    return;
  }

  // texto normal
  d.pageIndex++;
  if (d.pageIndex >= d.pages.length){
    closeDialog(state);
  }
}
