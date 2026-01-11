// combat.js (real-time, pixel-based + movement + per-enemy params + wander)
import { CONFIG } from "../core/config.js";
import { roll, key } from "../core/utils.js";
import { logBad, logOk } from "../ui/log.js";
import { isWallAtPx } from "../world/map.js";
import { playSound } from "../ui/audio.js";
import { recomputeStats, addToInventory } from "../entities/inventory.js";
import { onQuestEvent } from "../entities/quests.js";
import { makeItem } from "../entities/item_factory.js";
import { keys } from "../input/input.js"; 



function dist2(ax, ay, bx, by){
  const dx = ax - bx, dy = ay - by;
  return dx*dx + dy*dy;
}

function resolveEnemyPlayerCollision(state, enemy){
  const p = state.player;

  const pr = p.r ?? 12;
  const er = enemy.r ?? 12;

  const dx = enemy.px - p.px;
  const dy = enemy.py - p.py;
  const dist = Math.hypot(dx, dy);

  const minDist = pr + er;

  // si están separados, no hacemos nada
  if (dist >= minDist || dist === 0) return;

  // empuja al enemigo hacia afuera para que “toque” pero no atraviese
  const nx = dx / dist;
  const ny = dy / dist;

  const targetPx = p.px + nx * minDist;
  const targetPy = p.py + ny * minDist;

  // intenta mover sin meterse en paredes
  if (!collidesPx(state, targetPx, enemy.py, er)) enemy.px = targetPx;
  if (!collidesPx(state, enemy.px, targetPy, er)) enemy.py = targetPy;
}

function resolveEnemyEnemyCollisions(state){
  const enemies = [];

  for (const e of state.entities.values()){
    if (e && e.kind === "enemy") enemies.push(e);
  }

  const ITERS = 2; // estabilidad

  for (let it = 0; it < ITERS; it++){
    for (let i = 0; i < enemies.length; i++){
      for (let j = i + 1; j < enemies.length; j++){
        const a = enemies[i];
        const b = enemies[j];

        const ra = a.r ?? 12;
        const rb = b.r ?? 12;

        const dx = b.px - a.px;
        const dy = b.py - a.py;
        const dist2 = dx*dx + dy*dy;
        const minDist = ra + rb;

        if (dist2 === 0) continue;
        if (dist2 >= minDist*minDist) continue;

        const dist = Math.sqrt(dist2);
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        const push = overlap * 0.5;

        // intenta separar sin atravesar paredes
        const ax = a.px - nx * push;
        const ay = a.py - ny * push;
        const bx = b.px + nx * push;
        const by = b.py + ny * push;

        if (!collidesPx(state, ax, a.py, ra)) a.px = ax;
        if (!collidesPx(state, a.px, ay, ra)) a.py = ay;
        if (!collidesPx(state, bx, b.py, rb)) b.px = bx;
        if (!collidesPx(state, b.px, by, rb)) b.py = by;
      }
    }
  }
}


function ensureEntitiesMap(state){
  if (!(state.entities instanceof Map)) state.entities = new Map();
}

// ✅ Devuelve el mejor candidato (enemy o animal) cuyo centro cae dentro del rect del tile (con margen por radio).
function targetInTileRect(state, tileX, tileY){
  const left = tileX * CONFIG.TILE;
  const top = tileY * CONFIG.TILE;
  const right = left + CONFIG.TILE;
  const bottom = top + CONFIG.TILE;

  let best = null;
  let bestD2 = Infinity;

  for (const ent of state.entities.values()){
    if (!ent) continue;
    if (ent.kind !== "enemy" && ent.kind !== "animal") continue;

    const ex = ent.px, ey = ent.py;
    const r = ent.r ?? 0;

    if (ex < left - r || ex > right + r || ey < top - r || ey > bottom + r) continue;

    const d2 = dist2(state.player.px, state.player.py, ex, ey);
    if (d2 < bestD2){
      bestD2 = d2;
      best = ent;
    }
  }

  return best;
}

// ---------------------------
// Movimiento / colisión
// ---------------------------
function collidesPx(state, px, py, r){
  return (
    isWallAtPx(state, px - r, py - r) ||
    isWallAtPx(state, px + r, py - r) ||
    isWallAtPx(state, px - r, py + r) ||
    isWallAtPx(state, px + r, py + r)
  );
}

function tileFromPx(px){
  return Math.floor(px / CONFIG.TILE);
}

