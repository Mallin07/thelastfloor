// js/data/quests/peletero_quest.js

export const PELETERO_QUESTS = {

// ---- QUEST 1 ----
desoya_lobos: {
    id: "desoya_lobos",
    title: "Desoya lobos",
    giverNpcId: "peletero",
    
    requires: {
      level: 5,
    },
    
    objective: {
      type: "kill",
      target: "wolf",
      required: 5
    },
    
    rewards: { gold: 50, xp: 30 },
    
    text: {
      offer: [
        "¿Sabías que con cuero puedes hacer diferetnes objetos para defenderte?",
        "Puedes hacer, cascos, armaduras y botas.",
        "No te pongas tan contento todavía!.",
        "Para usar prendas de cuero necesitas obtener cuero.",
      ],
      inProgress: (p, r) => `Lobos  : ${p}/${r}`,
      ready: "¡Pense que no lo consegirías!",
      complete: "Has aprendido CASCO DE CUERO, ARMADURA DE CUERO, BOTAS DE CUERO."
    }
},

};