// js/data/quests/maestro_quest.js

export const MAESTRO_QUESTS = {
  
// ---- QUEST 1 ----

kill_slimes_1: {
    id: "kill_slimes_1",
    title: "Limpia el sótano 1",
    giverNpcId: "maestro",
    
    requires: {
      level: 1,
    },
    
    objective: {
      type: "kill",
      target: "slime",
      required: 1
    },
    
    rewards: { gold: 30, xp: 5 },
    
    text: {
      offer: "Necesito que elimines 1 slime del sótano.",
      lockedLevel: lvl => `Necesitas ser nivel ${lvl}.`,
      lockedQuest: q => `Primero debes completar la misión "${q}".`,
      inProgress: (p, r) => `Progreso: ${p}/${r} slimes.`,
      ready: "Buen trabajo. Has demostrado disciplina.",
      complete: "Acepta esta recompensa."
    }
},

// ---- QUEST 2 ----

kill_slimes_3: {
    id: "kill_slimes_3",
    title: "Limpia el sótano",
    giverNpcId: "maestro",
    
    requires: {
      level: 2,
      completedQuest: "kill_slimes_1"
    },
    
    objective: {
      type: "kill",
      target: "slime",
      required: 3
    },
    
    rewards: { gold: 30, xp: 20 },
    
    text: {
      offer: "Necesito que elimines 3 slimes del sótano.",
      lockedLevel: lvl => `Necesitas ser nivel ${lvl}.`,
      lockedQuest: q => `Primero debes completar la misión "${q}".`,
      inProgress: (p, r) => `Progreso: ${p}/${r} slimes.`,
      ready: "Buen trabajo. Has demostrado disciplina.",
      complete: "Acepta esta recompensa."
    }
},

}