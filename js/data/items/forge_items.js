// js/data/items/forge_items.js.

export const FORGE_ITEMS = {

// ======= METERIALES =======

stone_ingot: {
  kind: "material",
  type: "stone_ingot",
  name: "Lingote de piedra",
  itemLevel: 1,
  icon: "🧱",
  value: 25
},

iron_ingot: {
  kind: "material",
  type: "iron_ingot",
  name: "Lingote de hierro",
  itemLevel: 1,
  icon: "🔩",
  value: 50
},

// ======= ESPADAS =======

stone_sword: {
  kind: "gear",           
  type: "stone_sword",
  slot: "mainHand",       
  name: "Espada de piedra",
  weaponType: "sword",
  itemLevel: 1,
  icon: "🗡️",
  bonusAtk: 2,          
  value: 60
},

// ======= CASCOS =======  

iron_helmet: {
  kind: "gear",
  type: "iron_helmet",
  slot: "head",
  name: "Casco de acero",
  icon: "🪖",
  defense: 2,
  value: 20
},

// ======= CUERPO=======

iron_armor: {
  kind: "gear",
  type: "iron_armor",
  slot: "chest",
  name: "Armadura de acero",
  icon: "🛡️",
  defense: 4,
  value: 180
},

// ======= BOTAS =======

iron_boots: {
  kind: "gear",
  type: "iron_boots",
  slot: "feet",
  name: "Botas de acero",
  icon: "🥾",
  defense: 2,
  value: 20
},




}