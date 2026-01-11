// ui/render/canvas_resize.js
export function resizeCanvasToScreen(canvas){
  const dpr = window.devicePixelRatio || 1;

  const hud = document.querySelector(".hud");
  const hudH = hud ? hud.getBoundingClientRect().height : 0;

  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor((window.innerHeight - hudH) * dpr);

  const safeH = Math.max(1, h);

  if (canvas.width !== w || canvas.height !== safeH){
    canvas.width = w;
    canvas.height = safeH;
  }
}
