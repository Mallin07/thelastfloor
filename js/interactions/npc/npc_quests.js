// js/interactions/npc/npc_quests.js
import { QUESTS } from "../../data/quests_db.js";

import {
  hasQuest,
  isCompleted,
  questRequirementsStatus
} from "../../entities/quests.js";

// Texto de recompensas (formato final deseado)
export function rewardsText(q){
  const gold = q?.rewards?.gold ?? 0;
  const xp = q?.rewards?.xp ?? 0;

  const parts = [];
  if (gold) parts.push(`+${gold} oro`);
  if (xp) parts.push(`+${xp} XP`);

  return parts.length ? `\n\n${parts.join("\n")}` : "";
}

// ---------- Quests helpers ----------
export function offeredQuestsForNpc(npcId){
  return Object.values(QUESTS).filter(q => q.giverNpcId === npcId);
}

export function findActiveQuestFromNpc(state, npcId){
  const offered = offeredQuestsForNpc(npcId);
  for (const q of offered){
    if (hasQuest(state, q.id)) return q;
  }
  return null;
}

export function findAvailableQuestsFromNpc(state, npcId, limit = 2){
  const offered = offeredQuestsForNpc(npcId);
  const out = [];
  for (const q of offered){
    if (out.length >= limit) break;
    if (isCompleted(state, q.id)) continue;
    if (hasQuest(state, q.id)) continue;

    const req = questRequirementsStatus(state, q);
    if (!req.ok) continue;

    out.push(q);
  }
  return out;
}

// ✅ Ready para kill/deliver/cook (importante para menú y entrega)
function invQty(item){
  return Number.isFinite(item?.qty) ? item.qty : (item ? 1 : 0);
}
function countInventoryType(state, type){
  const inv = state.player?.inventory ?? [];
  let total = 0;
  for (const it of inv){
    if (it && it.type === type) total += invQty(it);
  }
  return total;
}

function getObjectives(q){
  if (Array.isArray(q?.objectives)) return q.objectives;
  if (q?.objective) return [q.objective];
  return [];
}

export function isQuestReady(state, q){
  const st = state.quests?.active?.[q.id];
  if (!st) return false;

  const objectives = getObjectives(q);
  if (!objectives.length) return false;

  for (const obj of objectives){
    if (obj.type === "kill"){
      const p = st.progress ?? 0;
      if (p < obj.required) return false;
      continue;
    }

    if (obj.type === "deliver"){
      const have = countInventoryType(state, obj.item);
      if (have < obj.required) return false;
      continue;
    }

    if (obj.type === "cook"){
      const p = st.progressByItem?.[obj.item] ?? 0;
      if (p < obj.required) return false;
      continue;
    }

    if (obj.type === "forge"){
      const p = st.progressByItem?.[obj.item] ?? 0;
      if (p < obj.required) return false;
      continue;
    }

    return false; // tipo desconocido
  }

  return true;
}
