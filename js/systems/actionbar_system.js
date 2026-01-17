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
  const inv = player?.inventory ?? [];
  let total = 0;

  for (const it of inv) {
    if (!it) continue;
    const id = it.type ?? it.id ?? it.itemId;
    if (id !== itemId) continue;

    const q = Number.isFinite(it.qty) ? it.qty : (Number.isFinite(it.count) ? it.count : 1);
    total += q;
  }

  const bag = player?.consumables ?? {};
  total += Number.isFinite(bag[itemId]) ? bag[itemId] : 0;

  return total;
}

function renderEquipHud(state){
  const p = state.player;
  const eq = p.equipment ?? {};
  eq.offHands ??= [null, null];
  eq.activeOffHand ??= 0;

  const hud = document.getElementById("equipHud");
  if (!hud) return;

  const slots = hud.querySelectorAll(".equip-slot");
  for (const s of slots){
    const i = Number(s.dataset.off);
    const item = eq.offHands[i] ?? null;

    s.classList.toggle("is-active", i === (eq.activeOffHand ?? 0));

    const iconWrap = s.querySelector(".equip-icon");
    if (!iconWrap) continue;

    iconWrap.innerHTML = "";
    const icon = (item?.icon ?? "").trim();

    if (!icon){
      iconWrap.textContent = "·";
      iconWrap.style.opacity = "0.35";
      continue;
    }

    iconWrap.style.opacity = "1";

    const isImg = /\.(png|webp|jpg|jpeg|gif)$/i.test(icon);
    if (!isImg){
      iconWrap.textContent = icon; // emoji
      continue;
    }

    const img = document.createElement("img");
    img.src = icon.includes("/") ? icon : `img/items/${icon}`;
    img.alt = item?.name ?? "offhand";
    iconWrap.appendChild(img);
  }
}

export function useActionSlot(state, slot) {
  const p = state.player;

  ensureActionBar(p);

  console.log("[useActionSlot] slot =", slot, "entry =", p.actionBar?.[slot]);

  if (slot === 5) {
    attack(state);
    return { ok: true };
  }

  const entry = p.actionBar?.[slot];
  if (!entry) {
    logBad("Ese slot está vacío.");
    return { ok: false, reason: "empty_slot" };
  }

  if (entry.type === "basic_attack") {
    attack(state);
    return { ok: true };
  }

  if (entry.type === "skill") {
    const r = useSkill(state, entry.id);
    if (!r.ok) logBad(humanCastFail(r));
    return r;
  }

  if (entry.type === "consumable") {
    const ok = useItemById(state, entry.id);

    const left = countOwned(p, entry.id);
    if (
      left <= 0 &&
      p.actionBar?.[0]?.type === "consumable" &&
      p.actionBar[0]?.id === entry.id
    ) {
      p.actionBar[0] = null;
    }

    renderActionBar(state);
    return { ok };
  }

  logBad("Acción desconocida.");
  return { ok: false, reason: "unknown_action" };
}

export function ensureActionBar(p) {
  p.actionBar ??= {};
  for (let i = 0; i <= 9; i++) if (!(i in p.actionBar)) p.actionBar[i] = null;

  p.actionBar[5] = { type: "basic_attack" };
}

/** Devuelve el primer slot libre permitido (1-4,6-9) o null. */
export function findFirstFreeActionSlot(p) {
  ensureActionBar(p);
  for (const i of ACTIONBAR_FREE_SLOTS) {
    if (p.actionBar[i] == null) return i;
  }
  return null;
}

/** Devuelve el índice del slot donde está esa skill, o null si no está. */
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

  const prev = findSkillInActionBar(p, skillId);
  if (prev != null && prev !== slot) p.actionBar[prev] = null;

  p.actionBar[slot] = { type: "skill", id: skillId };
  return { ok: true, slot };
}

/** Auto-asigna una skill recién aprendida (rank 1) al primer slot libre. */
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

  const el = document.getElementById("slot0Count");
  if (el) {
    const entry0 = p.actionBar?.[0];
    const n = entry0?.type === "consumable" ? countOwned(p, entry0.id) : 0;
    el.textContent = String(n);
  }

  // ✅ Bind Drag & Drop SOLO cuando #actionBar exista de verdad
  const bar = document.getElementById("actionBar");
  if (!bar) return; // ✅ salida segura
  
  if (!bar.dataset.dndBound) {
    bindHudActionBarDnD(state);
    bar.dataset.dndBound = "1";
  }
  
  const buttons = bar.querySelectorAll(".skill-slot");

  buttons.forEach((btn) => {
    const slot = Number(btn.dataset.slot);
    const labelEl = btn.querySelector(".label");
    const iconEl = btn.querySelector("img.icon");
  
    // 1️⃣ Validar primero
    if (!labelEl || !iconEl || !Number.isFinite(slot)) return;
  
    // 2️⃣ Bloquear drag nativo de la imagen (CLAVE)
    iconEl.draggable = false;
    iconEl.addEventListener("dragstart", (ev) => ev.preventDefault());
  
    // 3️⃣ Resetear drag del botón por defecto
    btn.draggable = false;
    btn.ondragstart = null;

    const setIcon = (src) => {
      if (src) btn.style.backgroundImage = `url("${src}")`;
      else btn.style.backgroundImage = "";
    };

    const resolveSrc = (s) => {
      if (!s) return "";
      if (s.startsWith("http") || s.startsWith("data:")) return s;
      if (s.includes("/")) return s;
      return `img/items/${s}`;
    };

    btn.querySelector(".emoji-icon")?.remove();
    iconEl.style.display = "none";
    setIcon("");

    if (slot === 5) {
      labelEl.textContent = "Básico";
      setIcon(ICONS.basic_attack);
      return;
    }

    if (slot === 0) {
      const entry0 = p.actionBar?.[0];
      labelEl.textContent = "";
      if (!entry0 || entry0.type !== "consumable") return;

      let def0 = ITEMS?.[entry0.id];
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

      setIcon(resolveSrc(icon0));
      return;
    }

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

        // ✅ NUEVO: payload único
        e.dataTransfer.setData(
          "application/x-actionbar",
          JSON.stringify({ kind: "skill", id: entry.id, fromSlot: slot })
        );

        // (Opcional) legacy compatibility
        e.dataTransfer.setData("text/skill-id", entry.id);
        e.dataTransfer.setData("text/from-slot", String(slot));
      };
      return;
    }

    if (entry.type === "consumable") {
      const def = ITEMS?.[entry.id];
      labelEl.textContent = def?.name ?? entry.id;

      const icon = (def?.icon ?? "").trim();
      if (icon) setIcon(resolveSrc(icon));
      else setIcon("");

      return;
    }

    labelEl.textContent = entry.type;
    setIcon("");
  });

  renderEquipHud(state);
}

