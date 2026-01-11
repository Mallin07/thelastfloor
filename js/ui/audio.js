// js/ui/audio.js

const DEFAULT_VOLUME = 0.6;
const POOL_SIZE = 6;

/**
 * Crea un pool de audios para permitir solapamiento
 */
function createPool(src, volume = DEFAULT_VOLUME) {
  const pool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = volume;
    pool.push(a);
  }
  return { pool, index: 0 };
}

const sounds = {
  // Combate
  playerAttack: createPool("js/assets/sfx/player_attack.ogg"),
  enemyAttack: createPool("js/assets/sfx/enemy_attack.ogg"),
  enemyDie: createPool("js/assets/sfx/enemy_die.ogg"),

  // Oficios / NPCs
  forge:        createPool("js/assets/sfx/oficios/herrero.ogg"),
  cook:         createPool("js/assets/sfx/oficios/cocina.ogg"),
  craft_wood:   createPool("js/assets/sfx/oficios/carpintero.ogg"),
  leatherwork:  createPool("js/assets/sfx/oficios/peleteria.ogg"),
  enchant:      createPool("js/assets/sfx/oficios/mago.ogg"),
  trade:        createPool("js/assets/sfx/oficios/tienda.ogg"),
  //bank:        createPool("js/assets/sfx/bank.ogg"),
  //savepoint:   createPool("js/assets/sfx/savepoint.ogg"),
  //learn:       createPool("js/assets/sfx/learn.ogg"),

};

/**
 * Reproduce un sonido por nombre
 */
export function playSound(name, { volume = null } = {}) {
  const entry = sounds[name];
  if (!entry) return;

  const audio = entry.pool[entry.index];
  entry.index = (entry.index + 1) % entry.pool.length;

  audio.pause();
  audio.currentTime = 0;
  if (volume !== null) audio.volume = volume;

  audio.play().catch(() => {});
}

/**
 * Cambia volumen global
 */
export function setSfxVolume(v) {
  for (const entry of Object.values(sounds)) {
    for (const a of entry.pool) {
      a.volume = v;
    }
  }
}
