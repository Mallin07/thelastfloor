// js/ui/menu/menu_craft.js
import { ctx, openPanel, setHeaderMode } from "./menu_base.js";
import { ITEMS } from "../../data/items_db.js";
import { getItemLevelClass } from "../item_level_ui.js";

// DBs por profesión 
import { RECIPES as COOK_RECIPES } from "../../data/recipes/cook_recipes_db.js";
import { RECIPES as CARP_RECIPES } from "../../data/recipes/carp_recipes_db.js";
import { RECIPES as LEATHER_RECIPES } from "../../data/recipes/leather_recipes_db.js";
import { RECIPES as MAGE_RECIPES } from "../../data/recipes/mage_recipes_db.js";
import { FORGE_RECIPES } from "../../data/recipes/forge_recipes_db.js";

import { canMageCraft, mageCraftRecipe } from "../../entities/apps_npc/mage.js";
import { canCarpenterCraft, carpenterCraftRecipe } from "../../entities/apps_npc/carpenter.js";
import { canForge, forgeItem } from "../../entities/apps_npc/forge.js";
import { canLeatherCraft, leatherCraftRecipe } from "../../entities/apps_npc/leather.js";
import { canCook, cookRecipe } from "../../entities/apps_npc/cooking.js";

// ============================
// Categorías por oficio (panel izquierdo)
// ============================
export const CRAFT_CATEGORIES = {
  cook: {
    hunger: "Hambre",
    hp: "PH",
    mp: "PM",
    strength: "Fuerza",
    magic: "Magia",
    defense: "Defensa",
    mdef: "Defensa mágica",
  },

  carpenter: {
    bows: "Arcos",
    furniture: "Muebles",
    shields: "Escudos"
  },

  leather: {
    head: "Cabeza",
    body: "Cuerpo",
    feet: "Pies",
  },

  mage: {
    wands: "Varitas",
  },

  forge: {
    weapons: "Armas",
    armor: "Armaduras",
    shields: "Escudos",
    materials: "Materiales",
  },

};

// ============================
// Estado UI
// ============================
let selectedId = null;

// Estado de <details> por oficio
const openState = {
  cook: {},
  carpenter: {},
  leather: {},
  mage: {},
  forge: {},
};

// ============================
// API pública
// ============================
export function openCraft(state, craftType) {
  setHeaderMode("npc");
  openPanel(ctx.panelForge);

  // Título
  const h2 = ctx.panelForge?.querySelector?.("h2");
  if (h2) h2.textContent = titleFor(craftType);

  // Meta (reutilizamos forgeMeta para no tocar HTML)
  const gold = state.player?.gold ?? 0;
  const lvl = state.player?.lvl ?? 1;
  if (ctx.forgeMeta) ctx.forgeMeta.textContent = `Nivel: ${lvl} · Oro: ${gold}`;

  // Guardar tipo actual en el panel (para eventos)
  ctx.panelForge.__craftType = craftType;

  // Bind eventos una vez
  bindCraftEvents(state);

  // Selección inicial
  const visible = getVisibleRecipes(state, craftType);
  selectedId = visible.length ? visible[0].id : null;

  renderCraft(state, craftType);
}