function ensureXY(ent){
  if (ent.x == null) ent.x = tileFromPx(ent.px);
  if (ent.y == null) ent.y = tileFromPx(ent.py);
}

function rekeyEntityIfNeeded(state, ent, oldKey){
  ensureXY(ent);

  const nx = tileFromPx(ent.px);
  const ny = tileFromPx(ent.py);

  if (ent.x === nx && ent.y === ny) return oldKey;

  const newKey = key(nx, ny);

  // Evita apilarse en el mismo tile
  const occupant = state.entities.get(newKey);
  if (occupant && occupant !== ent) return oldKey;

  state.entities.delete(oldKey);
  ent.x = nx;
  ent.y = ny;
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

  const r = ent.r ?? 12;

  // colisión separando ejes (como el jugador)
  if (!collidesPx(state, nx, ent.py, r)) ent.px = nx;
  if (!collidesPx(state, ent.px, ny, r)) ent.py = ny;
}

function moveTowardPlayer(state, ent, dt){
  const p = state.player;
  moveTowardPoint(state, ent, p.px, p.py, dt, ent.speedMul ?? 0.55);
}

function randRange(rng, a, b){
  return a + (b - a) * rng();
}

function pickWanderTarget(state, ent, now, radiusPx){
  const r = ent.r ?? 12;

  for (let i = 0; i < 12; i++){
    const tx = ent.homePx + randRange(state.rng, -radiusPx, radiusPx);
    const ty = ent.homePy + randRange(state.rng, -radiusPx, radiusPx);

    // descarta targets que estén claramente dentro de pared (4 puntos)
    if (
      isWallAtPx(state, tx - r, ty - r) ||
      isWallAtPx(state, tx + r, ty - r) ||
      isWallAtPx(state, tx - r, ty + r) ||
      isWallAtPx(state, tx + r, ty + r)
    ) continue;

    ent.wanderTargetPx = tx;
    ent.wanderTargetPy = ty;
    ent._wanderNextPick = now + randRange(state.rng, 800, 2000);
    return;
  }

  ent.wanderTargetPx = ent.homePx;
  ent.wanderTargetPy = ent.homePy;
  ent._wanderNextPick = now + 600;
}

// ---------------------------
// API pública
// ---------------------------
export function nearestEnemy(state, rangePx){
  ensureEntitiesMap(state);
  const p = state.player;
  const r2 = rangePx * rangePx;

  let best = null;
  let bestD2 = Infinity;

  for (const ent of state.entities.values()){
    if (!ent || ent.kind !== "enemy") continue;
    const d2 = dist2(p.px, p.py, ent.px, ent.py);
    if (d2 <= r2 && d2 < bestD2){
      best = ent;
      bestD2 = d2;
    }
  }
  return best;
}

export function removeEntity(state, ent){
  ensureEntitiesMap(state);
  for (const [k, v] of state.entities.entries()){
    if (v === ent){
      state.entities.delete(k);
      return true;
    }
  }
  return false;
}

export function enemyAttack(state, enemy){
  const raw = roll(state.rng, 1, enemy.atk || 1);
  const reduced = Math.max(1, raw - (state.player.def || 0));

  state.player.hp -= reduced;
  playSound("enemyAttack");
  logBad(`${enemy.type} te pega por ${reduced}.`);

  if (state.player.hp <= 0){
  state.player.hp = 0;
  state.over = true;
  logBad("Has caído... Reiniciando...");

  // 🔄 refresh real de la página
  window.location.reload();
 }

}

// ✅ Nivel NO sube stats: solo sube nivel + cura (como lo acordamos)
export function gainXP(state, amount){
  const p = state.player;
  p.xp += amount;
  logOk(`Ganas ${amount} XP.`);

  while (p.xp >= p.xpNext){
    p.xp -= p.xpNext;
    p.lvl += 1;

    // ✅ 1 nivel = 1 punto de habilidad
    p.skillPoints = (p.skillPoints ?? 0) + 1;

    if (typeof recomputeStats === "function"){
      recomputeStats(state);
    }

    p.xpNext = Math.round(p.xpNext * 1.35 + 3);

    // cura sin aumentar stats
    p.hp = p.hpMax;

    logOk(`¡Subes a nivel ${p.lvl}! Te curas al máximo.`);
  }
}


