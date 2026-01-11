// js/ui/menu/menu_base.js

export const ctx = {
  // overlay/base
  overlay: null, btnClose: null,
  btnSheet: null, btnInv: null, btnBank: null,

  // panels
  panelSheet: null, panelInv: null, panelBank: null, panelCook: null, panelForge: null,

  // grids
  invGrid: null, invGridBank: null, bankGrid: null,

  // cocina
  cookList: null, cookDetail: null, cookMeta: null,

  // herrería
  forgeList: null, forgeDetail: null, forgeMeta: null
};

let _bound = false;

export function bindMenuDom(){
  ctx.overlay   = document.getElementById("overlay");
  ctx.btnClose  = document.getElementById("btnClose");
  ctx.btnSheet  = document.getElementById("btnSheet");
  ctx.btnInv    = document.getElementById("btnInv");
  ctx.btnBank   = document.getElementById("btnBank"); // (en tu HTML no existe, ok)

  ctx.panelSheet = document.getElementById("panelSheet");
  ctx.panelInv   = document.getElementById("panelInv");
  ctx.panelBank  = document.getElementById("panelBank");
  ctx.panelCook  = document.getElementById("panelCook");
  ctx.panelForge = document.getElementById("panelForge");

  //banco
  ctx.invGrid     = document.getElementById("invGrid");
  ctx.invGridBank = document.getElementById("invGridBank");
  ctx.bankGrid    = document.getElementById("bankGrid");

  //cocina
  ctx.cookList   = document.getElementById("cookList");
  ctx.cookDetail = document.getElementById("cookDetail");
  ctx.cookMeta   = document.getElementById("cookMeta");

  //herrería
  ctx.forgeList   = document.getElementById("forgeList");   
  ctx.forgeDetail = document.getElementById("forgeDetail"); 
  ctx.forgeMeta   = document.getElementById("forgeMeta");

  //vendedor
  ctx.panelTrade = document.getElementById("panelTrade");
  ctx.tradeInvGrid = document.getElementById("tradeInvGrid");
  ctx.tradeSellGrid = document.getElementById("tradeSellGrid");
  ctx.tradeTotalGold = document.getElementById("tradeTotalGold");
  ctx.btnSell = document.getElementById("btnSell");

  _bound = true;
}

// Asegura que el DOM esté bindeado aunque initMenu aún no haya corrido
function ensureBound(){
  if (!_bound || !ctx.overlay) bindMenuDom();
}

export function hideAllPanels(){
  ensureBound();
  ctx.panelSheet?.classList.add("hidden");
  ctx.panelInv?.classList.add("hidden");
  ctx.panelBank?.classList.add("hidden");
  ctx.panelCook?.classList.add("hidden");
  ctx.panelForge?.classList.add("hidden");
  ctx.panelTrade?.classList.add("hidden");

}

export function openPanel(panelEl){
  ensureBound();
  openMenu();
  hideAllPanels();
  panelEl?.classList.remove("hidden");
}

export function setHeaderMode(mode){
  ensureBound();
  const npc = (mode === "npc");

  // Protegido: si no existen botones, no rompe
  if (ctx.btnSheet) ctx.btnSheet.style.display = npc ? "none" : "";
  if (ctx.btnInv)   ctx.btnInv.style.display   = npc ? "none" : "";
}

export function isMenuOpen(){
  ensureBound();
  return ctx.overlay && !ctx.overlay.classList.contains("hidden");
}

export function openMenu(){
  ensureBound();
  ctx.overlay?.classList.remove("hidden");
  ctx.overlay?.setAttribute("aria-hidden", "false");
}

export function closeMenu(){
  ensureBound();
  ctx.overlay?.classList.add("hidden");
  ctx.overlay?.setAttribute("aria-hidden", "true");
  hideAllPanels();
  setHeaderMode("player");
}

export function toggleMenu(){
  if (isMenuOpen()) closeMenu();
  else openMenu();
}

export function getActivePanel(){
  if (!ctx.overlay || ctx.overlay.classList.contains("hidden")) return null;

  if (ctx.panelSheet && !ctx.panelSheet.classList.contains("hidden")) return "sheet";
  if (ctx.panelInv   && !ctx.panelInv.classList.contains("hidden"))   return "inv";
  if (ctx.panelBank  && !ctx.panelBank.classList.contains("hidden"))  return "bank";
  if (ctx.panelCook  && !ctx.panelCook.classList.contains("hidden"))  return "cook";
  if (ctx.panelForge && !ctx.panelForge.classList.contains("hidden")) return "forge";
  if (ctx.panelTrade && !ctx.panelTrade.classList.contains("hidden")) return "trade";

  
  return null;
}