// ✅ Drag & Drop: payload único application/x-actionbar
export function bindHudActionBarDnD(state) {
  const bar = document.getElementById("actionBar");
  if (!bar) return;

  const getSlotFromEvent = (e) => {
    const slotEl = e.target?.closest?.(".skill-slot");
    if (!slotEl) return { slotEl: null, slot: null };
    const slot = Number(slotEl.dataset.slot);
    if (!Number.isFinite(slot)) return { slotEl: null, slot: null };
    return { slotEl, slot };
  };

  // ✅ Lee el payload nuevo; si no existe, usa legacy sin tocar text/plain
  const readActionbarPayload = (dt) => {
    if (!dt) return null;

    const raw = dt.getData("application/x-actionbar");
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }

    // legacy: skill
    const skillId = dt.getData("text/skill-id");
    if (skillId) {
      const fromSlotRaw = dt.getData("text/from-slot");
      const fromSlot = fromSlotRaw !== "" && fromSlotRaw != null ? Number(fromSlotRaw) : null;
      return { kind: "skill", id: skillId, fromSlot: Number.isFinite(fromSlot) ? fromSlot : null };
    }

    // legacy: consumable
    const consumableId = dt.getData("text/consumable-id");
    if (consumableId) return { kind: "consumable", id: consumableId };

    return null;
  };

  bar.addEventListener("dragover", (e) => {
    const { slotEl, slot } = getSlotFromEvent(e);
    if (!slotEl) return;
  
    const dt = e.dataTransfer;
    if (!dt) return;
  
    // 🔑 CLAVE: algunos navegadores no dejan leer getData() aquí,
    // pero SIEMPRE permiten leer dt.types
    const types = Array.from(dt.types || []);
  
    const isActionbar = types.includes("application/x-actionbar");
    const isLegacySkill = types.includes("text/skill-id");
  
    // ✅ Skills → slots permitidos
    if ((isActionbar || isLegacySkill) && slot !== 0 && slot !== 5) {
      e.preventDefault();              // ⬅️ ESTO QUITA EL 🚫
      dt.dropEffect = "move";
      return;
    }
  
    // (si en el futuro usas DnD nativo para consumibles)
    const isLegacyConsumable = types.includes("text/consumable-id");
    if (isLegacyConsumable && slot === 0) {
      e.preventDefault();
      dt.dropEffect = "copy";
    }
  });


  bar.addEventListener("dragenter", (e) => {
    const { slotEl, slot } = getSlotFromEvent(e);
    if (!slotEl) return;

    const data = readActionbarPayload(e.dataTransfer);
    if (!data) return;

    if (data.kind === "consumable") {
      if (slot !== 0) return;
      slotEl.classList.add("drag-over");
      return;
    }

    if (data.kind === "skill") {
      if (slot === 0 || slot === 5) return;
      slotEl.classList.add("drag-over");
    }
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

    ensureActionBar(state.player);

    const data = readActionbarPayload(e.dataTransfer);
    if (!data) return;

    // 1) 🥘 Consumible -> slot 0
    if (data.kind === "consumable") {
      if (slot !== 0) return;

      const n = countOwned(state.player, data.id);
      if (n <= 0) {
        logBad("No tienes ese consumible en el inventario.");
        return;
      }

      state.player.actionBar[0] = { type: "consumable", id: data.id };
      logOk("Consumible asignado al slot 0.");
      renderActionBar(state);
      return;
    }

    // 2) 🌳 Skill
    if (data.kind === "skill") {
      const skillId = data.id;
      if (!skillId) return;
      if (slot === 0 || slot === 5) return;

      const rank = state.player?.skills?.[skillId] ?? 0;
      if (rank <= 0) {
        logBad("Solo puedes asignar habilidades aprendidas.");
        return;
      }

      const barData = state.player.actionBar;

      // 🔁 HUD -> HUD swap/move
      if (data.fromSlot != null && Number.isFinite(data.fromSlot) && data.fromSlot !== slot) {
        const fromSlot = data.fromSlot;
        if (fromSlot === 0 || fromSlot === 5) return;

        const tmp = barData[slot];
        barData[slot] = { type: "skill", id: skillId };
        barData[fromSlot] = tmp ?? null;

        logOk("Habilidad movida/intercambiada.");
        renderActionBar(state);
        return;
      }

      // 🌳 Árbol -> HUD
      const r = assignSkillToActionSlot(state.player, skillId, slot);
      if (!r.ok) {
        logBad("No se pudo asignar a ese slot.");
        return;
      }

      logOk(`Asignada a slot ${slot}.`);
      renderActionBar(state);
    }
  });
}