export function renderCraft(state, craftType) {
  if (!ctx.panelForge) return;

  const recipes = getVisibleRecipes(state, craftType);
  const cats = CRAFT_CATEGORIES[craftType] || {};

  if (ctx.forgeList) ctx.forgeList.innerHTML = "";
  if (ctx.forgeDetail) ctx.forgeDetail.innerHTML = `<div class="muted">Selecciona una receta</div>`;

  if (!recipes.length) {
    if (ctx.forgeList) ctx.forgeList.innerHTML = `<div class="muted">No hay recetas disponibles.</div>`;
    return;
  }

  // asegurar selección válida
  if (!selectedId || !recipes.some(rr => rr.id === selectedId)) {
    selectedId = recipes[0].id;
  }

  // agrupar por categoría
  const grouped = groupByCategory(recipes);

  const sec = (key, title, bodyHtml) => `
    <details class="forge-sec" data-sec="${escapeAttr(key)}" ${isOpen(craftType, key) ? "open" : ""}>
      <summary class="forge-sec__sum">${escapeHtml(title)}</summary>
      <div class="forge-sec__body">${bodyHtml || `<div class="muted">Vacío</div>`}</div>
    </details>
  `;

  const listHtml = Object.entries(cats).map(([catKey, catLabel]) => {
    const list = grouped[catKey] || [];
    const rows = list.map(r => rowHtml(r, state)).join("");
    return sec(catKey, catLabel, rows);
  }).join("");

  // "Otros" si hay recetas con categorías no declaradas
  const declared = new Set(Object.keys(cats));
  const other = [];
  for (const [k, arr] of Object.entries(grouped)) {
    if (!declared.has(k)) other.push(...arr);
  }
  const otherHtml = other.length
    ? sec("other", "Otros", other.map(r => rowHtml(r, state)).join(""))
    : "";

  if (ctx.forgeList) ctx.forgeList.innerHTML = listHtml + otherHtml;

  // detalle derecha
  const r = recipes.find(x => x.id === selectedId) || recipes[0];
  selectedId = r.id;
  renderDetail(state, r, craftType);
}


// ============================
// Eventos (delegación) UNA VEZ
// ============================
function bindCraftEvents(state) {
  if (!ctx.forgeList || ctx.forgeList.__craftBound) return;
  ctx.forgeList.__craftBound = true;

  // Toggle <details>
  ctx.forgeList.addEventListener("toggle", (ev) => {
    const det = ev.target;
    if (!det || det.tagName !== "DETAILS") return;
    const key = det.getAttribute("data-sec");
    if (!key) return;

    const craftType = ctx.panelForge?.__craftType;
    if (!craftType) return;

    openState[craftType] = openState[craftType] || {};
    openState[craftType][key] = det.open;
  }, true);

  // Click receta
  ctx.forgeList.addEventListener("click", (ev) => {
    const el = ev.target?.closest?.("[data-recipe-id]");
    if (!el) return;
    const id = el.getAttribute("data-recipe-id");
    if (!id) return;

    selectedId = id;

    const craftType = ctx.panelForge?.__craftType;
    if (!craftType) return;

    renderCraft(state, craftType);
  });
}

// ============================
// Render helpers
// ============================
function rowHtml(r, state) {
  const check = canCraftByRequires(state, r);
  const locked = (check && !check.ok && (check.reason === "level" || check.reason === "quest"));
  const disabled = (check && !check.ok && (check.reason === "gold" || check.reason === "ingredients"));

  const lvlObj = Number.isFinite(r?.itemLevel) ? r.itemLevel : 0;
  const lvlClass = getItemLevelClass(lvlObj);

  const cls = [
    "cook-row",
    lvlClass,
    (r.id === selectedId) ? "is-active" : "",
    locked ? "is-locked" : "",
    disabled ? "is-disabled" : "",
  ].filter(Boolean).join(" ");

  return `
    <div class="${cls}" data-recipe-id="${escapeAttr(r.id)}">
      <div>
        <div><strong>${escapeHtml(r.icon ?? "🛠️")} ${escapeHtml(r.name ?? r.id)}</strong></div>
      </div>
    </div>
  `;
}

