// js/main.js
import { state, setSeed, resetState } from "./core/state.js";
import { bindInput, pressed, consumePressed } from "./input/input.js";
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


import {
  talkToNearestNpc,
  advanceDialog,
  dialogUp,
  dialogDown
} from "./interactions/npc_interact.js";

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

// ✅ Action Bar (slots 0–9)
import { useActionSlot, renderActionBar } from "./systems/actionbar_system.js";

function toggleConsole() {
  const el = document.getElementById("logFloat");
  if (!el) return;
  el.classList.toggle("hidden");
}

function init(seed = (Date.now() & 0xffffffff)) {
  setSeed(seed);

  resetState();
  enterMap(state, "town_01", "S");

  const logEl = document.getElementById("log");
  if (logEl) logEl.innerHTML = "";

  logOk("¡Bienvenido! (Modo Zelda) Muévete libre con WASD.");
  logInfo(`Tip: abre menú con <span class="kbd">Esc</span>, inventario con <span class="kbd">I</span>.`);

  renderCanvas(state);
  updateUI(state); // 1ª vez: inmediato

  // ✅ render inicial action bar (contador/labels)
  renderActionBar(state);
}

// ---- Setup inicial ----
bindInput();

window.addEventListener("DOMContentLoaded", () => {
  initMenu(state);
  init();

  // ✅ montar panel de misiones (solo 1 vez)
  mountQuestPanel(state);
});


// ---- Controles ----
function handlePressedInput() {
  // 1) Diálogo abierto → prioridad absoluta
  if (state.dialog?.open) {
    // Enter o Numpad5 avanzan diálogo
    if (pressed.dialogNext || pressed.interact) {
      advanceDialog(state);
      return;
    }

    // W/S navegan diálogo
    if (pressed.dialogUp) { dialogUp(state); return; }
    if (pressed.dialogDown) { dialogDown(state); return; }

    return;
  }

  // 2) Menús / consola (solo si no hay diálogo)
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
    if (isMenuOpen() && getActivePanel() === "sheet") {
      closeMenu();
    } else {
      openSheet(state);
      renderSheet(state);
    }
    return;
  }

  if (pressed.inventory) {
    if (isMenuOpen() && getActivePanel() === "inv") {
      closeMenu();
    } else {
      openInventory(state);
      renderInventory(state);
    }
    return;
  }

  // 3) Barra de habilidades (0–9) por teclado
  //    - Solo si no hay menú y no es game over
  if (!isMenuOpen() && !state.over) {
    for (let n = 0; n <= 9; n++) {
      if (pressed[`slot${n}`]) {
        const r = useActionSlot(state, n);

        // opcional: solo re-render si cambia algo
        renderActionBar(state);

        return; // 1 acción por frame
      }
    }
  }

  // 4) Interacción (E): recoger / hablar
  if (pressed.interact) {
    if (state.over) return;

    const picked = tryPickupFacingItem(state);
    if (picked) return;

    const talked = talkToNearestNpc(state);
    if (talked) return;

    return;
  }
}


// ---- Game loop ----
let last = performance.now();

// HUD "throttle"
let uiAcc = 0;
const UI_INTERVAL = 0.10;

function loop(t) {
  const dt = Math.min(0.033, (t - last) / 1000);
  last = t;

  // ✅ 1) Procesa inputs "por pulso" (menú/diálogo/acción) ANTES de limpiar pressed
  handlePressedInput();

  if (!state.over) {
    // ✅ El mundo sigue actualizándose siempre
    updateAnimals(state, dt);
    updateHunger(state, dt);
    updateCombat(state, dt);
    updateItemPickup(state);
    tryExit(state);
  
    // ✅ El jugador también se actualiza (input sigue funcionando)
    updatePlayer(state, dt);
  
    // DASH centralizado (1 pulsación = 1 dash)
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

  // 👇 2) Consumimos eventos SIEMPRE una vez por frame (DESPUÉS de usarlos)
  consumePressed();

  updateQuestPanel(state);
  renderCanvas(state);

  // HUD "throttle"
  uiAcc += dt;
  if (uiAcc >= UI_INTERVAL) {
    uiAcc = 0;
    updateUI(state);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
