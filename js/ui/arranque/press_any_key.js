// js/ui/press_any_key.js
export function initPressAnyKey({ onUnlock } = {}) {
  const screen = document.getElementById("pressAnyKey");
  const menu = document.getElementById("startMenu");

  if (!screen) {
    console.warn("[pressAnyKey] No existe #pressAnyKey en el DOM");
    return;
  }
  if (!menu) {
    console.warn("[pressAnyKey] No existe #startMenu en el DOM");
  }

  let done = false;

  const unlock = () => {
    if (done) return;
    done = true;

    // Oculta pantalla "pulsa cualquier tecla"
    screen.classList.add("hidden");
    screen.setAttribute("aria-hidden", "true");

    // Muestra menú
    if (menu) {
      menu.classList.remove("hidden");
      menu.setAttribute("aria-hidden", "false");
    }

    // Callback (para música, etc.)
    try { onUnlock?.(); } catch (e) { console.error(e); }

    window.removeEventListener("keydown", unlock);
    window.removeEventListener("pointerdown", unlock);
  };

  window.addEventListener("keydown", unlock);
  window.addEventListener("pointerdown", unlock);

  console.log("[pressAnyKey] listo: esperando tecla/click…");
}