function renderDetail(state, r, craftType) {
  const resultItem = ITEMS?.[r.result?.type] ?? null;

  // ====== Ingredientes (para mostrar) ======
  const ingLines = (r.ingredients ?? []).map(ing => {
    const have = countHave(state, ing.type);
    const ok = have >= ing.qty;
    const nm = ITEMS?.[ing.type]?.name ?? ing.type;
    return `<div>${ok ? "✅" : "⛔"} ${escapeHtml(nm)}: ${have}/${ing.qty}</div>`;
  }).join("");

  // ====== Check "can" + reason ======
  let check = null;
  let can = true;
  let reason = "";


  if (craftType === "cook") {
    check = canCook(state, r.id);
    can = !!check?.ok;

  } else if (craftType === "mage") {
    check = canMageCraft(state, r.id);
    can = !!check?.ok;
  
  } else if (craftType === "carpenter") {
  check = canCarpenterCraft(state, r.id);
  can = !!check?.ok;

  } else if (craftType === "leather") {
    check = canLeatherCraft(state, r.id);
    can = !!check?.ok;

  } else if (craftType === "forge") {
    check = canForge(state, r.id);
    can = !!check?.ok;    
    
  } else {
    // Resto oficios: checker genérico (hasta que existan sus apps_npc)
    check = canCraftByRequires(state, r);
    can = !!check?.ok;
  }

  // Reason (común) — sirve para cook/mage/genérico si devuelven el mismo esquema
  if (!can) {
    if (check?.reason === "gold") reason = `Te falta oro (coste: ${r.costGold ?? 0}).`;
    else if (check?.reason === "ingredients") {
      const v = check.value;
      const nm = ITEMS?.[v.type]?.name ?? v.type;
      reason = `Falta: ${nm} (${v.have}/${v.need}).`;
    } else if (check?.reason === "level") reason = `Necesitas nivel ${check.value}.`;
    else if (check?.reason === "quest") reason = `Completa la misión: ${check.value}.`;
    else if (check?.reason === "missing") reason = `Receta no existe: ${r.id}.`;
    else reason = "No disponible todavía.";
  }

  // ====== Info del item resultado ======
  const infoBits = [];
  if (Number.isFinite(r.itemLevel)) infoBits.push(`Nv. objeto: ${r.itemLevel}`);
  if (resultItem?.slot) infoBits.push(`Slot: ${resultItem.slot}`);
  if (Number.isFinite(resultItem?.bonusAtk) && resultItem.bonusAtk !== 0) infoBits.push(`ATK +${resultItem.bonusAtk}`);
  if (Number.isFinite(resultItem?.defense) && resultItem.defense !== 0) infoBits.push(`DEF +${resultItem.defense}`);
  if (Number.isFinite(resultItem?.value)) infoBits.push(`Valor: ${resultItem.value} oro`);

  const infoHtml = infoBits.length
    ? `<div class="cook-small muted" style="margin-top:6px;">${infoBits.join(" · ")}</div>`
    : "";

  // ====== Render HTML ======
  if (ctx.forgeDetail) {
    ctx.forgeDetail.innerHTML = `
      <div><strong>${escapeHtml(r.icon ?? "🛠️")} ${escapeHtml(r.name ?? r.id)}</strong></div>
      ${infoHtml}
      <hr style="opacity:.15;margin:10px 0;" />
      <div><strong>Materiales</strong></div>
      ${ingLines || `<div class="muted">No requiere materiales</div>`}
      <hr style="opacity:.15;margin:10px 0;" />
      <div><strong>Coste</strong>: ${r.costGold ?? 0} oro</div>
      ${!can ? `<div class="cook-small" style="margin-top:6px;">⚠️ ${escapeHtml(reason)}</div>` : ""}
      <div class="cook-actions">
        <button id="btnForgeDo" ${can ? "" : "disabled"}>${actionLabelFor(craftType)}</button>
        <div class="cook-small muted">Se añadirá al inventario</div>
      </div>
    `;
  }

  // ====== Un solo handler (NO duplicar) ======
  const btn = document.getElementById("btnForgeDo");
  if (btn) {
    btn.onclick = () => {
      // 🍳 Cocina real
      if (craftType === "cook") {
        const ok = cookRecipe(state, r.id);
        if (ok) renderCraft(state, "cook");
        return;
      }

      // 🪄 Mago real (Opción A)
      if (craftType === "mage") {
        const ok = mageCraftRecipe(state, r.id);
        if (ok) renderCraft(state, "mage");
        return;
      }

      if (craftType === "carpenter") {
        const ok = carpenterCraftRecipe(state, r.id);
        if (ok) renderCraft(state, "carpenter");
        return;
      }

      if (craftType === "leather") {
        const ok = leatherCraftRecipe(state, r.id);
        if (ok) renderCraft(state, "leather");
        return;
      }      

      if (craftType === "forge") {
        const ok = forgeItem(state, r.id);
        if (ok) renderCraft(state, "forge");
        return;
      }      
    };
  }
}



