// js/ui/music.js

let current = null;
let currentKey = null;

const tracks = {
  town_01: new Audio("js/assets/music/town_01.mp3"),
};

for (const t of Object.values(tracks)) {
  t.loop = true;
  t.volume = 0.4;
  t.preload = "auto";
}

function safePlay(a) {
  if (!a) return;
  a.play().catch(() => {
    // si el navegador bloquea, lo desbloqueamos en el próximo input
    queueUnlock();
  });
}

let unlockQueued = false;
function queueUnlock() {
  if (unlockQueued) return;
  unlockQueued = true;

  const unlock = () => {
    unlockQueued = false;
    if (currentKey) playMusic(currentKey);
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

export function playMusic(key) {
  if (!key) return;

  const track = tracks[key];
  if (!track) return;

  // si ya era la misma pista, solo reanuda
  if (currentKey === key) {
    current = track; // por si se quedó null por algo externo
    if (track.paused) safePlay(track);
    return;
  }

  // pausar anterior (sin reset)
  if (current && !current.paused) current.pause();

  current = track;
  currentKey = key;

  // NO resetea currentTime => sigue donde iba
  safePlay(track);
}

export function pauseMusic() {
  if (!current) return;
  current.pause(); // sin resetear
}

export function stopMusic() {
  if (!current) return;
  current.pause();
  current.currentTime = 0;
  current = null;
  currentKey = null;
}

export function setMusicVolume(v) {
  for (const t of Object.values(tracks)) t.volume = v;
}
