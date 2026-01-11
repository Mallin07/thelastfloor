// js/systems/actionbar_system.js
import { logBad, logOk } from "../ui/log.js";
import { useSkill, humanCastFail } from "./skill_use_system.js";
import { attack } from "../entities/player.js"; // ajusta si tu attack está en otro sitio
import { SKILLS } from "../data/skills_db.js";
import { ITEMS } from "../data/items_db.js";
import { useItemById } from "../entities/items.js";

const ICONS = {
  basic_attack: "js/assets/habilidades_slot/basic_attack.png",
};

// Slots libres: 0 (consumible) y 5 (básico) son reservados
export const ACTIONBAR_FREE_SLOTS = [1, 2, 3, 4, 6, 7, 8, 9];

// ✅ helper local: contar cantidad total en inventario por itemId
function countOwned(player, itemId) {
  // inventory (si hay items stackeados ahí)
  const inv = player?.inventory ?? [];
  let total = 0;

  for (const it of inv) {
    if (!it) continue;
    const id = it.type ?? it.id ?? it.itemId;
    if (id !== itemId) continue;

    const q = Number.isFinite(it.qty) ? it.qty : (Number.isFinite(it.count) ? it.count : 1);
    total += q;
  }

  // consumables (tu bolsa de comida)
  const bag = player?.consumables ?? {};
  total += Number.isFinite(bag[itemId]) ? bag[itemId] : 0;

  return total;
}


export function useActionSlot(state, slot) {
  const p = state.player;

  // ✅ garantiza que actionBar existe y tiene 0..9
  ensureActionBar(p);

  console.log("[useActionSlot] slot =", slot, "entry =", p.actionBar?.[slot]);

  // Slot 5 reservado: ataque básico sí o sí
  if (slot === 5) {
    attack(state);
    return { ok: true };
  }

  const entry = p.actionBar?.[slot];
  if (!entry) {
    logBad("Ese slot está vacío.");
    return { ok: false, reason: "empty_slot" };
  }

  // Por si alguien mete esto en otro slot
  if (entry.type === "basic_attack") {
    attack(state);
    return { ok: true };
  }

  if (entry.type === "skill") {
    const r = useSkill(state, entry.id);
    if (!r.ok) logBad(humanCastFail(r));
    return r;
  }

  // ✅ Consumible (slot 0 normalmente)
  if (entry.type === "consumable") {
    const ok = useItemById(state, entry.id);

    // ✅ si ya no queda en inventario, limpia asignación aunque ok sea true
    const left = countOwned(p, entry.id);
    if (
      left <= 0 &&
      p.actionBar?.[0]?.type === "consumable" &&
      p.actionBar[0]?.id === entry.id
    ) {
      p.actionBar[0] = null;
    }

    // refresca HUD (contador / icono)
    renderActionBar(state);

    return { ok };
  }

  logBad("Acción desconocida.");
  return { ok: false, reason: "unknown_action" };
}


export function ensureActionBar(p) {
  p.actionBar ??= {};
  for (let i = 0; i <= 9; i++) if (!(i in p.actionBar)) p.actionBar[i] = null;

  // slot 5 siempre ataque básico
  p.actionBar[5] = { type: "basic_attack" };
}

/**
 * Devuelve el primer slot libre permitido (1-4,6-9) o null.
 */
export function findFirstFreeActionSlot(p) {
  ensureActionBar(p);
  for (const i of ACTIONBAR_FREE_SLOTS) {
    if (p.actionBar[i] == null) return i;
  }
  return null;
}

/**
 * Devuelve el índice del slot donde está esa skill, o null si no está.
 */
export function findSkillInActionBar(p, skillId) {
  ensureActionBar(p);
  for (let i = 0; i <= 9; i++) {
    const e = p.actionBar[i];
    if (e && e.type === "skill" && e.id === skillId) return i;
  }
  return null;
}

/**
 * Asigna una skill a un slot (1-4,6-9).
 * - Valida slot
 * - Evita duplicados (si ya estaba en otro slot, lo vacía)
 * - Reemplaza lo que haya en ese slot
 */
export function assignSkillToActionSlot(p, skillId, slot) {
  ensureActionBar(p);

  if (slot === 0 || slot === 5) return { ok: false, reason: "reserved" };
  if (!ACTIONBAR_FREE_SLOTS.includes(slot))
    return { ok: false, reason: "invalid_slot" };

  // quitar duplicado si ya estaba en otra parte
  const prev = findSkillInActionBar(p, skillId);
  if (prev != null && prev !== slot) p.actionBar[prev] = null;

  // asignación (replace)
  p.actionBar[slot] = { type: "skill", id: skillId };
  return { ok: true, slot };
}

/**
 * Auto-asigna una skill recién aprendida (rank 1) al primer slot libre.
 * - No hace nada si ya estaba en la barra
 * - No fuerza si no hay hueco
 */