// ============================
// Lógica de disponibilidad (igual filosofía que tus DBs)
// ============================
function canCraftByRequires(state, r) {
  // Regla: ocultamos bloqueadas por nivel/quest en la lista,
  // pero aquí calculamos también gold/ingredientes para deshabilitar el botón.
  const req = r.requires || {};
  const playerLvl = state.player?.lvl ?? 1;

  // Bloqueo duro: nivel / quest
  if (Number.isFinite(req.level) && playerLvl < req.level) {
    return { ok: false, reason: "level", value: req.level };
  }

  if (req.completedQuest) {
    const completed = !!state.quests?.completed?.[req.completedQuest];
    if (!completed) return { ok: false, reason: "quest", value: req.completedQuest };
  }

  // Oro
  const cost = r.costGold ?? 0;
  const gold = state.player?.gold ?? 0;
  if (gold < cost) return { ok: false, reason: "gold" };

  // Ingredientes
  for (const ing of (r.ingredients ?? [])) {
    const have = countHave(state, ing.type);
    if (have < ing.qty) {
      return { ok: false, reason: "ingredients", value: { type: ing.type, have, need: ing.qty } };
    }
  }

  return { ok: true };
}

// Oculta recetas bloqueadas por nivel/quest (como haces en herrería) :contentReference[oaicite:2]{index=2}
function getVisibleRecipes(state, craftType) {
  const all = getAllRecipes(craftType);
  return all.filter(r => {
    const check = canCraftByRequires(state, r);
    return !(check && !check.ok && (check.reason === "level" || check.reason === "quest"));
  });
}

function getAllRecipes(craftType) {
  let db = {};
  if (craftType === "cook") db = COOK_RECIPES;        // :contentReference[oaicite:3]{index=3}
  else if (craftType === "carpenter") db = CARP_RECIPES;
  else if (craftType === "leather") db = LEATHER_RECIPES;
  else if (craftType === "mage") db = MAGE_RECIPES;
  else if (craftType === "forge") db = FORGE_RECIPES;

  const arr = Object.values(db || {}).filter(r => r && r.id);

  // orden por itemLevel si existe, luego name/id
  arr.sort((a, b) => {
    const la = Number.isFinite(a.itemLevel) ? a.itemLevel : 0;
    const lb = Number.isFinite(b.itemLevel) ? b.itemLevel : 0;
    if (la !== lb) return la - lb;
    return String(a.name || a.id).localeCompare(String(b.name || b.id));
  });

  return arr;
}

// En tus recipes de herrería usas "group/subgroup" :contentReference[oaicite:4]{index=4}
// En cocina no tienes group, así que aquí soportamos ambas.
function groupByCategory(recipes) {
  const out = {};
  for (const r of recipes) {
    const k = String(r.group || r.category || "other");
    if (!out[k]) out[k] = [];
    out[k].push(r);
  }
  return out;
}

// ============================
// Inventario helpers
// ============================
function invQty(it) { return Number.isFinite(it?.qty) ? it.qty : (it ? 1 : 0); }

function countHave(state, type) {
  const inv = state.player?.inventory ?? [];
  let total = 0;
  for (const it of inv) if (it && it.type === type) total += invQty(it);
  return total;
}

// ============================
// UI text
// ============================
function titleFor(type) {
  switch (type) {
    case "cook": return "Cocina";
    case "carpenter": return "Carpintería";
    case "leather": return "Peletería";
    case "mage": return "Mago";
    case "forge": return "Herrería";
    default: return "Crafteo";
  }
}

function actionLabelFor(type) {
  switch (type) {
    case "cook": return "Cocinar";
    case "carpenter": return "Fabricar";
    case "leather": return "Tejer";
    case "mage": return "Crear";
    case "forge": return "Forjar";
    default: return "Crear";
  }
}

function isOpen(craftType, key) {
  openState[craftType] = openState[craftType] || {};
  if (typeof openState[craftType][key] !== "boolean") return true; // default abierto
  return openState[craftType][key];
}

// ============================
// Escape
// ============================
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll("`", "&#096;");
}
