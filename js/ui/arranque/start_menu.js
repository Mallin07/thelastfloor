// js/ui/start_menu.js
import { listSaves } from "../../core/save_system.js";

function fmtDate(ts){
  try { return new Date(ts).toLocaleString("es-ES"); } catch { return "—"; }
}
function slotMetaText(meta){
  if (!meta) return "Vacío";
  return `${fmtDate(meta.savedAt)} · mapa: ${meta.mapId ?? "?"} · lvl: ${meta.lvl ?? 1}`;
}

function renderSlots(onLoad){
  const el = document.getElementById("saveSlots");
  if (!el) return;

  const saves = listSaves();
  el.innerHTML = "";

  saves.forEach((entry, i) => {
    const meta = entry?.meta ?? null;

    const row = document.createElement("div");
    row.className = "save-slot";

    const left = document.createElement("div");
    left.className = "save-slot__meta";
    left.innerHTML = `<b>Slot ${i + 1}</b><br>${slotMetaText(meta)}`;

    const btnLoad = document.createElement("button");
    btnLoad.className = "save-slot__btn";
    btnLoad.textContent = "Cargar";
    btnLoad.disabled = !meta;
    btnLoad.addEventListener("click", () => onLoad(i));

    row.append(left, btnLoad);
    el.appendChild(row);
  });
}

function showLoadPanel(show, onLoad){
  const loadPanel = document.getElementById("loadPanel");
  if (!loadPanel) return;
  loadPanel.classList.toggle("hidden", !show);
  loadPanel.setAttribute("aria-hidden", String(!show));
  if (show) renderSlots(onLoad);
}

export function openStartMenu(){
  const menu = document.getElementById("startMenu");
  if (!menu) return;
  menu.classList.remove("hidden");
  menu.setAttribute("aria-hidden", "false");
  showLoadPanel(false);
}

export function closeStartMenu(){
  const menu = document.getElementById("startMenu");
  if (!menu) return;
  menu.classList.add("hidden");
  menu.setAttribute("aria-hidden", "true");
}

export function initStartMenu({ onNew, onLoad, onExit }){
  // evita doble binding si llamas dos veces
  if (window.__startMenuBound) return;
  window.__startMenuBound = true;

  document.getElementById("btnNewGame")?.addEventListener("click", () => onNew?.());
  document.getElementById("btnLoadMenu")?.addEventListener("click", () => showLoadPanel(true, onLoad));
  document.getElementById("btnBackToMain")?.addEventListener("click", () => showLoadPanel(false));

  document.getElementById("btnExitGame")?.addEventListener("click", () => {
    // intentará cerrar; si falla, al menos ejecuta tu callback
    window.close();
    onExit?.();
  });
}
