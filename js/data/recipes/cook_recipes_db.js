// js/data/cook_recipes_db.js

// ======================================================
// 🍳 COCINA  (craft: "cook")
// ======================================================
//
// Categorías disponibles (group):
//
// "hunger"    → Comida que reduce el hambre
// "hp"        → Comida que cura vida (PH)
// "mp"        → Comida que restaura maná (PM)
// "strength"  → Buff de fuerza
// "magic"     → Buff de magia
// "defense"   → Buff de defensa física
// "mdef"      → Buff de defensa mágica
//
// Ejemplo:
// group: "hunger"
//
// ======================================================

export const RECIPES = {

  seta_salteada: {
    id: "seta_salteada",
    name: "Salteado de setas",
    group: "hunger",            // ✅
    itemLevel: 1,
    icon: "🍲",
    result: { type: "salteado_setas", qty: 1 },
    costGold: 10,
    ingredients: [{ type: "mushroom", qty: 1 }],
    requires: {
      level: 1,
      completedQuest: "mi_primera_comida"
    }
  },

  liebre_parrilla: {
    id: "liebre_parrilla",
    name: "Liebre a la parrilla",
    group: "hunger",            // ✅
    itemLevel: 1,
    icon: "🍖",
    result: { type: "liebre_parrilla", qty: 1 },
    costGold: 10,
    ingredients: [{ type: "hare_meat", qty: 1 }],
    requires: {
      level: 2,
      completedQuest: "cazando_liebres"
    }
  },

  hare_stew: {
    id: "hare_stew",
    name: "Guiso de liebre",
    group: "hunger",            // ✅
    itemLevel: 1,
    icon: "🍲",
    result: { type: "hare_stew", qty: 1 },
    costGold: 20,
    ingredients: [
      { type: "hare_meat", qty: 1 },
      { type: "mushroom", qty: 1 }
    ],
    requires: {
      level: 4,
      completedQuest: "todo_a_la_olla"
    }
  }
};