export function autoAssignLearnedSkill(p, skillId) {
  ensureActionBar(p);

  if (findSkillInActionBar(p, skillId) != null)
    return { ok: false, reason: "already_in_bar" };

  const slot = findFirstFreeActionSlot(p);
  if (slot == null) return { ok: false, reason: "no_free_slot" };

  p.actionBar[slot] = { type: "skill", id: skillId };
  return { ok: true, slot };
}

export function renderActionBar(state) {
  const p = state.player;
  ensureActionBar(p);

  // ✅ Bind Drag & Drop SOLO una vez
  if (!state._actionbarDnDBound) {
    bindHudActionBarDnD(state);
    state._actionbarDnDBound = true;
  }

  // contador slot 0 (cantidad real del consumible asignado)
  const el = document.getElementById("slot0Count");
  if (el) {
    const entry0 = p.actionBar?.[0];
    const n = entry0?.type === "consumable" ? countOwned(p, entry0.id) : 0;
    el.textContent = String(n);
  }

  const bar = document.getElementById("actionBar");
  if (!bar) return;

  const buttons = bar.querySelectorAll(".skill-slot");
  buttons.forEach((btn) => {
    const slot = Number(btn.dataset.slot);
    const labelEl = btn.querySelector(".label");
    const iconEl = btn.querySelector("img.icon");
    if (!labelEl || !iconEl || !Number.isFinite(slot)) return;

    // ✅ reset drag por defecto
    btn.draggable = false;
    btn.ondragstart = null;

    const setIcon = (src) => {
      if (src) btn.style.backgroundImage = `url("${src}")`;
      else btn.style.backgroundImage = "";
    };

    // helper: resolver ruta relativa típica (si icon es filename suelto)
    const resolveSrc = (s) => {
      if (!s) return "";
      if (s.startsWith("http") || s.startsWith("data:")) return s;
      if (s.includes("/")) return s;
      return `img/items/${s}`;
    };

    // limpiar visual por defecto (evita “restos” al cambiar slot)
    btn.querySelector(".emoji-icon")?.remove();
    iconEl.style.display = "none";
    setIcon("");

    // Slot 5: ataque básico
    if (slot === 5) {
      labelEl.textContent = "Básico";
      setIcon(ICONS.basic_attack);
      return;
    }

    // Slot 0: consumible asignable (SOLO ICONO, sin nombre)
    if (slot === 0) {
      const entry0 = p.actionBar?.[0];

      // sin texto siempre
      labelEl.textContent = "";

      // si no hay consumible, se queda vacío
      if (!entry0 || entry0.type !== "consumable") return;

      // 1) def desde ITEMS
      let def0 = ITEMS?.[entry0.id];

      // 2) fallback: buscar en inventario (por si ITEMS no tiene esa key)
      if (!def0) {
        const it0 = (p.inventory ?? []).find(
          (x) => x && ((x.type ?? x.id) === entry0.id)
        );
        if (it0) def0 = it0;
      }

      const icon0 = (def0?.icon ?? "").trim();
      if (!icon0) return;

      const looksLikeImage =
        icon0.includes(".png") ||
        icon0.includes(".jpg") ||
        icon0.includes(".jpeg") ||
        icon0.includes(".webp") ||
        icon0.includes(".gif");

      // Emoji (🍲 etc.)
      if (!looksLikeImage) {
        const span = document.createElement("span");
        span.className = "emoji-icon";
        span.textContent = icon0;

        span.style.position = "absolute";
        span.style.inset = "0";
        span.style.display = "grid";
        span.style.placeItems = "center";
        span.style.fontSize = "20px";
        span.style.lineHeight = "1";
        span.style.pointerEvents = "none";
        span.style.zIndex = "5";

        btn.appendChild(span);
        return;
      }

      // Imagen
      setIcon(resolveSrc(icon0));
      return;
    }

    // Resto de slots
    const entry = p.actionBar?.[slot];

    if (!entry) {
      labelEl.textContent = "Vacío";
      setIcon("");
      return;
    }

    if (entry.type === "skill") {
      const skill = SKILLS?.[entry.id];
      labelEl.textContent = skill?.name ?? entry.id;

      const icon = skill?.icon ?? "";
      setIcon(icon);

      // ✅ draggable desde HUD (para mover/swap)
      btn.draggable = true;
      btn.ondragstart = (e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/skill-id", entry.id);
        e.dataTransfer.setData("text/from-slot", String(slot));
        e.dataTransfer.setData("text/plain", entry.id);
      };
      return;
    }

    // (opcional) consumibles en otros slots (si algún día los permites)
    if (entry.type === "consumable") {
      const def = ITEMS?.[entry.id];
      labelEl.textContent = def?.name ?? entry.id;

      const icon = (def?.icon ?? "").trim();
      if (icon) setIcon(resolveSrc(icon));
      else setIcon("");

      return;
    }

    // fallback
    labelEl.textContent = entry.type;
    setIcon("");
  });
}


