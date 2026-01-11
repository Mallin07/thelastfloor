import { ctx, openPanel, setHeaderMode } from "./menu_base.js";

export function openSheet(state){
  setHeaderMode("player");
  openPanel(ctx.panelSheet);
  renderSheet(state);
}

export function renderSheet(state){
  const p = state.player;
  document.getElementById("sheetLvl").textContent = p.lvl;
  document.getElementById("sheetHp").textContent = `${p.hp}/${p.hpMax}`;
  document.getElementById("sheetAtk").textContent = p.atk;
  document.getElementById("sheetDef").textContent = p.def;
  document.getElementById("sheetGold").textContent = p.gold;

  const eq = p.equipment;
  setEq("eqHead", eq.head);
  setEq("eqChest", eq.chest);
  setEq("eqLegs", eq.legs);
  setEq("eqFeet", eq.feet);
  setEq("eqMain", eq.mainHand);
  setEq("eqOff", eq.offHand);
}

function setEq(id, item){
  document.getElementById(id).textContent =
    item ? `${item.icon ?? "✨"} ${item.name}` : "—";
}
