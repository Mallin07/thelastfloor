import { depositToBank, withdrawFromBank } from "../../entities/apps_npc/bank.js";
import { ctx, openPanel, setHeaderMode } from "./menu_base.js";
import { getItemLevelClassFromItem } from "../item_level_ui.js"; 

const BANK_SIZE = 40;

function ensureBank(state){
  if (!Array.isArray(state.player.bank)) state.player.bank = Array(BANK_SIZE).fill(null);
  else if (state.player.bank.length < BANK_SIZE){
    state.player.bank = state.player.bank.concat(Array(BANK_SIZE - state.player.bank.length).fill(null));
  }
  return state.player.bank;
}

export function openBank(state){
  setHeaderMode("npc");
  openPanel(ctx.panelBank);
  renderBank(state);
}

function renderGrid(el, slots, onClick){
  el.innerHTML = "";

  slots.forEach((item, idx)=>{
    const slot = document.createElement("div");
    slot.className = "inv-slot";

    if (item){
      const qty = Number.isFinite(item.qty) ? item.qty : 1;
      const gold = (item.gold ?? item.value ?? item.price ?? 0);

      // 🔹 aplicar color por nivel (GLOBAL)
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

      slot.addEventListener("click", ()=>onClick(idx));
    } else {
      // slot vacío
      slot.dataset.tip = "";
      slot.innerHTML = `<div class="icon" style="opacity:.25">·</div>`;
    }

    el.appendChild(slot);
  });
}


export function renderBank(state){
  const inv = state.player.inventory;
  const bank = ensureBank(state);

  renderGrid(ctx.invGridBank, inv, (idx)=>{
    if (depositToBank(state, idx)) renderBank(state);
  });

  renderGrid(ctx.bankGrid, bank, (idx)=>{
    if (withdrawFromBank(state, idx)) renderBank(state);
  });
}
