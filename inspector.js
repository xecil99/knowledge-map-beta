// inspector.js

function el(id) {
  return document.getElementById(id);
}

export function setInspector({ node, neighborIds, onJump }) {
  el("inspector-id").textContent = node?.id ?? "(none)";
  el("inspector-label").textContent = node?.label ?? "";
  el("inspector-strength").textContent =
    node?.strength != null ? String(node.strength) : "";
  el("inspector-definition").textContent =
    node?.meta?.definition || "(none)";

  const ul = el("inspector-links");
  ul.innerHTML = "";
  if (!node) return;

  const ids = Array.from(neighborIds || []);
  ids.sort();

  for (const id of ids) {
    const li = document.createElement("li");
    li.textContent = id;
    li.onclick = () => onJump?.(id);
    ul.appendChild(li);
  }
}