// ✅ Centraliza lo que ocurre cuando algo muere
function handleEntityDeath(state, ent){
  removeEntity(state, ent);

  if (ent.kind === "enemy"){
  
    // 🎁 DROPS DEL ENEMIGO (definidos en enemy.js)
    if (Array.isArray(ent.drops)){
      for (const d of ent.drops){
        if (state.rng() <= d.chance){
    
          const dropType = d?.item?.type;
          const dropQty = d?.item?.qty ?? 1;
    
          const item = makeItem(dropType, { qty: dropQty });
          if (!item){
            console.warn("Drop desconocido:", dropType, d);
            continue;
          }
    
          const ok = addToInventory(state, item);
          if (ok){
            logOk(`Obtienes: ${item.icon ?? "📦"} ${item.name ?? dropType}.`);
          } else {
            logBad(`Inventario lleno, perdiste ${item.name ?? dropType}.`);
          }
        }
      }
    }
  
    // 📜 quests
    onQuestEvent(state, { type: "kill", target: ent.type, amount: 1 });
  
    // ⭐ XP
    gainXP(state, ent.xp || 0);
  
    logOk(`Derrotaste a ${ent.type}.`);
    return;
    }


    if (ent.kind === "animal"){
      if (ent.type === "hare"){
        const item = makeItem("hare_meat");
        if (!item){
          logBad("Error: item de drop desconocido.");
          return;
        }
    
        const ok = addToInventory(state, item);
    
        if (ok) logOk("Cazaste una liebre. Obtienes: 🍖 Carne de liebre.");
        else logBad("Cazaste una liebre, pero el inventario está lleno (no pudiste guardar la carne).");
      } else {
        logOk(`Cazaste: ${ent.type}.`);
      }
    }
}

// ✅ API para skills: aplica daño y dispara la misma lógica de muerte (drops/xp/etc.)
export function damageEnemy(state, enemy, dmg, msg) {
  if (!enemy || enemy.kind !== "enemy") return false;

  const finalDmg = Math.max(0, Math.floor(dmg || 0));
  if (finalDmg <= 0) return false;

  enemy.hp -= finalDmg;
  enemy.aggroUntil = performance.now() + 3000; // 0.5s (ajusta)
  enemy.aggroTargetId = "player"; // opcional, por si luego quieres más targets

  // 👇 NUEVO: activar barra de vida
  enemy.lastHitAt = performance.now();

  if (msg) logOk(msg);

  if (enemy.hp <= 0) {
    handleEntityDeath(state, enemy);
  }
  return true;
}


