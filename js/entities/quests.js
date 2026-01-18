// js/entities/quests.js
import { logInfo, logOk, logBad } from "../ui/log.js";
import { QUESTS } from "../data/quests_db.js";
import { gainXP } from "../systems/combat_system.js"; // ✅ NUEVO: usar la misma lógica que en kills

// helpers
export function hasQuest(state, questId){
  return !!state.quests?.active?.[questId];
}
export function isCompleted(state, questId){
  return !!state.quests?.completed?.[questId];
}

// ---- objectives helpers ----
function getObjectives(q){
  if (Array.isArray(q?.objectives)) return q.objectives;
  if (q?.objective) return [q.objective];
  return [];
}

// ---------- REQUIREMENTS ----------
export function questRequirementsStatus(state, quest){
  const r = quest.requires;
  if (!r) return { ok: true };

  // nivel mínimo
  if (r.level != null && (state.player.lvl ?? 1) < r.level){
    return { ok: false, reason: "level", value: r.level };
  }

  // quest previa completada (single)
  if (r.completedQuest && !state.quests?.completed?.[r.completedQuest]){
    return { ok: false, reason: "quest", value: r.completedQuest };
  }

  // quests previas completadas (multi)
  if (Array.isArray(r.completedQuests)){
    for (const qid of r.completedQuests){
      if (!state.quests?.completed?.[qid]){
        return { ok: false, reason: "quest", value: qid };
      }
    }
  }

  return { ok: true };
}

// ---------- INVENTARIO (state.player.inventory = slots) ----------
function invQty(item){
  return Number.isFinite(item?.qty) ? item.qty : (item ? 1 : 0);
}

function countInventoryType(state, type){
  const inv = state.player?.inventory ?? [];
  let total = 0;
  for (const it of inv){
    if (!it) continue;
    if (it.type === type) total += invQty(it);
  }
  return total;
}

function consumeInventoryType(state, type, amount){
  const inv = state.player?.inventory ?? [];
  let left = amount;

  for (let i = 0; i < inv.length && left > 0; i++){
    const it = inv[i];
    if (!it || it.type !== type) continue;

    const q = invQty(it);
    if (q <= left){
      inv[i] = null;
      left -= q;
    } else {
      inv[i] = { ...it, qty: q - left };
      left = 0;
    }
  }
  return left === 0;
}

