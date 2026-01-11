export const TOWN_01 = {
  id: "town_01",
  tiles: [
    "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
    "Y###########################################Y",
    "Y.........................GGGGGG.........Y",
    "Y.......EEEEEEEE.IIIIIIII.GGGGGG.........Y",
    "Y.......EEEEEEEE.IIIIIIII.GGGGGG.........Y",
    "Y.......EEEEEEEE.IIIIIIII.GGGGGG.........Y",
    "Y.......EEEEEEEE.IIIIIIII.GGGGGG.........Y",
    "Y.......EEEEEEEE.IIIIIIII.GGGGGG.........Y",
    "Y.......EEEEEEEE.IIIIIIII.GGGGGG.........Y",
    "Y...........k.......v........m...........Y",
    "Y...........==================...........Y",
    "Y........CCCCCC.....=.....BBBBBBBB.......Y",
    "Y........CCCCCC...=====...BBBBBBBB.......Y",
    "Y........CCCCCC...=.S.=.Z.BBBBBBBB.......Y",
    "Y........CCCCCC...=.>.=...BBBBBBBB.......Y",
    "Y........CCCCCC...=...=...BBBBBBBB.......Y",
    "Y........CCCCCC...=====...BBBBBBBB.......Y",
    "Y...........c.......=........b...........Y",
    "Y...........==================...........Y",
    "Y...RRRRRR.OOOOOOOO.=.PPPPPPPP...........Y",
    "Y...RRRRRR.OOOOOOOO.=.PPPPPPPP...........Y",
    "Y...RRRRRR.OOOOOOOO.=.PPPPPPPP...........Y",
    "Y...RRRRRR.OOOOOOOO.=.PPPPPPPP...........Y",
    "Y...RRRRRR.OOOOOOOO.=.PPPPPPPP...........Y",
    "Y...RRRRRR.OOOOOOOO.=.PPPPPPPP...........Y",
    "Y......h.......o....=.....p..............Y",
    "Y......=====================.............Y",
    "Y........................................Y",    
    "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
  ],
  npcs: [
    { id:"maestro", at:"m", dialog:["Buenos días!"] },
    { id:"herrero", at:"h", dialog:["¿Qué pasa chaval?"] },
    { id:"peletero", at:"p", dialog:["¿Tienes alguna piel para mi?"] },
    { id:"carpintero", at:"c", dialog:["Más madera!"] },
    { id:"cocinero", at:"k", dialog:["¿Qué tenemos para cocinar?"] },
    { id:"banquero", at:"b", dialog:["¿Buscando un seguro?"] },
    { id:"vendedor", at:"v", dialog:["¿Algún objeto perdido?"] },
    { id:"mago", at:"o", dialog:["La magia existe! "] },
    { id:"savepoint", at:"Z", dialog:["El cristal brilla suavemente..."] }
  ],

  animals: {},

  enemies: {},
  
  items: {},

  procgen: {},

  procDecor: { enabled: false, rules: [] },  

  exits: [
    { atChar: ">", to: "piso1", spawn: "S" }
  ],
  
  legend: {

    blocked: [
      "#", "Y",
      "A", "G", "C", "R", "P", "E", "B", "I", "O", "F",
      "h", "c", "m", "p", "k", "b", "v", "o"
    ],

    objects: {
      // edificios
      H: { kind: "house", w:2, h:2, asset: "house" },
      A: { kind: "ayuntamiento", w:11, h:7, asset: "ayuntamiento" },
      G: { kind: "gremio", w:6, h:7, asset: "gremio" },
      C: { kind: "carpinteria", w:6, h:6, asset: "carpinteria" },
      R: { kind: "herreria", w:6, h:6, asset: "herreria" },
      P: { kind: "peleteria", w:8, h:6, asset: "peleteria" },
      E: { kind: "restaurante", w:8, h:6, asset: "restaurante" },
      B: { kind: "banco", w:8, h:6, asset: "banco" },
      F: { kind: "fuente", w:8, h:6, asset: "fuente" },
      I: { kind: "tienda", w:8, h:6, asset: "tienda" },
      O: { kind: "taller", w:8, h:6, asset: "taller" },

      // NPCs
      h: { kind:"npc", asset:"npc_herrero" },
      c: { kind:"npc", asset:"npc_carpintero" },
      m: { kind:"npc", asset:"npc_maestro" },
      p: { kind:"npc", asset:"npc_peletero" },
      b: { kind:"npc", asset:"npc_banquero" },
      k: { kind:"npc", asset:"npc_cocinero" },
      v: { kind:"npc", asset:"npc_vendedor" },
      o: { kind:"npc", asset:"npc_mago" },

      // tiles simples
      "#": { asset:"wall" },
      "Y": { asset:"techo" },
      "T": { asset:"arbol" },
      "<": { asset:"exit_back" },
      ">": { asset:"exit_next" },
    },

    groundDeco: false,
  }
};
