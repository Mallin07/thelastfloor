// js/interactions/npc/npc_skills.js
import { SKILL_BRANCH, SKILLS } from "../../data/skills_db.js";
import { getSkillStatus } from "../../entities/skills.js";
import { SKILL_TREE_LAYOUT } from "../../data/skill_tree_layout.js";

// ✅ action bar helpers (punto 6)
import {
  ACTIONBAR_FREE_SLOTS,
  ensureActionBar
} from "../../systems/actionbar_system.js";

function fmtSkillLockReason(st){
  if (st.status !== "locked") return "";
  switch (st.reason){
    case "low_level":
      return ` (nivel ${st.info?.needLevel ?? "?"})`;
    case "missing_quest":
      return ` (mision: ${st.info?.needQuest ?? "?"})`;
    case "missing_prereq":
      return ` (requiere previa)`;
    case "no_points":
      return ` (sin puntos)`;
    default:
      return ` (bloqueado)`;
  }
}

export function humanLearnFail(reason, info){
  switch (reason){
    case "low_level":
      return `Necesitas nivel ${info?.needLevel ?? "?"}.`;
    case "missing_quest":
      return `Necesitas completar la misión: ${info?.needQuest ?? "?"}.`;
    case "missing_prereq":
      return `Necesitas habilidades previas.`;
    case "no_points":
      return `No tienes puntos de habilidad suficientes.`;
    case "max_rank":
      return `Esta habilidad ya está al máximo.`;
    default:
      return `No puedes aprender esta habilidad ahora.`;
  }
}

function nodeIconLearned(rank, maxRank){
  if (rank >= maxRank) return "⊗";
  if (rank > 0) return "●";
  return "○";
}

function renderAsciiTree(state, branchId){
  const layout = SKILL_TREE_LAYOUT?.[branchId];
  if (!layout) return "Sin árbol definido.";

  // grid simple: 13x9 aprox
  const W = 25, H = 9;
  const grid = Array.from({ length: H }, () => Array.from({ length: W }, () => " "));

  // center
  const ox = Math.floor(W / 2);
  const oy = 1;

  // dibuja conexiones simples (| y -) entre nodos (sin curvas)
  const posById = new Map();
  for (const n of layout.nodes){
    posById.set(n.id, { gx: ox + n.x * 6, gy: oy + n.y });
  }

  for (const [a, b] of layout.edges || []){
    const pa = posById.get(a);
    const pb = posById.get(b);
    if (!pa || !pb) continue;

    // vertical
    const x = pa.gx;
    const y1 = Math.min(pa.gy, pb.gy);
    const y2 = Math.max(pa.gy, pb.gy);
    for (let y = y1 + 1; y < y2; y++){
      if (grid[y] && grid[y][x] === " ") grid[y][x] = "│";
    }

    // horizontal (si hay offset X)
    const y = pb.gy;
    const x1 = Math.min(pa.gx, pb.gx);
    const x2 = Math.max(pa.gx, pb.gx);
    for (let xx = x1 + 1; xx < x2; xx++){
      if (grid[y] && grid[y][xx] === " ") grid[y][xx] = "─";
    }
  }

  // dibuja nodos encima
  for (const n of layout.nodes){
    const p = posById.get(n.id);
    if (!p) continue;

    const st = getSkillStatus(state, n.id);
    const s = SKILLS[n.id];
    const rank = st.rank ?? 0;
    const maxRank = st.maxRank ?? (s?.maxRank ?? 1);

    const icon = nodeIconLearned(rank, maxRank);
    if (grid[p.gy] && grid[p.gy][p.gx]) grid[p.gy][p.gx] = icon;
  }

  return grid.map(row => row.join("")).join("\n");
}

export function buildSkillsTreeMenu(state, branchId){
  const sp = state.player?.skillPoints ?? 0;
  const branchName = SKILL_BRANCH?.[branchId]?.name ?? branchId;

  const tree = renderAsciiTree(state, branchId);

  const branchSkills = Object.values(SKILLS).filter(s => s.branch === branchId);
  branchSkills.sort((a, b) => (a.requires?.prereq?.length ?? 0) - (b.requires?.prereq?.length ?? 0));

  const options = [];
  const actions = [];

  for (const s of branchSkills){
    const st = getSkillStatus(state, s.id);
    const rank = st.rank ?? 0;
    const maxRank = st.maxRank ?? (s.maxRank ?? 1);

    if (st.status === "available"){
      const cost = st.nextCost ?? 1;
      options.push(`○ ${s.name} [${rank}/${maxRank}] (coste ${cost})`);
      actions.push({ kind: "doLearnSkill", skillId: s.id, branch: branchId });
    } else if (st.status === "maxed"){
      options.push(`⊗ ${s.name} [${rank}/${maxRank}] (MAX)`);
      actions.push({ kind: "skillInfo", skillId: s.id, branch: branchId });
    } else {
      options.push(`· ${s.name} [${rank}/${maxRank}]${fmtSkillLockReason(st)}`);
      actions.push({ kind: "skillInfo", skillId: s.id, branch: branchId });
    }
  }

  options.push("Volver");
  actions.push({ kind: "openSkillBranches" });

  return [

    { type: "menu", text: "Selecciona una habilidad:", options, actions, choice: 0 }
  ];
}

