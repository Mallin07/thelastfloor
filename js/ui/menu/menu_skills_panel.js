// js/ui/menu/menu_skills_panel.js
import { SKILL_TREE_LAYOUT } from "../../data/skill_tree_layout.js";
import { SKILLS } from "../../data/skills_db.js";


export function canDragSkill(state, skillId) {
  const rank = state.player?.skills?.[skillId] ?? 0;
  return rank > 0;
}

export function createSkillNode(state, skillId) {
  const node = document.createElement("div");
  node.className = "skill-node";
  node.dataset.skillId = skillId;

  const draggable = canDragSkill(state, skillId);
  node.draggable = draggable;

  node.classList.toggle("draggable", draggable);
  node.classList.toggle("locked", !draggable);

  const skill = SKILLS?.[skillId];
  const name = skill?.name ?? skillId;
  const icon = skill?.icon ?? "";

  // --- contenido del nodo ---
  node.innerHTML = "";

  const img = document.createElement("img");
  img.className = "icon";
  img.alt = name;
  img.src = icon || "";

  img.draggable = false;
  img.addEventListener("dragstart", (e) => e.preventDefault());

  if (!icon) img.style.display = "none"; // fallback: sin icono, no rompe

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = name;

  node.appendChild(img);
  node.appendChild(title);

  node.addEventListener("dragstart", (e) => {
    console.log("[dragstart skill tree]", skillId, "rank=", state.player?.skills?.[skillId]); // consola

    if (!canDragSkill(state, skillId)) {
      e.preventDefault();
      return;
    }
  
    e.dataTransfer.effectAllowed = "move";
  
    // ✅ NUEVO: payload único
    e.dataTransfer.setData(
      "application/x-actionbar",
      JSON.stringify({ kind: "skill", id: skillId })
    );
  
    // (Opcional) compatibilidad con tu sistema actual
    e.dataTransfer.setData("text/skill-id", skillId);
    e.dataTransfer.setData("text/plain", skillId);
  });

  return node;
}


function ensurePanel(){
  let panel = document.getElementById("skillsPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "skillsPanel";
    document.body.appendChild(panel);
  }
  panel.style.display = "block";
  return panel;
}

export function hideSkillsPanel() {
  const panel = document.getElementById("skillsPanel");
  if (panel) panel.style.display = "none";
}

export function showSkillsPanel() {
  const panel = document.getElementById("skillsPanel");
  if (panel) panel.style.display = "block";
}

// ✅ Mantén esta para listas simples (debug / fallback)
export function renderSkillsPanel(state, skillIds) {
  const panel = ensurePanel();
  panel.classList.remove("tree");
  panel.innerHTML = "";

  // lista simple
  const wrap = document.createElement("div");
  wrap.className = "skills-list";
  panel.appendChild(wrap);

  for (const skillId of skillIds) {
    wrap.appendChild(createSkillNode(state, skillId));
  }
}

export function renderSkillsTreePanel(state, branchId) {
  const panel = ensurePanel();
  panel.classList.add("tree");
  panel.innerHTML = "";

  const layout = SKILL_TREE_LAYOUT?.[branchId];
  if (!layout) {
    panel.textContent = "Sin layout de árbol para esta rama.";
    return;
  }

  // contenedor relativo para nodos + svg
  const tree = document.createElement("div");
  tree.className = "skills-tree";
  panel.appendChild(tree);

  // parámetros de escala (ajustables)
  const cellX = 90;   // distancia horizontal entre columnas
  const cellY = 90;   // distancia vertical entre filas
  const padX = 30;
  const padY = 30;

  // bounds para tamaño
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const n of layout.nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }

  const w = (maxX - minX + 1) * cellX + padX * 2;
  const h = (maxY - minY + 1) * cellY + padY * 2;
  tree.style.width = `${w}px`;
  tree.style.height = `${h}px`;

  // --- 1) calcular posiciones absolutas de cada nodo ---
  // Nota: usamos el tamaño real del nodo para el centro.
  const NODE_W = 120; // debe coincidir con tu CSS .skill-node width
  const NODE_H = 48;  // debe coincidir con tu CSS .skill-node height

  const pos = new Map(); // skillId -> { x, y, cx, cy }
  for (const n of layout.nodes) {
    const x = padX + (n.x - minX) * cellX;
    const y = padY + (n.y - minY) * cellY;
    pos.set(n.id, {
      x, y,
      cx: x + NODE_W / 2,
      cy: y + NODE_H / 2
    });
  }

  // --- 2) crear SVG para las líneas (DETRÁS de los nodos) ---
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  svg.classList.add("skills-tree-lines");

  // --- 3) dibujar edges ---
  for (const [a, b] of (layout.edges || [])) {
    const pa = pos.get(a);
    const pb = pos.get(b);
    if (!pa || !pb) continue;

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", String(pa.cx));
    line.setAttribute("y1", String(pa.cy));
    line.setAttribute("x2", String(pb.cx));
    line.setAttribute("y2", String(pb.cy));

    // estilo inline mínimo (puedes pasar a CSS si quieres)
    line.setAttribute("stroke", "#777");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linecap", "round");

    svg.appendChild(line);
  }

  tree.appendChild(svg);

  // --- 4) renderizar nodos encima ---
  for (const n of layout.nodes) {
    const skillId = n.id;
    const node = createSkillNode(state, skillId);
    const p = pos.get(skillId);

    node.style.position = "absolute";
    node.style.left = `${p.x}px`;
    node.style.top  = `${p.y}px`;

    tree.appendChild(node);
  }
}

