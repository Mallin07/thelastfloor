// ======================================================
// 🪄 MAGO / ENCANTADOR  (craft: "mage")
// ======================================================
//
// Categorías disponibles (group):
//
// "wands"  → Varitas mágicas
//
// Ejemplo:
// group: "wands"
//
// ======================================================

// ======= ESPADAS =======

export const RECIPES = {
  varita_roble: {
    id: "varita_roble",
    name: "Varita de roble",
    group: "wands",
    itemLevel: 1,
    icon: "🪄",
    result: { type: "oak_wand", qty: 1 },
    costGold: 30,
    ingredients: [{ type: "wood", qty: 2 }, { type: "slime_soul", qty: 1 }],
    requires: { completedQuest: "alma_de_slime" }
  }
};
