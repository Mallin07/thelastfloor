// js/ui/menu/quest_panel.js
import { QUESTS } from "../../data/quests_db.js";
import { questStatusText, questUiStatus } from "../../entities/quests.js";

let _mounted = false;
let _lastHtml = "";
let _lastUpdate = 0;

const STORAGE_KEY = "quest_panel_collapsed_v1";

export function mountQuestPanel(state){
  if (_mounted) return;
  _mounted = true;

  const panel = document.getElementById("questPanel");
  const btn = document.getElementById("questPanelToggle");

  if (!panel){
    console.warn("[quest_panel] Falta questPanel en el HTML.");
    return;
  }

  // --- Estado inicial (recuerda plegado) ---
  const saved = localStorage.getItem(STORAGE_KEY);
  const startCollapsed = saved === "1";

  applyCollapsed(panel, btn, startCollapsed);

  // --- Toggle click (plegar/desplegar) ---
  if (btn){
    btn.addEventListener("click", () => {
      const collapsed = panel.classList.toggle("is-collapsed");
      applyCollapsed(panel, btn, collapsed);
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    });
  }

  // Primer render
  updateQuestPanel(state, true);
}

function applyCollapsed(panel, btn, collapsed){
  panel.classList.toggle("is-collapsed", collapsed);

  if (btn){
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    btn.textContent = collapsed ? "▸" : "▾";
  }
}

export function updateQuestPanel(state, force = false){
  // throttle para no machacar el DOM cada frame
  const now = performance.now();
  if (!force && now - _lastUpdate < 200) return;
  _lastUpdate = now;

  const list = document.getElementById("questPanelList");
  if (!list) return;

  const active = state?.quests?.active ?? {};
  const questIds = Object.keys(active);

  if (questIds.length === 0){
    const html = `<div class="quest-card"><div class="quest-card__title">No tienes misiones activas.</div></div>`;
    if (html !== _lastHtml){
      list.innerHTML = html;
      _lastHtml = html;
    }
    return;
  }

  const cards = questIds.map((qid) => {
    const q = QUESTS[qid];
    if (!q) return "";
  
    const status = questUiStatus(state, qid); // "active" | "ready"
    const isReady = status === "ready";
  
    const title = q.title ?? qid;
    const npc = q.giverNpcId ? `NPC: ${q.giverNpcId}` : "NPC: -";
  
    // ✅ si está lista, NO mostramos el texto "ready" en el panel
    const prog = isReady ? "" : (questStatusText(state, qid) || "");
  
    const statusLabel = isReady ? "LISTA" : "ACTIVA";
    const statusClass = isReady ? "is-ready" : "is-active";
  
    return `
      <div class="quest-card ${statusClass}">
        <div class="quest-card__top">
          <div class="quest-card__title">📜 ${escapeHtml(title)}</div>
          <div class="quest-card__status">${statusLabel}</div>
        </div>
        <div class="quest-card__npc">${escapeHtml(npc)}</div>
        ${prog ? `<div class="quest-card__progress">${escapeHtml(prog)}</div>` : ""}
      </div>
    `;
  }).join("");


  if (cards !== _lastHtml){
    list.innerHTML = cards;
    _lastHtml = cards;
  }
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
