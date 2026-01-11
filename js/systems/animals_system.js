// js/entities/animals.js
import { CONFIG } from "../core/config.js";
import { key } from "../core/utils.js";
import { isWallAtPx } from "../world/map.js";

function dist2(ax, ay, bx, by){ const dx=ax-bx, dy=ay-by; return dx*dx + dy*dy; }

function collidesPx(state, px, py, r){
  return (
    isWallAtPx(state, px - r, py - r) ||
    isWallAtPx(state, px + r, py - r) ||
    isWallAtPx(state, px - r, py + r) ||
    isWallAtPx(state, px + r, py + r)
  );
}

function tileFromPx(px){ return Math.floor(px / CONFIG.TILE); }
function ensureXY(ent){
  if (ent.x == null) ent.x = tileFromPx(ent.px);
  if (ent.y == null) ent.y = tileFromPx(ent.py);
}

function rekeyEntityIfNeeded(state, ent, oldKey){
  ensureXY(ent);
  const nx = tileFromPx(ent.px), ny = tileFromPx(ent.py);
  if (ent.x === nx && ent.y === ny) return oldKey;

  const newKey = key(nx, ny);
  const occupant = state.entities.get(newKey);
  if (occupant && occupant !== ent) return oldKey;

  state.entities.delete(oldKey);
  ent.x = nx; ent.y = ny;
  state.entities.set(newKey, ent);
  return newKey;
}

function moveTowardPoint(state, ent, tx, ty, dt, speedMul){
  const dx = tx - ent.px;
  const dy = ty - ent.py;
  const len = Math.hypot(dx, dy) || 1;

  const speed = CONFIG.SPEED * speedMul;
  const vx = (dx / len) * speed;
  const vy = (dy / len) * speed;

  const nx = ent.px + vx * dt;
  const ny = ent.py + vy * dt;
  const r = ent.r ?? 10;

  if (!collidesPx(state, nx, ent.py, r)) ent.px = nx;
  if (!collidesPx(state, ent.px, ny, r)) ent.py = ny;
}

function randRange(rng, a, b){ return a + (b-a)*rng(); }

function pickWanderTarget(state, a, now){
  const r = a.r ?? 10;

  // ✅ ahora wander siempre alrededor del home ACTUAL (que puede cambiar tras huir)
  const baseX = (a.homePx ?? a.px);
  const baseY = (a.homePy ?? a.py);

  for (let i=0;i<12;i++){
    const ang = randRange(state.rng, 0, Math.PI*2);
    const rad = randRange(state.rng, 0.2, 1.0) * (a.wanderRadiusPx ?? (CONFIG.TILE*3));
    const tx = baseX + Math.cos(ang)*rad;
    const ty = baseY + Math.sin(ang)*rad;
    if (!collidesPx(state, tx, ty, r)){
      a.wanderTargetPx = tx;
      a.wanderTargetPy = ty;
      a._wanderNextPick = now + randRange(state.rng, 600, 1400);
      return;
    }
  }
  a.wanderTargetPx = a.px;
  a.wanderTargetPy = a.py;
  a._wanderNextPick = now + 800;
}

export function updateAnimals(state, dt){
  if (state.over) return;
  if (!(state.entities instanceof Map)) state.entities = new Map();

  const p = state.player;
  const now = performance.now();
  const snapshot = Array.from(state.entities.entries());

  for (const [kEnt, a] of snapshot){
    if (!a || a.kind !== "animal") continue;
    ensureXY(a);

    // set home una vez (spawn)
    if (a.homePx == null){ a.homePx = a.px; a.homePy = a.py; }

    const fear = a.fearRangePx ?? (CONFIG.TILE * 5);
    const d2 = dist2(p.px, p.py, a.px, a.py);

    // ✅ HISTERESIS: para que no haga “ping-pong” al borde del rango
    const FEAR_EXIT_MUL = 1.25; // salir del miedo requiere un poco más de distancia
    const fearExit = fear * FEAR_EXIT_MUL;

    // Si estás cerca: HUYE (se aleja del player)
    if (d2 <= fear*fear){
      a._fleeing = true;

      // limpia target de wander para que no intente “volver” a uno viejo al salir
      a.wanderTargetPx = null;
      a.wanderTargetPy = null;

      const awayX = a.px + (a.px - p.px);
      const awayY = a.py + (a.py - p.py);
      moveTowardPoint(state, a, awayX, awayY, dt, a.fleeSpeedMul ?? 1.1);
      rekeyEntityIfNeeded(state, a, kEnt);
      continue;
    }

    // ✅ si venía huyendo, no “vuelvas a casa”: quédate donde estás
    if (a._fleeing && d2 >= fearExit*fearExit){
      a._fleeing = false;

      // “rebase” del home: el nuevo centro de wander pasa a ser la posición actual
      a.homePx = a.px;
      a.homePy = a.py;

      // fuerza a elegir un nuevo target de wander desde esta zona
      a._wanderNextPick = 0;
      a.wanderTargetPx = null;
      a.wanderTargetPy = null;
    }

    // WANDER suave
    a._wanderNextPick = a._wanderNextPick ?? 0;
    if (a.wanderTargetPx == null || now >= a._wanderNextPick){
      pickWanderTarget(state, a, now);
    }
    moveTowardPoint(state, a, a.wanderTargetPx, a.wanderTargetPy, dt, a.wanderSpeedMul ?? 0.2);
    rekeyEntityIfNeeded(state, a, kEnt);
  }
}
