// js/main.js
import { state, setSeed, resetState } from "./core/state.js";
import { bindInput, pressed, consumePressed } from "./input/input.js";
import { initPressAnyKey } from "./ui/arranque/press_any_key.js";
import { initMenuMusic, playMenuMusic, stopMenuMusic } from "./ui/arranque/menu_music.js";
import { renderCanvas } from "./ui/render_canvas.js";
import { updateUI } from "./ui/ui.js";
import { logInfo, logOk } from "./ui/log.js";
import { mountQuestPanel, updateQuestPanel } from "./ui/menu/quest_panel.js";

import { tryExit } from "./world/map.js";
import { enterMap } from "./world/enter_map.js";

import { updatePlayer, dash } from "./systems/player_move_system.js";
import { updateCombat } from "./systems/combat_system.js";
import { updateAnimals } from "./systems/animals_system.js";
import { updateHunger } from "./systems/hunger_system.js";

import { talkToNearestNpc, advanceDialog, dialogUp, dialogDown } from "./interactions/npc_interact.js";
import { tryPickupFacingItem, updateItemPickup } from "./interactions/item_interact.js";

import {
  initMenu,
  toggleMenu,
  closeMenu,
  openSheet,
  openInventory,
  isMenuOpen,
  getActivePanel,
  renderSheet,
  renderInventory
} from "./ui/menu/menu_index.js";

import { useActionSlot, renderActionBar } from "./systems/actionbar_system.js";

// ✅ SAVE SYSTEM
import { loadFromSlot } from "./core/save_system.js";

// ✅ START MENU
import { initStartMenu, openStartMenu, closeStartMenu } from "./ui/arranque/start_menu.js";

function toggleConsole() {
  const el = document.getElementById("logFloat");
  if (!el) return;
  el.classList.toggle("hidden");
}

// =====================================================
// INIT (separado en "nuevo" y "base")
// =====================================================

function initBase(seed = (Date.now() & 0xffffffff)) {
  setSeed(seed);
  resetState();

  const logEl = document.getElementById("log");
  if (logEl) logEl.innerHTML = "";

  renderCanvas(state);
  updateUI(state);
  renderActionBar(state);
}

function initNewGame(seed) {
  initBase(seed);
  enterMap(state, "town_01", "S");

  logOk("¡Bienvenido! (Modo Zelda) Muévete libre con WASD.");
  logInfo(`Tip: abre menú con <span class="kbd">Esc</span>, inventario con <span class="kbd">I</span>.`);

  renderCanvas(state);
  updateUI(state);
  renderActionBar(state);
}

function initFromSave(slotIndex) {
  initBase();

  const ok = loadFromSlot(state, slotIndex);
  if (!ok) return false;

  logOk("Partida cargada.");
  renderCanvas(state);
  updateUI(state);
  renderActionBar(state);
  return true;
}

// =====================================================
// GAME LOOP (pausable)
// =====================================================

let last = performance.now();
let uiAcc = 0;
const UI_INTERVAL = 0.10;

let running = false;
let rafId = null;

function loop(t) {
  if (!running) return;

  const dt = Math.min(0.033, (t - last) / 1000);
  last = t;

  handlePressedInput();

  if (!state.over) {
    updateAnimals(state, dt);
    updateHunger(state, dt);
    updateCombat(state, dt);
    updateItemPickup(state);
    tryExit(state);

    updatePlayer(state, dt);

    if (pressed.dash) {
      const p = state.player;
      const now = performance.now();
      p._dashNext = p._dashNext ?? 0;

      if (now >= p._dashNext) {
        dash(state);
        p._dashNext = now + 5000;
      }
    }
  }

  consumePressed();

  updateQuestPanel(state);
  renderCanvas(state);

  uiAcc += dt;
  if (uiAcc >= UI_INTERVAL) {
    uiAcc = 0;
    updateUI(state);
  }

  rafId = requestAnimationFrame(loop);
}

function startLoop() {
  if (running) return;
  running = true;
  last = performance.now();
  uiAcc = 0;
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

// =====================================================
// INPUT (igual que el tuyo, sin cambios de lógica)
// =====================================================

function handlePressedInput() {
  if (state.dialog?.open) {
    if (pressed.dialogNext || pressed.interact) { advanceDialog(state); return; }
    if (pressed.dialogUp) { dialogUp(state); return; }
    if (pressed.dialogDown) { dialogDown(state); return; }
    return;
  }

  if (pressed.toggleConsole) { toggleConsole(); return; }

  if (pressed.menu) {
    toggleMenu();
    if (isMenuOpen()) {
      renderSheet(state);
      renderInventory(state);
      renderActionBar(state);
    }
    return;
  }

  if (pressed.sheet) {
    if (isMenuOpen() && getActivePanel() === "sheet") closeMenu();
    else { openSheet(state); renderSheet(state); }
    return;
  }

  if (pressed.inventory) {
    if (isMenuOpen() && getActivePanel() === "inv") closeMenu();
    else { openInventory(state); renderInventory(state); }
    return;
  }

  if (!isMenuOpen() && !state.over) {
    for (let n = 0; n <= 9; n++) {
      if (pressed[`slot${n}`]) {
        useActionSlot(state, n);
        renderActionBar(state);
        return;
      }
    }
  }

  if (pressed.interact) {
    if (state.over) return;
    if (tryPickupFacingItem(state)) return;
    if (talkToNearestNpc(state)) return;
    return;
  }
}

// =====================================================
// API del menú (callbacks)
// =====================================================

function onNewGame() {
  stopMenuMusic();   // ✅ PARA AQUÍ
  closeMenu();
  initNewGame();
  closeStartMenu();
  startLoop();
}

function onLoadGame(slotIndex) {
  stopMenuMusic();   // ✅ PARA AQUÍ
  closeMenu();

  const ok = initFromSave(slotIndex);
  if (!ok) {
    openStartMenu();
    playMenuMusic(); // ✅ si falla, vuelve a sonar
    alert("Ese slot está vacío o no se pudo cargar.");
    return;
  }

  closeStartMenu();
  startLoop();
}

function onExitGame() {
  stopLoop();
  openStartMenu();
  playMenuMusic();   // ✅ al volver al menú, suena
}


// =====================================================
// SETUP INICIAL: NO ARRANCA JUEGO, SOLO MENÚ
// =====================================================

bindInput();

window.addEventListener("DOMContentLoaded", () => {
  initMenu(state);
  mountQuestPanel(state);

  stopLoop();

  // 1) Cablea (bind) los botones del menú principal
  initStartMenu({
    onNew: onNewGame,
    onLoad: onLoadGame,
    onExit: onExitGame
  });

  // 2) Oculta el menú hasta que se desbloquee con "pulsa cualquier tecla"
  const menu = document.getElementById("startMenu");
  if (menu) menu.classList.add("hidden");

  // 3) Pantalla "pulsa cualquier tecla" -> al desbloquear, muestra menú y arranca música
  initPressAnyKey({
    onUnlock: () => {
      openStartMenu();

      initMenuMusic();  // prepara
      playMenuMusic();  // empieza la música del menú (ya hubo interacción)
    }
  });
});





