// js/systems/player_move_system.js
import { CONFIG } from "../core/config.js";
import { keys } from "../input/input.js";
import { isWallAtPx } from "../world/map.js";

function vecToDirStr(fx, fy){
  if (Math.abs(fx) > Math.abs(fy)) return fx > 0 ? "right" : "left";
  if (fy !== 0) return fy > 0 ? "down" : "up";
  return "down";
}

// ✅ apunta al enemigo más cercano y devuelve dir 4-way (x,y) o null si no hay ninguno en rango
function findNearestEnemyDir(state, maxDistPx){
  const p = state.player;
  const ents = state.entities;
  if (!(ents instanceof Map)) return null;

  let bestD2 = maxDistPx * maxDistPx;
  let bestDx = 0, bestDy = 0;
  let found = false;

  for (const e of ents.values()){
    if (e.kind !== "enemy") continue;
    const ex = e.px ?? 0;
    const ey = e.py ?? 0;

    const dx = ex - (p.px ?? 0);
    const dy = ey - (p.py ?? 0);
    const d2 = dx*dx + dy*dy;

    if (d2 < bestD2){
      bestD2 = d2;
      bestDx = dx;
      bestDy = dy;
      found = true;
    }
  }

  if (!found) return null;

  // 4-dir
  if (Math.abs(bestDx) > Math.abs(bestDy)) return { x: Math.sign(bestDx), y: 0 };
  return { x: 0, y: Math.sign(bestDy) };
}

export function updatePlayer(state, dt){
  if (state.dialog?.open) return;

  const p = state.player;
  const speed = CONFIG.SPEED;

  // input
  let ax = 0, ay = 0;
  if (keys.left) ax -= 1;
  if (keys.right) ax += 1;
  if (keys.up) ay -= 1;
  if (keys.down) ay += 1;

  // normaliza diagonal
  const len = Math.hypot(ax, ay) || 1;
  const mx = ax / len;
  const my = ay / len;

  const nx = p.px + mx * speed * dt;
  const ny = p.py + my * speed * dt;

  const now = performance.now();

  // ===============================
  // ✅ LOOK "grace" anti-flip (evita drop 1 frame)
  // ===============================
  p._lookHeldUntil ??= 0;
  if (keys.look) p._lookHeldUntil = now + 120; // ajusta 80..150ms si quieres
  const lookActive = keys.look || now < p._lookHeldUntil;

  // ===============================
  // ✅ FACING LOCK con LOOK (vector fijo mientras LOOK)
  //    - Mientras mantienes LOOK: re-apunta al enemigo más cercano (si hay)
  // ===============================
  p._facingLock ??= null;

  if (lookActive) {
    // ✅ mientras mantienes LOOK: re-apunta continuamente al enemigo más cercano
    const aim = findNearestEnemyDir(state, CONFIG.TILE * 4); // rango: 4 tiles

    if (aim) {
      p._facingLock = { x: aim.x, y: aim.y };
    } else {
      // si no hay enemigos en rango:
      // - si ya había lock, mantenlo
      // - si no había, crea uno con fallback
      if (!p._facingLock) {
        let fx = Math.sign(p.facingX || 0);
        let fy = Math.sign(p.facingY || 0);

        if (fx === 0 && fy === 0) {
          fx = Math.sign(mx || 0);
          fy = Math.sign(my || 0);
        }
        if (fx === 0 && fy === 0) fy = 1;

        p._facingLock = { x: fx, y: fy };
      }
    }

    p.facingX = p._facingLock.x;
    p.facingY = p._facingLock.y;
  } else {
    p._facingLock = null;

    if (mx !== 0 || my !== 0) {
      p.facingX = Math.sign(mx);
      p.facingY = Math.sign(my);
    }
  }

  // ===============================
  // ✅ LOOK persistente (dirección visual)
  //    - Con LOOK: siempre mira al lock
  //    - Sin LOOK: mira hacia donde se mueve
  // ===============================
  p.lookX ??= 0;
  p.lookY ??= 1;
  p.lookDirStr ??= "down";

  if (lookActive && p._facingLock) {
    p.lookX = p._facingLock.x;
    p.lookY = p._facingLock.y;
  } else if (mx !== 0 || my !== 0) {
    p.lookX = Math.sign(mx);
    p.lookY = Math.sign(my);
  }

  p.lookDirStr = vecToDirStr(p.lookX, p.lookY);


  // colisión separando ejes (paredes + enemigos/animales/items)
  if (!collidesWall(state, nx, p.py, p.r) && !collidesEntity(state, nx, p.py, p.r)) p.px = nx;
  if (!collidesWall(state, p.px, ny, p.r) && !collidesEntity(state, p.px, ny, p.r)) p.py = ny;

  // ===============================
  // ✅ ANIMACIÓN (bloqueo durante ataque)
  // ===============================
  p.anim ??= { dir: "down", frame: 0, time: 0 };
  const anim = p.anim;

  const moving = (mx !== 0 || my !== 0);
  const attacking = p.atkAnimUntil && now < p.atkAnimUntil;

  if (attacking) {
    if (p.atkDirStr) anim.dir = p.atkDirStr;
    else if (p.atkDir) anim.dir = vecToDirStr(p.atkDir.x, p.atkDir.y);
    else anim.dir = p.lookDirStr ?? anim.dir ?? "down";
  } else {
    anim.dir = p.lookDirStr ?? anim.dir ?? "down";
  }

  // frames caminar
  if (moving) {
    anim.time += dt;
    const frameTime = 0.12;
    if (anim.time >= frameTime) {
      anim.frame = (anim.frame + 1) % 3;
      anim.time = 0;
    }
  } else {
    anim.frame = 0;
    anim.time = 0;
  }
}

