// js/data/quests/cocinero_quest.js

export const COCINERO_QUESTS = {

// ---- QUEST 1 ----
mi_primera_comida: {
    id: "mi_primera_comida",
    title: "Mi primera comida",
    giverNpcId: "cocinero",
    
    requires: {
      level: 1,
    },
    
    objective: {
      type: "deliver",
      item: "mushroom",
      required: 1
    },
    
    rewards: { gold: 20, xp: 5 },
    
    text: {
      offer: [
       "¿Sabías que en la mazmorra puedes encontrar todo tipo de alimentos?",
       "Algunos te curan, otros solo llenan el estómago.",
       "Cocinar marca la diferencia.",
       "Trae una seta y te enseñaré a cocinarla."
     ],
      inProgress: (p, r) => `Seta: ${p}/${r}`,
      ready: "¡Esto estará muy rico!",
      complete: "Mira, aprende"
    }
},

// ---- QUEST 2 ----
cazando_liebres: {
    id: "cazando_liebres",
    title: "La caza de la liebre",
    giverNpcId: "cocinero",
    
    requires: {
      level: 2,
      completedQuest: "mi_primera_comida"
    },
    
    objective: {
      type: "deliver",
      item: "hare_meat",
      required: 1
    },
    
    rewards: { gold: 30, xp: 5 },
    
    text: {
      offer: [
       "A parte de setas en los primeros pisos de la mazmorra puedes encontrar liebres,",
       "aunque son más dificiles de atrapar",
       "Trae una y te enseñaré a cocinarla."
     ],
      inProgress: (p, r) => `Carne de liebre: ${p}/${r}`,
      ready: "¡Esto estará muy rico!",
      complete: "Mira, aprende"
    }
},

// ---- QUEST 3 ----
todo_a_la_olla: {
    id: "todo_a_la_olla",
    title: "Todo a la olla",
    giverNpcId: "cocinero",
    
    requires: {
      level: 4,
      completedQuests: ["mi_primera_comida", "cazando_liebres"]
    },
    
    objectives: [
      { type: "cook", item: "salteado_setas", required: 2 },
      { type: "cook", item: "liebre_parrilla", required: 2 }
    ],
    
    rewards: { gold: 30, xp: 5 },
    
    text: {
      offer: [
        "Mezclar alimentos suele mejorar las comidas.",
        "Pero antes de aprender a hacer guisos debes practicar.",
        "Cocina 2 salteados de setas y 2 liebres a la parrilla."
      ],
      inProgress: (prog, reqs) =>
        `Salteado de setas: ${prog.salteado_setas ?? 0}/${reqs.salteado_setas}\n` +
        `Liebre a la parrilla: ${prog.liebre_parrilla ?? 0}/${reqs.liebre_parrilla}`,
      ready: "¡Esto estará muy rico!",
      complete: "¡Perfecto! Ya estás listo para hacer guisos."
    }
},

}  