// ✅ Drag & Drop: soltar skills (1-4,6-9) y consumibles de comida (slot 0)
export function bindHudActionBarDnD(state) {
  const bar = document.getElementById("actionBar");
  if (!bar) return;

  // helper: detectar target slot
  const getSlotFromEvent = (e) => {
    const slotEl = e.target?.closest?.(".skill-slot");
    if (!slotEl) return { slotEl: null, slot: null };
    const slot = Number(slotEl.dataset.slot);
    if (!Number.isFinite(slot)) return { slotEl: null, slot: null };
    return { slotEl, slot };
  };

  // ✅ Delegación: un solo set de listeners para toda la barra
   bar.addEventListener("dragover", (e) => {
     const { slotEl, slot } = getSlotFromEvent(e);
     if (!slotEl) return;
   
     const dt = e.dataTransfer;
     if (!dt) return;
   
     // desde inventario: comida consumible
     const consumableId = dt.getData("text/consumable-id") || dt.getData("text/plain");
     if (consumableId) {
       if (slot !== 0) return;  // comida solo al slot 0
       e.preventDefault();      // 🔑 permite drop
       dt.dropEffect = "copy";
       return;
     }
   
     // skills: solo slots no reservados
     const skillId = dt.getData("text/skill-id") || dt.getData("text/plain");
     if (!skillId) return;
   
     if (slot === 0 || slot === 5) return;
     e.preventDefault();
     dt.dropEffect = "move";
   });


  bar.addEventListener("dragenter", (e) => {
    const { slotEl, slot } = getSlotFromEvent(e);
    if (!slotEl) return;

    const dt = e.dataTransfer;
    if (!dt) return;

    // highlight solo si es un drop permitido
    const consumableId = dt.getData("text/consumable-id") || dt.getData("text/plain");

    if (consumableId) {
      if (slot !== 0) return;
      slotEl.classList.add("drag-over");
      return;
    }

    const skillId = dt.getData("text/skill-id") || dt.getData("text/plain");
    if (!skillId) return;

    if (slot === 0 || slot === 5) return;
    slotEl.classList.add("drag-over");
  });

  bar.addEventListener("dragleave", (e) => {
    const { slotEl } = getSlotFromEvent(e);
    if (!slotEl) return;
    slotEl.classList.remove("drag-over");
  });

  bar.addEventListener("drop", (e) => {
    const { slotEl, slot } = getSlotFromEvent(e);
    if (!slotEl) return;

    e.preventDefault();
    slotEl.classList.remove("drag-over");

    const dt = e.dataTransfer;
    if (!dt) return;

    ensureActionBar(state.player);

// 1) 🥘 Consumible comida -> slot 0
let consumableId = dt.getData("text/consumable-id") || dt.getData("text/plain");
if (consumableId) {
  if (slot !== 0) return;

  // opcional: validar que exista en inventario
  const n = countOwned(state.player, consumableId);
  if (n <= 0) {
    logBad("No tienes ese consumible en el inventario.");
    return;
  }

  state.player.actionBar[0] = { type: "consumable", id: consumableId };

  console.log("[slot0] actionBar[0] =", state.player.actionBar[0]);
  console.log("[slot0] ITEMS def =", ITEMS?.[consumableId]);
  console.log(
    "[slot0] inv match =",
    (state.player.inventory ?? []).find(it => it && ((it.type ?? it.id) === consumableId))
  );

  logOk("Consumible asignado al slot 0.");
  renderActionBar(state);
  return;
}


    // 2) 🌳 Skills (lo de siempre)
    const skillId = dt.getData("text/skill-id") || dt.getData("text/plain");
    if (!skillId) return;

    if (slot === 0 || slot === 5) return;

    const fromSlotRaw = dt.getData("text/from-slot");
    const fromSlot =
      fromSlotRaw !== "" && fromSlotRaw != null ? Number(fromSlotRaw) : null;

    // ✅ solo skills aprendidas
    const rank = state.player?.skills?.[skillId] ?? 0;
    if (rank <= 0) {
      logBad("Solo puedes asignar habilidades aprendidas.");
      return;
    }

    const barData = state.player.actionBar;

    // 🔁 HUD → HUD swap/move
    if (fromSlot != null && Number.isFinite(fromSlot) && fromSlot !== slot) {
      if (fromSlot === 0 || fromSlot === 5) return;

      const tmp = barData[slot];
      barData[slot] = { type: "skill", id: skillId };
      barData[fromSlot] = tmp ?? null;

      logOk("Habilidad movida/intercambiada.");
      renderActionBar(state);
      return;
    }

    // 🌳 Árbol → HUD
    const r = assignSkillToActionSlot(state.player, skillId, slot);
    if (!r.ok) {
      logBad("No se pudo asignar a ese slot.");
      return;
    }

    logOk(`Asignada a slot ${slot}.`);
    renderActionBar(state);
  });
}
