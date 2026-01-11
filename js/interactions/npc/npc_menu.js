// js/interactions/npc/npc_menu.js
import {
  findActiveQuestFromNpc,
  findAvailableQuestsFromNpc,
  isQuestReady
} from "./npc_quests.js";

// Acción principal por NPC (quién tendrá menú "avanzado")
export const NPC_PRIMARY_ACTION = {
  maestro:     { label: "Aprender habilidad", kind: "learn" },
  cocinero:    { label: "Cocinar",            kind: "cook" },
  banquero:    { label: "Almacenar / Retirar",kind: "bank" },
  carpintero:  { label: "Fabricar objeto",    kind: "craft_wood" },
  herrero:     { label: "Forjar",             kind: "forge" },
  mago:        { label: "Crear arma",         kind: "enchant" },
  peletero:    { label: "Tejer",              kind: "leatherwork" },
  vendedor:    { label: "Vender objetos",     kind: "trade" },
  savepoint:   { label: "Usar cristal",       kind: "savepoint" }
};

// Placeholders (para acciones que aún no tienen implementación)
export const NPC_ACTION_TEXT = {};

// ---------- Menú genérico para NPC con acción primaria ----------
export function buildNpcMenuPages(state, npc){
  const pages = [];

  // saludo base
  if (npc.dialog?.length){
    pages.push({ type:"text", text: npc.dialog[0] });
  }

  const options = [];
  const actions = [];
  const optionIcons = [];
  const optionIconColors = [];

  function pushOpt(label, action, icon = "", color = ""){
    options.push(label);
    actions.push(action);
    optionIcons.push(icon);
    optionIconColors.push(color);
  }

  // acción principal (según npc)
  const primary = NPC_PRIMARY_ACTION[npc.id];
  if (primary){
    pushOpt(primary.label, { kind: primary.kind });
  }

  // misión activa (si hay)
  const active = findActiveQuestFromNpc(state, npc.id);
  if (active){
    const ready = isQuestReady(state, active);

    if (ready){
      pushOpt(active.title, { kind:"activeQuest", questId: active.id }, "!", "#22c55e"); // verde
    } else {
      pushOpt(active.title, { kind:"activeQuest", questId: active.id }, "!", "#3b82f6"); // azul
    }
  }

  // misiones disponibles (hasta 2)
  const avail = findAvailableQuestsFromNpc(state, npc.id, 2);
  for (const q of avail){
    pushOpt(q.title, { kind:"offerQuest", questId: q.id }, "!", "#facc15"); // amarillo
  }

  // exit
  pushOpt("EXIT", { kind:"exit" });

  pages.push({
    type: "menu",
    text: "¿Qué necesitas?",
    options,
    actions,
    optionIcons,
    optionIconColors,
    choice: 0
  });

  return pages;
}
