function write(msg, cls=""){
  const el = document.getElementById("log");
  const p = document.createElement("p");
  if (cls) p.className = cls;
  p.innerHTML = `<strong>${msg}</strong>`;
  el.prepend(p);
}

export function logOk(msg){ write(msg, "ok"); }
export function logBad(msg){ write(msg, "bad"); }
export function logInfo(msg){
  const el = document.getElementById("log");
  const p = document.createElement("p");
  p.innerHTML = msg;
  el.prepend(p);
}
