// js/ui/menu/menu_index.js

import {
  bindMenuDom,
  ctx,
  closeMenu,
  toggleMenu,
  isMenuOpen,
  getActivePanel
} from "./menu_base.js";

import { openSheet, renderSheet } from "./menu_sheet.js";
import { openInventory, renderInventory } from "./menu_inventory.js";
import { openBank } from "./menu_bank.js";
import { useActionSlot, renderActionBar } from "../../systems/actionbar_system.js";
import { openCraft } from "./menu_craft.js";

export { openTrade } from "./menu_trade.js";

export function initMenu(state){
  bindMenuDom();

  // ==================================================
  // Overlay / menú principal
  // ==================================================
  ctx.btnClose?.addEventListener("click", closeMenu);

  ctx.btnSheet?.addEventListener("click", ()=>{
    openSheet(state);
    renderSheet(state);
  });

  ctx.btnInv?.addEventListener("click", ()=>{
    openInventory(state);
    renderInventory(state);
  });

  ctx.btnBank?.addEventListener("click", ()=>openBank(state));
  ctx.btnForge?.addEventListener("click", ()=>openCraft(state, "forge"));

  // Cerrar si click fuera del modal (sin bloquear el juego)
  document.addEventListener("pointerdown", (e) => {
    // Si no hay overlay o está oculto, no hacer nada
    if (!ctx.overlay || ctx.overlay.classList.contains("hidden")) return;
  
    // Si el click fue dentro del modal, no cerrar
    if (e.target.closest("#overlay .modal")) return;
  
    // Click fuera del modal → cerrar menú
    closeMenu();
  }, true); // ← captura para que funcione aunque el juego maneje inputs


  // ==================================================
  // HUD superior (Inventario / Personaje)
  // ==================================================
  const hudInv  = document.getElementById("btnInventory");
  const hudChar = document.getElementById("btnCharacter");

  // Inventario (HUD)
  hudInv?.addEventListener("click", ()=>{
    if (isMenuOpen() && getActivePanel() === "inv"){
      closeMenu();
      return;
    }
    if (!isMenuOpen()) toggleMenu();
    openInventory(state);
    renderInventory(state);
  });

  // Personaje (HUD)
  hudChar?.addEventListener("click", ()=>{
    if (isMenuOpen() && getActivePanel() === "sheet"){
      closeMenu();
      return;
    }
    if (!isMenuOpen()) toggleMenu();
    openSheet(state);
    renderSheet(state);
  });

  // ==================================================
  // ✅ ACTION BAR (HUD skills 0–9)
  // ==================================================
  const actionBar = document.getElementById("actionBar");
  actionBar?.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".skill-slot");
    if (!btn) return;

    const slot = Number(btn.dataset.slot);
    if (!Number.isFinite(slot)) return;

    useActionSlot(state, slot);
    renderActionBar(state);
  });

  // ==================================================
  // Render inicial
  // ==================================================
  renderSheet(state);
  renderInventory(state);
  renderActionBar(state);
}

// ==================================================
// API pública (consumida por main.js)
// ==================================================
export {
  toggleMenu,
  closeMenu,      
  isMenuOpen,
  getActivePanel, 
  openSheet,
  openInventory,
  renderSheet,
  renderInventory,
  openBank,
};