function collidesWall(state, px, py, r){
  return (
    isWallAtPx(state, px - r, py - r) ||
    isWallAtPx(state, px + r, py - r) ||
    isWallAtPx(state, px - r, py + r) ||
    isWallAtPx(state, px + r, py + r)
  );
}

function collidesEntity(state, px, py, r){
  const ents = state.entities;
  if (!(ents instanceof Map)) return false;

  for (const e of ents.values()){
    if (e.kind !== "enemy" && e.kind !== "animal" && e.kind !== "item") continue;

    const er = e.r ?? 12;
    const dx = (e.px ?? 0) - px;
    const dy = (e.py ?? 0) - py;
    const d2 = dx*dx + dy*dy;

    const min = r + er;
    if (d2 < min*min) return true;
  }

  return false;
}

// ✅ DASH: avanza 2 tiles “instantáneo” (por pasos para no atravesar colisiones)
// + cooldown
export function dash(state){
  const p = state.player;

  // --- COOLDOWN ---
  const now = performance.now();
  const cdMs = p.dashCooldownMs ?? 5000;          // ajusta a gusto (ms)
  p.nextDashAt ??= 0;

  if (now < p.nextDashAt) return false;          // aún en cooldown

  // bloquea el siguiente uso (aunque choque y no avance mucho)
  p.nextDashAt = now + cdMs;

  // --- MOVIMIENTO ---
  const TILE = CONFIG.TILE;

  let dx = Math.sign(p.facingX || 0);
  let dy = Math.sign(p.facingY || 0);

  if (dx === 0 && dy === 0) dy = 1;

  const dashDist = 2 * TILE;
  const step = 2;
  const steps = Math.ceil(dashDist / step);

  for (let i = 0; i < steps; i++){
    const nx = p.px + dx * step;
    const ny = p.py + dy * step;

    if (collidesWall(state, nx, ny, p.r)) break;
    if (collidesEntity(state, nx, ny, p.r)) break;

    p.px = nx;
    p.py = ny;
  }

  p.facingX = dx;
  p.facingY = dy;

  return true;
}

