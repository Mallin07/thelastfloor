// js/ui/menu/menu_inventory.js
import { equipFromInventory } from "../../entities/inventory.js";
import { useItem, isFoodConsumable } from "../../entities/items.js";
import { ctx, openPanel, setHeaderMode } from "./menu_base.js";
import { renderSheet } from "./menu_sheet.js";

import { ITEMS } from "../../data/items_db.js";
import { getItemLevelClassFromItem } from "../item_level_ui.js"; 
import { ensureActionBar, renderActionBar } from "../../systems/actionbar_system.js";


export function openInventory(state){
  setHeaderMode("player");
  openPanel(ctx.panelInv);
  renderInventory(state);
}

export function renderInventory(state){
  const inv = state.player.inventory;
  ctx.invGrid.innerHTML = "";

  // --- Drag manual (estado local por render) ---
  let dragging = null; // { itemId, pointerId }
  let ghost = null;

  const makeGhost = (text) => {
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "fixed";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.transform = "translate(-9999px, -9999px)";
    el.style.zIndex = "999999";
    el.style.pointerEvents = "none";
    el.style.padding = "8px 10px";
    el.style.borderRadius = "12px";
    el.style.background = "rgba(10,16,36,.92)";
    el.style.border = "1px solid rgba(122,162,255,.35)";
    el.style.boxShadow = "0 10px 24px rgba(0,0,0,.35)";
    el.style.fontSize = "18px";
    document.body.appendChild(el);
    return el;
  };

  const moveGhost = (x, y) => {
    if (!ghost) return;
    ghost.style.transform = `translate(${x + 12}px, ${y + 12}px)`;
  };

  const cleanupDrag = () => {
    dragging = null;
    if (ghost){
      ghost.remove();
      ghost = null;
    }
    // quita highlight si lo pones en CSS (opcional)
    const slot0 = document.querySelector('.skill-slot[data-slot="0"]');
    if (slot0) slot0.classList.remove("is-drop-target");
  };

  const tryDropOnSlot0 = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    const slot0 = el?.closest?.('.skill-slot[data-slot="0"]');
    if (!slot0) return false;
  
    // ✅ Asignación directa al estado (tu arquitectura)
    state.player.actionBar ??= {};
    state.player.actionBar[0] = { type: "consumable", id: dragging.itemId };
  
    // ✅ garantiza estructura + repinta HUD
    ensureActionBar(state.player);
    renderActionBar(state);
  
    return true;
  };


  inv.forEach((item, idx)=>{
    const slot = document.createElement("div");
    slot.className = "inv-slot";

    if (item){
      const def = ITEMS[item.type] ?? item;

      slot.classList.add(getItemLevelClassFromItem(def));

      const qty = Number.isFinite(item.qty) ? item.qty : 1;
      const gold = (item.gold ?? item.value ?? item.price ?? def.value ?? 0);

      const name = def.name ?? item.name ?? "Objeto";
      const icon = def.icon ?? item.icon ?? "🎒";

      slot.dataset.tip = `${name}\n💰 ${gold} oro`;
      slot.title = `${name} — 💰 ${gold} oro`;
      const isImage = typeof icon === "string" && /\.(png|webp|jpg|jpeg|gif)$/i.test(icon);

      slot.innerHTML = isImage
        ? `<div class="icon"><img src="${icon}" alt="${name}"></div>`
        : `<div class="icon">${icon}</div>`;


      if (qty > 1){
        const badge = document.createElement("div");
        badge.className = "stack";
        badge.textContent = String(qty);
        slot.appendChild(badge);
      }

      // ✅ Drag manual: SOLO comida
      const isFood = isFoodConsumable(def) || isFoodConsumable(item);
      if (isFood){
        // (opcional) Mantén también el draggable nativo si algún día lo desbloqueas
        slot.draggable = false;
        slot.removeAttribute("draggable");

        slot.addEventListener("pointerdown", (e) => {
          // solo botón izquierdo
          if (e.button !== 0) return;

          const itNow = state.player.inventory[idx];
          if (!itNow) return;

          const defNow = ITEMS[itNow.type] ?? itNow;
          const itemId = itNow.type ?? defNow.id ?? defNow.type;
          if (!itemId) return;

          dragging = { itemId, pointerId: e.pointerId };
          ghost = makeGhost(icon);

          slot.setPointerCapture(e.pointerId);
          moveGhost(e.clientX, e.clientY);

          // evita seleccionar texto / otras cosas mientras arrastras
          e.preventDefault();
        });

        slot.addEventListener("pointermove", (e) => {
          if (!dragging || e.pointerId !== dragging.pointerId) return;

          moveGhost(e.clientX, e.clientY);

          // highlight visual opcional sobre slot0
          const el = document.elementFromPoint(e.clientX, e.clientY);
          const slot0 = el?.closest?.('.skill-slot[data-slot="0"]');
          const s0 = document.querySelector('.skill-slot[data-slot="0"]');
          if (s0){
            if (slot0) s0.classList.add("is-drop-target");
            else s0.classList.remove("is-drop-target");
          }
        });

        slot.addEventListener("pointerup", (e) => {
          if (!dragging || e.pointerId !== dragging.pointerId) return;

          tryDropOnSlot0(e.clientX, e.clientY);
          cleanupDrag();
        });

        slot.addEventListener("pointercancel", (e) => {
          if (!dragging || e.pointerId !== dragging.pointerId) return;
          cleanupDrag();
        });
      } else {
        slot.draggable = false;
        slot.removeAttribute("draggable");
      }

      // ✅ Doble click (equipar o usar)
      slot.addEventListener("dblclick", (e)=>{
        e.preventDefault();
        const itNow = state.player.inventory[idx];
        if (!itNow) return;

        const kind = itNow.kind ?? def.kind;

        if (kind === "gear"){
          equipFromInventory(state, idx);
          renderInventory(state);
          renderSheet(state);
          return;
        }

        const used = useItem(state, itNow);
        if (used){
          renderInventory(state);
          renderSheet(state);
        }
      });

      // ✅ Click derecho: usar también
      slot.addEventListener("contextmenu", (e)=>{
        e.preventDefault();
        const itNow = state.player.inventory[idx];
        if (!itNow) return;

        const used = useItem(state, itNow);
        if (used){
          renderInventory(state);
          renderSheet(state);
        }
      });

    } else {
      slot.dataset.tip = "";
      slot.innerHTML = `<div class="icon" style="opacity:.25">·</div>`;
      slot.draggable = false;
      slot.removeAttribute("draggable");
    }

    ctx.invGrid.appendChild(slot);
  });
}