export function buildSkillsBranchMenu(state){
  const sp = state.player?.skillPoints ?? 0;

  const options = [
    `Guerrero - Espada`,
    `Arquero  - Arco`,
    `Mago     - Varita`,
    `Defensa  - Escudo`,
    `Volver`
  ];

  const actions = [
    { kind: "openSkillBranch", branch: "warrior" },
    { kind: "openSkillBranch", branch: "archer" },
    { kind: "openSkillBranch", branch: "mage" },
    { kind: "openSkillBranch", branch: "defense" },
    { kind: "exit" }
  ];

  return [
    { type: "text", text: `Tienes ${sp} punto(s) de habilidad.` },
    { type: "menu", text: "Elige una disciplina:", options, actions, choice: 0 }
  ];
}

function skillIdsForBranch(branchId){
  return Object.values(SKILLS)
    .filter(s => s.branch === branchId)
    .map(s => s.id);
}

function buildSkillsListMenu(state, branchId){
  const sp = state.player?.skillPoints ?? 0;

  const branchName = SKILL_BRANCH?.[branchId]?.name ?? branchId;

  const branchSkills = Object.values(SKILLS).filter(s => s.branch === branchId);

  // orden estable: primero las bases (sin prereq), luego las que tengan prereq
  branchSkills.sort((a, b) => {
    const ap = (a.requires?.prereq?.length ?? 0);
    const bp = (b.requires?.prereq?.length ?? 0);
    if (ap !== bp) return ap - bp;
    return String(a.name).localeCompare(String(b.name));
  });

  const options = [];
  const actions = [];

  for (const s of branchSkills){
    const st = getSkillStatus(state, s.id);
    const rank = st.rank ?? 0;
    const maxRank = st.maxRank ?? (s.maxRank ?? 1);

    if (st.status === "available"){
      const cost = st.nextCost ?? 1;
      options.push(`${s.name}  [${rank}/${maxRank}]  (coste ${cost})`);
      actions.push({ kind: "doLearnSkill", skillId: s.id, branch: branchId });
    } else if (st.status === "maxed"){
      options.push(`${s.name}  [${rank}/${maxRank}]  (MAX)`);
      actions.push({ kind: "skillInfo", skillId: s.id, branch: branchId });
    } else {
      options.push(`${s.name}  [${rank}/${maxRank}]${fmtSkillLockReason(st)}`);
      actions.push({ kind: "skillInfo", skillId: s.id, branch: branchId });
    }
  }

  options.push("Volver");
  actions.push({ kind: "openSkillBranches" });

  return [
    { type: "text", text: `${branchName} — Puntos: ${sp}` },
    { type: "menu", text: "Selecciona una habilidad:", options, actions, choice: 0 }
  ];
}

// =====================
// ✅ Punto 6: asignación a barra desde el Maestro
// =====================
function labelForSlotEntry(entry){
  if (!entry) return "Vacío";
  if (entry.type === "basic_attack") return "Básico";
  if (entry.type === "consumable") return `Cocina (${entry.id ?? "?"})`;
  if (entry.type === "skill") return `Skill (${SKILLS?.[entry.id]?.name ?? entry.id})`;
  return String(entry.type ?? "???");
}

export function buildAssignSkillSlotMenu(state, skillId, branchId){
  const p = state.player;
  ensureActionBar(p);

  const sName = SKILLS?.[skillId]?.name ?? skillId;

  const options = [];
  const actions = [];

  for (const slot of ACTIONBAR_FREE_SLOTS){
    const entry = p.actionBar?.[slot] ?? null;
    options.push(`Slot ${slot}: ${labelForSlotEntry(entry)}`);
    actions.push({ kind:"doBindSkillToSlot", skillId, branch: branchId, slot });
  }

  options.push("Cancelar");
  actions.push({ kind:"skillInfo", skillId, branch: branchId });

  return [
    { type:"text", text: `Asignar: ${sName}
Elige un slot:` },
    { type:"menu", text:"¿Dónde la pones?", options, actions, choice: 0 }
  ];
}

export function buildSkillInfoPages(state, skillId, branchId){
  const s = SKILLS?.[skillId];
  if (!s){
    return [{ type:"text", text:"Habilidad desconocida." }, ...buildSkillsListMenu(state, branchId)];
  }

  const st = getSkillStatus(state, skillId);
  const rank = st.rank ?? 0;
  const maxRank = st.maxRank ?? (s.maxRank ?? 1);

  const lines = [];
  lines.push(`${s.name} [${rank}/${maxRank}]`);
  if (s.desc) lines.push(`
${s.desc}`);

  if (st.status === "available"){
    lines.push(`
✅ Disponible — coste: ${st.nextCost ?? 1} punto(s).`);
  } else if (st.status === "maxed"){
    lines.push(`
✅ Al máximo.`);
  } else if (st.status === "locked"){
    lines.push(`
🔒 Bloqueada.`);
    if (st.reason === "low_level") lines.push(`Necesitas nivel ${st.info?.needLevel ?? "?"}.`);
    if (st.reason === "missing_quest") lines.push(`Necesitas completar: ${st.info?.needQuest ?? "?"}.`);
    if (st.reason === "missing_prereq") lines.push(`Necesitas habilidades previas.`);
    if (st.reason === "no_points") lines.push(`No tienes puntos suficientes.`);
  }

  // ✅ Menú de opciones de la skill (incluye asignación si rank>0)
  const options = [];
  const actions = [];

  if (rank > 0){
    options.push("Asignar a barra…");
    actions.push({ kind:"openBindSkillSlots", skillId, branch: branchId });
  }

  options.push("Volver");
  actions.push({ kind:"openSkillBranch", branch: branchId });

  return [
    { type:"text", text: lines.join("\n") },
    { type:"menu", text:"Opciones:", options, actions, choice: 0 }
  ];
}
