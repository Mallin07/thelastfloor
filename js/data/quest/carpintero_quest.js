// js/data/quests/carpintero_quest.js

export const CARPINTERO_QUESTS = {

// ---- QUEST 1 ----
hay_que_protegerse: {
    id: "hay_que_protegerse",
    title: "Hay que protegerse",
    giverNpcId: "carpintero",
    
    requires: {
      level: 1,
    },
    
    objective: {
      type: "deliver",
      item: "wood",
      required: 2
    },
    
    rewards: { gold: 20, xp: 5 },
    
    text: {
      offer: [
       "No se como tienes valor de entrar así a la mazmorra muchacho,",
       "deberías protegerte un poco.",
       "Porqué no vas a por un par de trozos de madera,",
       "y te enseño a hacer un escudo."
     ],
      inProgress: (p, r) => `Madera: ${p}/${r}`,
      ready: "¡Espero que no hayas sufrido mucho!",
      complete: "Has obtenido receta ESCUDO DE MADERA"
    }
},

// ---- QUEST 2 ----
dispara_a_lo_lejos: {
    id: "dispara_a_lo_lejos",
    title: "Dispara a lo lejos",
    giverNpcId: "carpintero",
    
    requires: {
      completedQuest: "hay_que_protegerse"
    },
    
    objectives: [
      { type: "deliver", item: "wood", required: 2 },
      { type: "deliver", item: "hilo", required: 1 }
    ],
    
    rewards: { gold: 20, xp: 5 },
    
    text: {
      offer: [
       "A veces no basta con un escudo para enemigos muy peligros",
       "si te encuentras con uno es mejor disparar desde lejos.",
       "Si me traes X te eneñaré a hacer un arco.",
     ],
      inProgress: (prog, reqs) =>
        `Madera: ${prog.wood ?? 0}/${reqs.wood}\n` +
        `Hilo: ${prog.hilo ?? 0}/${reqs.hilo}`,
      ready: "¡Bien hecho muchacho!",
      complete: "Has obtenido receta ARCO DE ROBLE"
    }
},
};