// ✅ Ready por objetivos (1 o muchos)
function isQuestReady(state, q){
  const st = state.quests?.active?.[q.id];
  if (!st) return false;

  const objectives = getObjectives(q);
  if (!objectives.length) return false;

  for (const obj of objectives){
    if (obj.type === "kill"){
      const p = st.progress ?? 0; // legacy: un contador
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

    // tipo desconocido
    return false;
  }

  return true;
}

// ---------- API ----------
export function canOfferQuest(state, questId, npcId){
  const q = QUESTS[questId];
  if (!q) return false;
  if (q.giverNpcId && q.giverNpcId !== npcId) return false;
  if (isCompleted(state, questId)) return false;
  if (hasQuest(state, questId)) return false;

  const req = questRequirementsStatus(state, q);
  if (!req.ok) return false;

  return true;
}

export function acceptQuest(state, questId){
  const q = QUESTS[questId];
  if (!q) return false;

  state.quests ??= { active:{}, completed:{} };
  if (state.quests.active[questId] || state.quests.completed[questId]) return false;

  // progress: legacy kill
  // progressByItem: para cook multi (y también sirve si algún día haces deliver multi por item)
  state.quests.active[questId] = {
    progress: 0,
    progressByItem: {},
    startedAt: performance.now()
  };

  logOk(`Quest aceptada: <b>${q.title}</b>.`);
  return true;
}

export function questStatusText(state, questId){
  const q = QUESTS[questId];
  const st = state.quests?.active?.[questId];
  if (!q || !st) return "";

  const objectives = getObjectives(q);
  if (!objectives.length) return "";

  // MULTI: si hay más de 1 objetivo, devolvemos resumen
  if (objectives.length > 1){
    if (isQuestReady(state, q)) return q.text.ready ?? "Listo.";

    const prog = {};
    const reqs = {};

    for (const obj of objectives){
      if (obj.type === "cook"){
        prog[obj.item] = st.progressByItem?.[obj.item] ?? 0;
        reqs[obj.item] = obj.required;
      } else if (obj.type === "deliver"){
        prog[obj.item] = countInventoryType(state, obj.item);
        reqs[obj.item] = obj.required;
      } else if (obj.type === "kill"){
        // legacy: un contador único; si tuvieras varios kills, aquí habría que separar por target
        prog[obj.target ?? "kills"] = st.progress ?? 0;
        reqs[obj.target ?? "kills"] = obj.required;
      }
    }

    return q.text.inProgress?.(prog, reqs) ?? "Progreso…";
  }

  // SINGLE (compatibilidad)
  const obj = objectives[0];

  if (obj.type === "kill"){
    const req = obj.required;
    const p = st.progress ?? 0;
    if (p >= req) return q.text.ready;
    return q.text.inProgress(p, req);
  }

  if (obj.type === "deliver"){
    const have = countInventoryType(state, obj.item);
    const req = obj.required;

    if (have >= req) return q.text.ready ?? "Listo para entregar.";
    return q.text.inProgress?.(have, req) ?? `Progreso: ${have}/${req}`;
  }

  if (obj.type === "cook"){
    const req = obj.required;
    const p = st.progressByItem?.[obj.item] ?? 0;
    if (p >= req) return q.text.ready ?? "Listo.";
    return q.text.inProgress?.(p, req) ?? `Cocinado: ${p}/${req}`;
  }

  if (obj.type === "forge"){
    const req = obj.required;
    const p = st.progressByItem?.[obj.item] ?? 0;

    if (p >= req) return q.text.ready ?? "Listo.";
    return q.text.inProgress?.(p, req) ?? `Forjado: ${p}/${req}`;
  }


  return "";
}

export function tryCompleteQuest(state, questId){
  const q = QUESTS[questId];
  const st = state.quests?.active?.[questId];
  if (!q || !st) return false;

  if (!isQuestReady(state, q)){
    logInfo("Aún no está completada.");
    return false;
  }

  // rewards
  const r = q.rewards || {};
  if (r.gold) state.player.gold = (state.player.gold ?? 0) + r.gold;

  // ✅ CAMBIO CLAVE: XP pasa por gainXP (sube nivel y conserva sobrante)
  if (r.xp) gainXP(state, r.xp);

  delete state.quests.active[questId];
  state.quests.completed[questId] = true;

  logOk(q.text.complete);
  if (r.gold) logOk(`+${r.gold} oro`);

  // (opcional) deja este log si quieres ver el +XP aquí también
  // si prefieres evitar logs duplicados (si gainXP ya loguea), comenta esta línea.
  if (r.xp) logOk(`+${r.xp} XP`);

  return true;
}

// ---------------//
// --- EVENTOS ---//
//----------------//
export function onQuestEvent(state, ev){
  // ev:
  // - kill: { type:"kill", target:"slime", amount:1 }
  // - cook: { type:"cook", item:"salteado_setas", amount:1 }
  if (!state.quests?.active) return;

  for (const [qid, st] of Object.entries(state.quests.active)){
    const q = QUESTS[qid];
    if (!q) continue;

    const objectives = getObjectives(q);

    for (const obj of objectives){
      if (obj.type !== ev.type) continue;

      if (obj.type === "kill"){
        if (obj.target && obj.target !== ev.target) continue;
        st.progress = Math.min(obj.required, (st.progress ?? 0) + (ev.amount ?? 1));
      }

      if (obj.type === "cook"){
        if (obj.item && obj.item !== ev.item) continue;
        st.progressByItem ??= {};
        const cur = st.progressByItem[obj.item] ?? 0;
        st.progressByItem[obj.item] = Math.min(obj.required, cur + (ev.amount ?? 1));
      }

      if (obj.type === "forge"){
        if (obj.item && obj.item !== ev.item) continue;
        st.progressByItem ??= {};
        const cur = st.progressByItem[obj.item] ?? 0;
        st.progressByItem[obj.item] = Math.min(obj.required, cur + (ev.amount ?? 1));
      }
    }
  }
}

// aviso de evento disponible (icono encima del NPC)
export function npcQuestIndicatorState(state, npc){
  const quests = Object.values(QUESTS).filter(q => q.giverNpcId === npc.id);

  // 🟢 lista para entregar (kill/deliver/cook, single o multi)
  for (const q of quests){
    if (state.quests?.active?.[q.id] && isQuestReady(state, q)){
      return "ready";
    }
  }

  // 🔵 misión activa (pero no lista)
  for (const q of quests){
    if (state.quests?.active?.[q.id]){
      return "active";
    }
  }

  // 🟡 misión disponible
  for (const q of quests){
    if (isCompleted(state, q.id)) continue;
    if (state.quests?.active?.[q.id]) continue;

    const req = questRequirementsStatus(state, q);
    if (req.ok) return "available";
  }

  return null;
}

// ✅ Helper UI: estado simple de la quest para panel lateral
export function questUiStatus(state, questId){
  const q = QUESTS[questId];
  if (!q) return "active";
  return (state.quests?.active?.[questId] && isQuestReady(state, q)) ? "ready" : "active";
}

