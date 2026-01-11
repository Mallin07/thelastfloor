// js/data/quests/mago_quest.js

export const MAGO_QUESTS = {

    // ---- QUEST 1 ----
alma_de_slime: {
    id: "alma_de_slime",
    title: "Recaudador de almas",
    giverNpcId: "mago",
    
    requires: {
      level: 3,
    },
    
    objectives: [
      { type: "deliver", item: "slime_soul", required: 5 },
    ],
    
    rewards: { gold: 35, xp: 10 },
    
    text: {
      offer: [
        "¿Sabías que al matar un slime puedes conseguir su alma?",
        "Es una gran fuente de energia para crear objetos mágicos.",
        "Si me traes 5 almas de slimes te enseñare como hacer una varita mágica."
      ],
      inProgress: (p, r) => `Alma de slime: ${p}/${r}`,
      ready: "¡Almas frescas!",
      complete: "Has aprendido VARITA DE ROBLE"
    }
},
};