export function playerAttack(state){
  if (state.over) return false;

  const p = state.player;
  const now = performance.now();
  const ATK_COOLDOWN = 300;

  if (now < p.nextAtkTime) return false;
  p.nextAtkTime = now + ATK_COOLDOWN;


  playSound("playerAttack");
  ensureEntitiesMap(state);

  const tx = Math.floor(p.px / CONFIG.TILE);
  const ty = Math.floor(p.py / CONFIG.TILE);

  if (keys.look && !p._facingLock) {
    let lx = Math.sign(p.facingX || 0);
    let ly = Math.sign(p.facingY || 0);
    if (lx === 0 && ly === 0) ly = 1;
    p._facingLock = { x: lx, y: ly };
  }

  if (keys.look && p._facingLock) {
    p.facingX = p._facingLock.x;
    p.facingY = p._facingLock.y;
  }

  const effX = (keys.look ? p._facingLock?.x : null) ?? p.facingX ?? 0;
  const effY = (keys.look ? p._facingLock?.y : null) ?? p.facingY ?? 0;

  let fx = Math.sign(effX);
  let fy = Math.sign(effY);

  // último fallback: abajo (idealmente no pasa si facing/lock son persistentes)
  if (fx === 0 && fy === 0) fy = 1;

  // ✅ Congela dirección del ataque
  p.atkDir = { x: fx, y: fy };
  p.atkDirStr =
    (Math.abs(fx) > Math.abs(fy)) ? (fx > 0 ? "right" : "left")
                                  : (fy > 0 ? "down" : "up");

  // ✅ el ataque también fija la dirección visual persistente
  p.lookX = fx;
  p.lookY = fy;
  p.lookDirStr = p.atkDirStr;

  // offsets
  let offsets;
  if (fx !== 0 && fy !== 0) offsets = [[fx, 0], [0, fy], [fx, fy]];
  else if (fy !== 0) offsets = [[-1, fy], [0, fy], [1, fy]];
  else offsets = [[fx, -1], [fx, 0], [fx, 1]];

  // ✅ Dirección visual congelada durante este swing
  p.anim ??= {};
  p.anim.dir = p.atkDirStr;

  // animación
  p.atkAnimUntil = now + 140;
  p.atkAnimTiles = offsets.map(([ox, oy]) => ({ x: tx + ox, y: ty + oy }));

  let hitSomething = false;
  let dealtDamage = false;
  const hitSet = new Set();

  for (const [ox, oy] of offsets){
    const ent = targetInTileRect(state, tx + ox, ty + oy);
    if (!ent || hitSet.has(ent)) continue;
    hitSet.add(ent);

    if (typeof ent.hp !== "number") continue;

    // ✅ NUEVO: chequeo de rango real en píxeles (anti-"cheese")
    const pr = p.r ?? 12;
    const er = ent.r ?? 12;

    // Ajusta esto a gusto: 0.75–1.0 TILE suele ir bien para melee
    const weaponRangePx = CONFIG.TILE * 0.85; 

    const dx = ent.px - p.px;
    const dy = ent.py - p.py;
    const maxReach = weaponRangePx + pr + er;

    if (dx*dx + dy*dy > maxReach * maxReach) continue;

    const dmg = roll(state.rng, 1, p.atk || 1);
    ent.hp -= dmg;
    ent.aggroUntil = performance.now() + 3000;
    ent.lastHitAt = performance.now();
  

    if (dmg > 0) dealtDamage = true;

    hitSomething = true;

    logOk(`Golpeas a ${ent.type} por ${dmg} daño.`);
    if (ent.hp <= 0) handleEntityDeath(state, ent);
  }

  // ✅ Solo si se causó daño a al menos 1 enemigo/animal
  if (dealtDamage) {
    if (typeof p.mp === "number") {
      const max = (typeof p.mpMax === "number") ? p.mpMax : p.mp;
      p.mp = Math.min(max, p.mp + 1);
    } else if (typeof p.mana === "number") {
      const max = (typeof p.manaMax === "number") ? p.manaMax : p.mana;
      p.mana = Math.min(max, p.mana + 1);
    }
  }

  return hitSomething;
}


/**
 * Update de combate en tiempo real (enemigos):
 * - fuera de aggro: wander
 * - en aggro: persigue + ataca
 * - cooldown individual por enemigo
 */
export function updateCombat(state, dt){
  if (state.over) return;
  ensureEntitiesMap(state);

  const p = state.player;
  const now = performance.now();

  updatePlayerBuffs(state, now);

  updateProjectiles(state, dt);

  state.inCombat = null;

  const snapshot = Array.from(state.entities.entries());

  for (const [kEnt, e] of snapshot){
    if (!e || e.kind !== "enemy") continue;

    // ✅ STUN: si está aturdido, no actúa este frame
    if (e.stunnedUntil && now < e.stunnedUntil) {
      continue;
    }

    ensureXY(e);

    const aggroRange = e.aggroRangePx ?? (CONFIG.TILE * 6.0);
    const hitRange   = e.attackRangePx ?? (CONFIG.TILE * 0.8);
    const cdMs       = e.attackCooldownMs ?? 700;

    const wanderRadius   = e.wanderRadiusPx ?? (CONFIG.TILE * 3.0);
    const wanderSpeedMul = e.wanderSpeedMul ?? ((e.speedMul ?? 0.55) * 0.45);

    const d2 = dist2(p.px, p.py, e.px, e.py);

    // WANDER si no está en aggro
    const forcedAggro = (e.aggroUntil && now < e.aggroUntil);
    if (!forcedAggro && d2 > aggroRange * aggroRange) {
      if (e.homePx == null){
        e.homePx = e.px;
        e.homePy = e.py;
      }

      e._wanderNextPick = e._wanderNextPick ?? 0;

      if (e.wanderTargetPx == null || now >= e._wanderNextPick){
        pickWanderTarget(state, e, now, wanderRadius);
      }

      moveTowardPoint(state, e, e.wanderTargetPx, e.wanderTargetPy, dt, wanderSpeedMul);

      const arrive2 = dist2(e.px, e.py, e.wanderTargetPx, e.wanderTargetPy);
      if (arrive2 <= (CONFIG.TILE * 0.25) ** 2){
        e._wanderNextPick = Math.min(e._wanderNextPick, now + 200);
      }

      rekeyEntityIfNeeded(state, e, kEnt);
      continue;
    }

    // AGGRO
    state.inCombat = e;

    // persigue si está lejos
    // persigue si está lejos (✅ rango real borde-a-borde)
    const pr = p.r ?? 12;
    const er = e.r ?? 12;
    const reach = hitRange + pr + er;
    
    if (d2 > reach * reach){
      moveTowardPlayer(state, e, dt);
      resolveEnemyPlayerCollision(state, e);
      rekeyEntityIfNeeded(state, e, kEnt);
      continue;
    }


    // ataca si está en rango
    e._nextAtk = e._nextAtk ?? 0;
    if (now >= e._nextAtk){
      resolveEnemyPlayerCollision(state, e);
      enemyAttack(state, e);
      e._nextAtk = now + cdMs;
      break; // 1 ataque por frame
    }
  }

  resolveEnemyEnemyCollisions(state);
}

