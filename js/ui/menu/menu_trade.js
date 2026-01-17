// js/ui/menu/menu_trade.js
import { ctx, openPanel, setHeaderMode } from "./menu_base.js";
import { getItemLevelClassFromItem } from "../item_level_ui.js";
import {
  addInvToSell,
  addInvToSellAll,
  removeSellToInv,
  removeSellToInvAll,
  commitSale,
  sellTotalGold,
  ensureSellBag
} from "../../entities/apps_npc/trade.js";

function renderGrid(el, slots, { onClick, onDblClick }){
  el.innerHTML = "";
  slots.forEach((item, idx) => {
    const slot = document.createElement("div");
    slot.className = "inv-slot";

    if (item){
      const qty = Number.isFinite(item.qty) ? item.qty : 1;
      const gold = (item.gold ?? item.value ?? item.price ?? 0);

      // color por nivel
      slot.classList.add(getItemLevelClassFromItem(item));

      slot.dataset.tip = `${item.name}\n💰 ${gold} oro`;
      slot.title = `${item.name} — 💰 ${gold} oro`;

      slot.innerHTML = `<div class="icon">${item.icon ?? "🎒"}</div>`;

      if (qty > 1){
        const badge = document.createElement("div");
        badge.className = "stack";
        badge.textContent = String(qty);
        slot.appendChild(badge);
      }

      // ⚠️ IMPORTANTE:
      // el dblclick dispara click antes, así que prevenimos efecto doble
      if (onClick){
        slot.addEventListener("click", (e) => {
          if (e.detail === 1) onClick(idx);
        });
      }

      if (onDblClick){
        slot.addEventListener("dblclick", (e) => {
          e.preventDefault();
          onDblClick(idx);
        });
      }
    } else {
      slot.dataset.tip = "";
      slot.innerHTML = `<div class="icon" style="opacity:.25">·</div>`;
    }

    el.appendChild(slot);
  });
}

function renderTotal(state){
  if (!ctx.tradeTotalGold) return;
  ctx.tradeTotalGold.textContent = `💰 ${sellTotalGold(state)} oro`;
}

export function renderTrade(state){
  const inv = state.player.inventory;
  const sellBag = ensureSellBag(state);

  // 🧺 Inventario jugador
  renderGrid(ctx.tradeInvGrid, inv, {
    onClick: (idx) => {
      if (addInvToSell(state, idx)) renderTrade(state);
    },
    onDblClick: (idx) => {
      if (addInvToSellAll(state, idx)) renderTrade(state);
    }
  });

  // 🏪 Bandeja de venta
  renderGrid(ctx.tradeSellGrid, sellBag, {
    onClick: (idx) => {
      if (removeSellToInv(state, idx)) renderTrade(state);
    },
    onDblClick: (idx) => {
      if (removeSellToInvAll(state, idx)) renderTrade(state);
    }
  });

  renderTotal(state);

  // Botón vender (bind solo una vez)
  if (ctx.btnSell && !ctx.btnSell._boundTrade){
    ctx.btnSell._boundTrade = true;
    ctx.btnSell.addEventListener("click", () => {
      if (commitSale(state)) renderTrade(state);
    });
  }
}

export function openTrade(state){
  setHeaderMode("npc");
  openPanel(ctx.panelTrade);
  renderTrade(state);
}
