// js/interactions/npc/npc_savepoint.js
import { listSaves } from "../../core/save_system.js";

function fmtSaveMeta(meta){
  if (!meta) return "Vacío";
  const d = new Date(meta.savedAt);
  const when = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`;
  return `Nv ${meta.lvl} · ${meta.mapId} · ${when}`;
}

export function buildSavePointMainMenu(npc){
  const options = ["Guardar partida", "Cargar partida", "Borrar partida", "EXIT"];
  const actions = [
    { kind:"openSaveSlots" },
    { kind:"openLoadSlots" },
    { kind:"openDeleteSlots" },
    { kind:"exit" }
  ];
  return [
    { type:"text", text: npc.dialog?.[0] ?? "..." },
    { type:"menu", text:"¿Qué quieres hacer?", options, actions, choice:0 }
  ];
}

export function buildSaveSlotsMenu(npc, mode /* "save" | "load" */){
  const saves = listSaves();
  const options = [];
  const actions = [];

  for (let i = 0; i < saves.length; i++){
    const meta = saves[i]?.meta ?? null;
    const label = `Slot ${i+1}: ${fmtSaveMeta(meta)}`;
    options.push(label);
    actions.push({ kind: mode === "save" ? "doSave" : "doLoad", slot: i });
  }

  options.push("Volver");
  actions.push({ kind:"backToSaveMain" });

  return [
    { type:"menu", text: (mode === "save" ? "Guardar en..." : "Cargar desde..."), options, actions, choice:0 }
  ];
}

export function buildDeleteSlotsMenu(npc){
  const saves = listSaves();
  const options = [];
  const actions = [];

  for (let i = 0; i < saves.length; i++){
    const meta = saves[i]?.meta ?? null;
    const label = `Slot ${i+1}: ${fmtSaveMeta(meta)}`;
    options.push(label);

    // Si está vacío, informamos (y no borramos)
    if (!saves[i]){
      actions.push({ kind:"slotEmpty" });
    } else {
      actions.push({ kind:"confirmDelete", slot: i });
    }
  }

  options.push("Volver");
  actions.push({ kind:"backToSaveMain" });

  return [
    { type:"menu", text:"¿Borrar qué partida?", options, actions, choice:0 }
  ];
}

export function buildConfirmDeleteMenu(slotIndex){
  return [
    {
      type:"menu",
      text:`¿Seguro que quieres borrar el Slot ${slotIndex + 1}?`,
      options:["Sí", "No"],
      actions:[
        { kind:"doDelete", slot: slotIndex },
        { kind:"openDeleteSlots" }
      ],
      choice:1
    }
  ];
}

export function buildConfirmOverwriteMenu(npc, slotIndex){
  const saves = listSaves();
  const meta = saves?.[slotIndex]?.meta ?? null;

  const info = meta ? fmtSaveMeta(meta) : "Vacío";

  return [
    {
      type: "menu",
      text:
        `Ese Slot ${slotIndex + 1} ya tiene una partida:
` +
        `${info}

¿Quieres sobrescribirla?`,
      options: ["Sí", "No"],
      actions: [
        { kind: "doSaveConfirmed", slot: slotIndex },
        { kind: "openSaveSlots" } // o { kind:"backToSaveMain" } si prefieres
      ],
      choice: 1
    }
  ];
}