function updatePlayerBuffs(state, now) {
  const p = state.player;
  if (!p.buffs) return;

  for (const [buffId, b] of Object.entries(p.buffs)) {
    if (!b) continue;

    if (now >= (b.untilMs || 0)) {
      // revertir efectos aplicados
      if (b.defBonusApplied) {
        p.def = (p.def || 0) - b.defBonusApplied;
      }

      delete p.buffs[buffId];
      logOk(`${buffId} se desvanece.`);
    }
  }
}

// ===========================
// PROJECTILES (reales)
// ===========================

function projectileCollidesWall(state, px, py, r){
  // misma idea que collidesPx() (privada arriba)
  return (
    isWallAtPx(state, px - r, py - r) ||
    isWallAtPx(state, px + r, py - r) ||
    isWallAtPx(state, px - r, py + r) ||
    isWallAtPx(state, px + r, py + r)
  );
}

export function spawnProjectile(state, proj){
  state.projectiles ??= [];
  state.projectiles.push({
    kind: "projectile",
    alive: true,

    // pos
    px: proj.px,
    py: proj.py,
    startPx: proj.px,
    startPy: proj.py,

    // colisión
    r: proj.r ?? 6,

    // comportamiento
    target: proj.target,             // referencia al enemy
    speedPxPerSec: proj.speedPxPerSec ?? 360,
    maxRangePx: proj.maxRangePx ?? 300,

    // payload combate
    dmg: proj.dmg ?? 1,
    skillId: proj.skillId ?? "unknown",
  });
}

/**
 * Actualiza proyectiles. dt es el mismo dt (segundos) que usa updateCombat().
 */
export function updateProjectiles(state, dt){
  const arr = state.projectiles;
  if (!arr || arr.length === 0) return;

  for (const p of arr){
    if (!p.alive) continue;

    // si el target ya no existe/vive, el proyectil se pierde
    if (!p.target || p.target.kind !== "enemy" || p.target.hp <= 0){
      p.alive = false;
      continue;
    }

    // mover hacia el target (HOMING: sigue al objetivo)
    const dx = p.target.px - p.px;
    const dy = p.target.py - p.py;
    const dist = Math.hypot(dx, dy) || 1;

    const step = p.speedPxPerSec * dt;
    const nx = dx / dist;
    const ny = dy / dist;

    const nextPx = p.px + nx * step;
    const nextPy = p.py + ny * step;

    // colisión con paredes -> se destruye
    if (projectileCollidesWall(state, nextPx, nextPy, p.r)){
      p.alive = false;
      continue;
    }

    p.px = nextPx;
    p.py = nextPy;

    // ¿excedió rango máximo?
    const travel = Math.hypot(p.px - p.startPx, p.py - p.startPy);
    if (travel > p.maxRangePx){
      p.alive = false;
      continue;
    }

    // impacto con el enemigo (centro-a-centro con radios)
    const hitDx = p.target.px - p.px;
    const hitDy = p.target.py - p.py;
    const hitDist = Math.hypot(hitDx, hitDy);
    const er = p.target.r ?? 12;
    if (hitDist <= (p.r + er)){
      damageEnemy(
        state,
        p.target,
        p.dmg,
        `El proyectil de ${p.skillId} impacta a ${p.target.type} por ${p.dmg} daño.`
      );
      p.alive = false;
    }
  }

  // cleanup
  state.projectiles = arr.filter(p => p.alive);
}
