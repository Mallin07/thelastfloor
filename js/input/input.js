// js/input/input.js
export const keys = {
  up: false, down: false, left: false, right: false,
  look: false,   // Space (hold)
  dash: false,   // Shift (hold opcional)
};

export const pressed = {
  anyInput: false,      // ✅ cualquier input del jugador (tecla/click/rueda/touch)

  dash: false,          // Shift   
  action: false,        // Numpad5
  dialogNext: false,    // Enter (y Numpad5 en diálogo si quieres)
  dialogUp: false,      // W
  dialogDown: false,    // S
  toggleConsole: false, // C
  menu: false,          // Esc
  sheet: false,         // P
  inventory: false,     // I
  interact: false,      // E (hablar / recoger)
  swapOffHand: false,   // F

  // ✅ HOTBAR 0–9 (fila numérica)
  slot0: false,
  slot1: false,
  slot2: false,
  slot3: false,
  slot4: false,
  slot5: false,
  slot6: false,
  slot7: false,
  slot8: false,
  slot9: false,
};

function press(name){
  pressed[name] = true;
  pressed.anyInput = true; // ✅ cualquier “press” cuenta como input
}

export function consumePressed(){
  for (const k in pressed) pressed[k] = false;
}

export function resetKeys(){
  keys.up = keys.down = keys.left = keys.right = false;
  keys.look = false;
  keys.dash = false;
  consumePressed(); // opcional pero muy recomendado
}

function isTypingInInput() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea";
}

export function bindInput(){
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();

    // Si en el futuro hay inputs de texto, no dispares hotbar accidentalmente
    const typing = isTypingInInput();

    // ✅ Cualquier tecla (incluye WASD/arrows) cuenta como input si no estás escribiendo
    if (!typing) pressed.anyInput = true;

    // ✅ Repetición: solo permitimos repeat para navegar diálogo con W/S
    if (e.repeat) {
      if (k === "w") press("dialogUp");
      if (k === "s") press("dialogDown");
      return;
    }

    // =========================
    // HOTBAR 0–9 (Digit0..Digit9)
    // =========================
    // Nota: no interferimos con menús aquí; main.js decide si ejecutar o no.
    if (!typing && e.code && e.code.startsWith("Digit")) {
      const n = Number(e.code.slice(5)); // Digit7 -> 7
      if (Number.isFinite(n) && n >= 0 && n <= 9) {
        press(`slot${n}`);
        e.preventDefault();
        // no hacemos "return" porque también puedes querer movimiento/otras teclas en el mismo frame
      }
    }

    // (Opcional) HOTBAR con Numpad0..Numpad9:
    // Ojo: Numpad5 ya lo usas como "action", así que NO lo tratamos como slot aquí.
    if (!typing && e.code && e.code.startsWith("Numpad")) {
      const n = Number(e.code.slice(6)); // Numpad7 -> 7
      if (Number.isFinite(n) && n >= 0 && n <= 9) {
        if (n !== 5) { // 5 reservado para action (no slot)
          press(`slot${n}`);
          e.preventDefault();
        }
      }
    }

    // movimiento
    if (k === "w" || k === "arrowup") keys.up = true;
    if (k === "s" || k === "arrowdown") keys.down = true;
    if (k === "a" || k === "arrowleft") keys.left = true;
    if (k === "d" || k === "arrowright") keys.right = true;

    // ✅ diálogo con W/S (cuando haya diálogo abierto, main.js lo usa)
    if (k === "w") press("dialogUp");
    if (k === "s") press("dialogDown");

    // look (Space)
    if (e.code === "Space") {
      e.preventDefault();
      keys.look = true;
      // pressed.anyInput ya está marcado arriba
    }

    // dash (Shift) -> pulso
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      keys.dash = true;
      press("dash");
    }

    // cambio off-hand (F)
    if (k === "f") press("swapOffHand");

    // ✅ Numpad5 = slot 5 (ataque básico)
    if (e.code === "Numpad5") {
      e.preventDefault();
      press("slot5");
    }

    // diálogo next (Enter)
    if (e.code === "Enter") press("dialogNext");

    // UI
    if (k === "c") press("toggleConsole");
    if (k === "escape") press("menu");
    if (k === "p") press("sheet");
    if (k === "i") press("inventory");
    if (k === "e") press("interact");
  });

  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();

    if (k === "w" || k === "arrowup") keys.up = false;
    if (k === "s" || k === "arrowdown") keys.down = false;
    if (k === "a" || k === "arrowleft") keys.left = false;
    if (k === "d" || k === "arrowright") keys.right = false;

    if (e.code === "Space") keys.look = false;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.dash = false;
  });

  // ✅ Mouse / Wheel / Touch también cuentan como input
  window.addEventListener("mousedown", () => { pressed.anyInput = true; });
  window.addEventListener("wheel", () => { pressed.anyInput = true; }, { passive: true });
  window.addEventListener("touchstart", () => { pressed.anyInput = true; }, { passive: true });

  window.addEventListener("blur", () => {
    keys.up = keys.down = keys.left = keys.right = false;
    keys.look = keys.dash = false;
    consumePressed();
  });
}
