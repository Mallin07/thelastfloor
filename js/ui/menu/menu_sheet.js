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

  const eq = p.equipment ?? {};
  eq.offHands ??= [null, null];
  eq.activeOffHand ??= 0;

  setEq("eqHead", eq.head);
  setEq("eqChest", eq.chest);
  setEq("eqLegs", eq.legs);
  setEq("eqFeet", eq.feet);
  setEq("eqMain", eq.mainHand);

  // ✅ Mostrar ambas off-hands y marcar activa
  const offA = eq.offHands[0] ?? null;
  const offB = eq.offHands[1] ?? null;

  // Si no existe el segundo slot en el HTML, usamos el eqOff existente para mostrar la activa
  const hasOffA = document.getElementById("eqOffA");
  const hasOffB = document.getElementById("eqOffB");
  const hasOff  = document.getElementById("eqOff");

  if (hasOffA && hasOffB) {
    setEqActive("eqOffA", offA, eq.activeOffHand === 0);
    setEqActive("eqOffB", offB, eq.activeOffHand === 1);

    // Pista opcional si existe un elemento para ello
    const hint = document.getElementById("eqOffHint");
    if (hint) hint.textContent = "Pulsa F para cambiar";
  } else if (hasOff) {
    // fallback: si tu HTML solo tiene un Off-hand, mostramos el activo ahí
    const active = eq.offHands[eq.activeOffHand] ?? null;
    setEq("eqOff", active ? `${active.icon ?? "✨"} ${active.name}  (F)` : "—  (F)");
  }


}

function setEq(id, item){
  document.getElementById(id).textContent =
    item ? `${item.icon ?? "✨"} ${item.name}` : "—";
}

function setEqActive(id, item, isActive){
  const el = document.getElementById(id);
  if (!el) return;

  const txt = item ? `${item.icon ?? "✨"} ${item.name}` : "—";
  el.textContent = isActive ? `▶ ${txt}` : `  ${txt}`;
}
