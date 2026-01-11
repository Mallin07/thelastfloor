// js/data/items/herrero_items.js.

export const HERRERO_QUESTS = {

// ---- QUEST 1 ----
a_por_piedra: {
  id: "a_por_piedra",
  title: "A por piedra",
  giverNpcId: "herrero",
  
  requires: { level: 3 },
  
  objective: {
    type: "deliver",
    item: "stone_ore",
    required: 2
  },
  rewards: { gold: 40, xp: 10 },
  text: {
    offer: [
      "En el segundo piso de la mazmorra puedes encontrar piedra,",
      "trae un par y haremos un lingote con ella."
    ],
    inProgress: (p, r) => `piedra: ${p}/${r}`,
    ready: "Nada mal para un principiante.",
    complete: "Sigue entrenando."
  }
},

// ---- QUEST 2 ----
lingote_piedra: {
  id: "lingote_piedra",
  title: "Aprende a forjar",
  giverNpcId: "herrero",

  requires: { 
    level: 4,
    completedQuests: ["a_por_piedra"]
  },

  objective: {
    type: "forge",
    item: "stone_ingot",
    required: 1
  },

  rewards: { gold: 40, xp: 10 },
  text: {
    offer: [
      "Prueva de hacer un lingote con dos piedras,",
      "seguro que no te cuesta nada."
    ],
    inProgress: (p, r) => `Lingote de piedra: ${p}/${r}`,
    ready: "Lo ves? Pan comido.",
    complete: "Sigue entrenando."
  }
},

// ---- QUEST 3 ----
primera_espada: {
  id: "primera_espada",
  title: "Mi primera espada",
  giverNpcId: "herrero",

  requires: { 
    level: 5,
    completedQuests: ["lingote_piedra"]
  },

  objective: {
    type: "forge",
    item: "stone_sword",
    required: 1
  },

  rewards: { gold: 40, xp: 10 },
  text: {
    offer: [
      "Los lingotes son más faciles de transportar que las piedras,",
      "además se usan para crear armas y equipo.",
      "Porqué no pruevas de hacer una espada chaval?",
    ],
    inProgress: (p, r) => `Espada de piedra: ${p}/${r}`,
    ready: "Dale fuego!",
    complete: "Nos vemos en la era del METAL!"
  }
}

}    