// js/entities/item_interact.js
import { CONFIG } from "../core/config.js";
import { key } from "../core/utils.js";
import { handleItemPickup } from "../entities/items.js";

const PICKUP_MS = 2000; // ajusta el tiempo de recogida (ms)

function getFacingTile(state){
  const p = state.player;

  const tx = Math.floor(p.px / CONFIG.TILE);
  const ty = Math.floor(p.py / CONFIG.TILE);

  // dirección a la que mira (fallback abajo)
  let dx = Math.sign(p.facingX || 0);
  let dy = Math.sign(p.facingY || 0);
  if (dx === 0 && dy === 0) dy = 1;

  return { fx: tx + dx, fy: ty + dy };
}

function cancelPickup(state){
  state.pickup = null;
}

export function updateItemPickup(state){
  const job = state.pickup;
  if (!job || job.kind !== "item") return;

  // si cambió de mapa, cancela
  if (job.mapId !== state.mapId){
    cancelPickup(state);
    return;
  }

  // si ya no está mirando el mismo tile, cancela
  const { fx, fy } = getFacingTile(state);
  if (fx !== job.fx || fy !== job.fy){
    cancelPickup(state);
    return;
  }

  // si el item ya no existe, cancela
  const ent = state.entities.get(key(job.fx, job.fy));
  if (!ent || ent.kind !== "item"){
    cancelPickup(state);
    return;
  }

  const now = performance.now();
  if (now - job.startedAt < job.durationMs) return;

  // ✅ completar recogida
  handleItemPickup(state, ent);
  cancelPickup(state);
}

export function tryPickupFacingItem(state){
  // si ya está recogiendo un item, al pulsar otra vez cancelamos (opcional)
  if (state.pickup?.kind === "item"){
    cancelPickup(state);
    return true;
  }

  const { fx, fy } = getFacingTile(state);

  const ent = state.entities.get(key(fx, fy));
  if (!ent || ent.kind !== "item") return false;

  // iniciar “cast” de recogida
  state.pickup = {
    kind: "item",
    mapId: state.mapId,
    fx,
    fy,
    startedAt: performance.now(),
    durationMs: PICKUP_MS
  };

  return true;
}
