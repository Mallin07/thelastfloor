// ======================================================
// 🧵 PELETERÍA  (craft: "leather")
// ======================================================
//
// Categorías disponibles (group):
//
// "head"   → Cabeza (cascos, capuchas)
// "body"   → Cuerpo (armaduras)
// "feet"   → Pies (botas)
//
// Ejemplo:
// group: "head"
//
// ======================================================

export const RECIPES = {

//======CABEZA=========//  

leather_helmet: {
  id: "leather_helmet",
  name: "Casco de cuero",
  group: "head",        
  itemLevel: 1,
  icon: "🪖",
  result: { type: "leather_helmet", qty: 1 },
  costGold: 30,
  ingredients: [
    { type: "leather", qty: 1 }
  ],
  requires: { level: 1 }
},

//======CUERPO=========// 

leather_armor: {
  id: "leather_armor",
  name: "Armadura de cuero",
  group: "chest",
  itemLevel: 1,
  icon: "🛡️",
  result: { type: "leather_armor", qty: 1 },
  costGold: 50,
  ingredients: [
    { type: "leather", qty: 2 }
  ],
  requires: { level: 5 }
},

//======PIES========// 

leather_boots: {
  id: "leather_boots",
  name: "Botas de cuero",
  group: "feet",
  itemLevel: 1,
  icon: "🥾",
  result: { type: "leather_boots", qty: 1 },
  costGold: 30,
  ingredients: [
    { type: "leather", qty: 5 }
  ],
  requires: { level: 5 }
},


};
