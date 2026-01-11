//js/data/forge_recipes_db.js
export const FORGE_RECIPES = {

stone_ingot: {
  id: "stone_ingot",
  name: "Lingote de piedra",
  group: "materials",
  itemLevel: 1,
  icon: "🧱",
  result: { type: "stone_ingot", qty: 1},
  costGold: 30,
  ingredients: [
    { type: "stone_ore", qty: 2 }
  ],
    
  requires: {
   level: 3,
   completedQuest: "a_por_piedra"   
  }
},  

  
iron_ingot: {
  id: "iron_ingot",
  name: "Lingote de hierro",
  group: "materials",
  itemLevel: 1,
  icon: "🧱",
  result: { type: "iron_ingot", qty: 1},
  costGold: 30,
  ingredients: [
    { type: "iron_ore", qty: 2 }
  ],
  
  requires: {
   completedQuest: "a_por_hierro"   
  }
},  
 
stone_sword: {
  id: "stone_sword",
  name: "Espada de piedra",
  group: "swords",
  itemLevel: 1,
  icon: "🗡️",
  result: { type: "stone_sword", qty: 1 },
  costGold: 30,
  ingredients: [
    { type: "stone_ingot", qty: 2 }
  ],

  requires: {
    level: 4,
    completedQuest: "lingote_piedra"
  }
},

//---------------------------------------------------------------------------- 
iron_armor: {
  id: "iron_armor",
  name: "Armadura de hierro",
  group: "armor",
  subgroup: "chest",
  itemLevel: 1,
  icon: "🛡️",
  result: { type: "iron_armor", qty: 1 },
  costGold: 50,
  ingredients: [
    { type: "iron_ingot", qty: 4 }
  ],
  
  requires: {
    level: 50
  }
}
};
