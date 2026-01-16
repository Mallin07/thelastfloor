// ui/assets.js
function loadImage(src){
  const img = new Image();
  img.src = src;
  return img;
}

export const ASSETS = {
  // Entradas y salidas
  
  exit_back: loadImage("js/assets/entradas_y_salidas/exit_back.png"), // para "<"
  exit_next: loadImage("js/assets/entradas_y_salidas/exit_next.png"), // para ">"

  //suelo
  grass: [
    loadImage("js/assets/tiles/grass_1.png"),
    loadImage("js/assets/tiles/grass_2.png"),
    loadImage("js/assets/tiles/grass_3.png"),
  ],

  //caminos
  caminoV: loadImage("js/assets/tiles/caminov.png"),
  caminoH: loadImage("js/assets/tiles/caminoh.png"),

  // paredes

  wall: loadImage("js/assets/paredes_techos/pared_arbol2.png"),
  techo: loadImage("js/assets/paredes_techos/techo_arbol2.png"),
  
  // escenario

  arbol: loadImage("js/assets/tiles/arbol.png"),
  yerva1: loadImage("js/assets/tiles/yerva_1.png"),
  yerva2: loadImage("js/assets/tiles/yerva_2.png"),
  yerva3: loadImage("js/assets/tiles/yerva_3.png"),
  yerva4: loadImage("js/assets/tiles/yerva_4.png"),
  yerva5: loadImage("js/assets/tiles/yerva_5.png"),
  barro: loadImage("js/assets/tiles/barro_1.png"),
  flor1: loadImage("js/assets/tiles/flor_1.png"),
  flor2: loadImage("js/assets/tiles/flor_2.png"),
  piedra1: loadImage("js/assets/tiles/piedra_1.png"),
  piedra2: loadImage("js/assets/tiles/piedra_2.png"),
  piedra3: loadImage("js/assets/tiles/piedra_3.png"),
  tronco1: loadImage("js/assets/tiles/tronco_1.png"),
  tronco2: loadImage("js/assets/tiles/tronco_2.png"),
  tronco3: loadImage("js/assets/tiles/tronco_3.png"),

  // ruinas

  ruina01: loadImage("js/assets/ruinas/ruina_01.png"),
  ruina02: loadImage("js/assets/ruinas/ruina_02.png"),
  ruina03: loadImage("js/assets/ruinas/ruina_03.png"),
  ruina04: loadImage("js/assets/ruinas/ruina_04.png"),
  ruina05: loadImage("js/assets/ruinas/ruina_05.png"),
  ruina06: loadImage("js/assets/ruinas/ruina_06.png"),

  //edificios
  ayuntamiento: loadImage("js/assets/edificios/ayuntamiento.png"),
  gremio: loadImage("js/assets/edificios/gremio.png"),
  carpinteria: loadImage("js/assets/edificios/carpinteria.png"),
  herreria: loadImage("js/assets/edificios/herreria.png"),
  peleteria: loadImage("js/assets/edificios/peleteria.png"),
  restaurante: loadImage("js/assets/edificios/restaurante.png"),
  banco: loadImage("js/assets/edificios/banco.png"),
  fuente: loadImage("js/assets/edificios/fuente.png"),
  tienda: loadImage("js/assets/edificios/tienda.png"),
  taller: loadImage("js/assets/edificios/taller.png"),


  //personajes
  npc_herrero: loadImage("js/assets/personajes/herrero.png"),
  npc_carpintero: loadImage("js/assets/personajes/carpintero.png"),
  npc_maestro: loadImage("js/assets/personajes/maestro.png"),
  npc_peletero: loadImage("js/assets/personajes/peletero.png"),
  npc_banquero: loadImage("js/assets/personajes/banquero.png"),
  npc_cocinero: loadImage("js/assets/personajes/cocinero.png"),
  npc_vendedor: loadImage("js/assets/personajes/vendedor.png"),
  npc_mago: loadImage("js/assets/personajes/mago.png"),

  // enemigos
  enemy_slime: loadImage("js/assets/enemies/slime.png"),
  enemy_goblin: loadImage("js/assets/enemies/goblin.png"),
  enemy_wolf: loadImage("js/assets/enemies/wolf.png"),
  enemy_spider: loadImage("js/assets/enemies/spider.png"),
  enemy_grimmor: loadImage("js/assets/enemies/grimmor.png"),

  //objetos mapa
  seta_luminosa: loadImage("js/assets/materiales_mapa/seta_luminosa.png"),

  // animales
  animal_hare: loadImage("js/assets/animals/hare.png"),
};

function loadAnim(path, frames){
  return frames.map(f => {
    const img = new Image();
    img.src = `${path}/${f}`;
    return img;
  });
}

export const ATK_SLASH_01 = loadAnim(
  "js/assets/ataques/ataque_01",
  [
    "ataque1_1.png",
    "ataque1_2.png",
    "ataque1_3.png",
    "ataque1_4.png",
    "ataque1_5.png",
    "ataque1_6.png",
    "ataque1_7.png",
    "ataque1_8.png"
  ]
);

export const HERO_ANIMS = {
  down: loadAnim("js/assets/hero", ["down_011.png", "down_022.png", "down_033.png"]),
  up: loadAnim("js/assets/hero", ["up_011.png", "up_022.png", "up_033.png"]),
  left: loadAnim("js/assets/hero", ["left_011.png", "left_022.png", "left_033.png"  ]),
  right: loadAnim("js/assets/hero", ["right_011.png", "right_022.png", "right_033.png"]),
};

// ===============================
// animación habilidades (VFX)
// ===============================

//=========MAGO===========//

// 🔥 Fireball
export const FIREBALL = loadAnim(
  "./js/assets/vfx/fireball",
  [
    "fireball_01.png",
    "fireball_02.png",
    "fireball_03.png",
    "fireball_04.png",
  ]
);

//=========GUERRERO===========//

export const SLASH_HEAVY = loadAnim(
  "./js/assets/vfx/power_strike",
  [
    "power_strike_01.png",
    "power_strike_02.png",
    "power_strike_03.png",
    "power_strike_04.png",
    "power_strike_05.png",
  ]
);

//=========ARQUERO===========//

export const SHOOT_ARROW = loadAnim(
  "./js/assets/vfx/shoot_arrow",
  [
    "shoot_arrow.png",
  ]
);


