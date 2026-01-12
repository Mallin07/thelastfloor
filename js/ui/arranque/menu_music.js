// js/ui/menu_music.js
let audio = null;

export function initMenuMusic() {
  if (audio) return audio;

  audio = new Audio("js/assets/music/thelastfloor_intro.mp3");
  audio.loop = true;
  audio.volume = 0.5;
  audio.preload = "auto";
  return audio;
}

export async function playMenuMusic() {
  initMenuMusic();
  try {
    await audio.play();
  } catch (e) {
    // Si algún navegador lo bloquea, no rompemos nada
    console.warn("Autoplay bloqueado, necesita interacción:", e);
  }
}

export function stopMenuMusic() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

export function setMenuMusicVolume(v) {
  initMenuMusic();
  audio.volume = Math.max(0, Math.min(1, v));
}
