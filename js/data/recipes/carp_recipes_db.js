// ======================================================
// 🪚 CARPINTERÍA  (craft: "carpenter")
// ======================================================
//
// Categorías disponibles (group):
//
// "bows"       → Arcos
// "furniture"  → Muebles / decoración
//
// Ejemplo:
// group: "bows"
//
// ======================================================

export const RECIPES = {


// =========ESCUDO========

escudo_madera: {
  id: "escudo_madera",
  name: "Escudo de madera",
  group: "shields",         
  itemLevel: 1,
  icon: "🛡️",
  result: { type: "wood_shield", qty: 1 },
  costGold: 15,
  ingredients: [{ type: "wood", qty: 2 }],
  requires: {
    completedQuest: "hay_que_protegerse"
  }
},

// ======= ARCOS =======

arco_madera: {
  id: "arco_madera",
  name: "Arco del roble",
  group: "bows",          // <- coincide con CRAFT_CATEGORIES.carpenter.bows
  itemLevel: 1,
  icon: "🏹",
  result: { type: "wood_bow", qty: 1 },
  costGold: 50,
  ingredients: [
    { type: "wood", qty: 2 },
    { type: "hilo", qty: 1 }
  ],
  requires: {
    completedQuest: "dispara_a_lo_lejos"
  }
},

// ======= MUEBLES =======

  //silla: {
  //  id: "silla",
  //  name: "Silla",
  //  group: "furniture",     // <- coincide con furniture
  //  itemLevel: 1,
  //  icon: "🪑",
  //  result: { type: "chair", qty: 1 },
  //  costGold: 20,
  //  ingredients: [{ type: "wood", qty: 3 }],
  //  requires: { level: 2 }
  //}
};
