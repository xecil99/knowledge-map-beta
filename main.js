// main.js
import * as THREE from "three";
import { createSupabaseClient } from "./supabaseClient.js";
import { state } from "./state.js";

import { setInspector } from "./inspector.js";
import { installSelectionPicking } from "./interaction.js";

import {
  createThreeApp,
  rebuildScene,
  applySelectionVisuals,
  updateRenderObjects,
  getNodeMeshes,
} from "./scene.js";

import { tickPhysics } from "./physics.js";
import { loadNodesFromSupabase, loadLinksFromSupabase } from "./dataSupabase.js";

import { initNodeSubmission } from "./submit.js";
import { initAuthUI } from "./auth.js";

console.log("main.js updated: supabase");

const supabase = createSupabaseClient();
initAuthUI({ supabase });
initNodeSubmission({ supabase });

// ---------- DOM ----------
const statusEl = document.getElementById("status");
const strengthEl = document.getElementById("strength");
const strengthValEl = document.getElementById("strengthVal");
const setStatus = (t) => statusEl && (statusEl.textContent = t);

// ---------- Utils ----------
function nowMs() {
  return performance.now();
}

// ---------- Three app ----------
const { scene, camera, renderer, controls, raycaster, mouse } = createThreeApp();

// ---------- Save positions ----------
function savePositionsThrottled() {
  const t = nowMs();
  if (t - savePositionsThrottled._last < 1000) return;
  savePositionsThrottled._last = t;

  const out = {};
  for (const n of state.graph.nodes) out[n.id] = [n.pos.x, n.pos.y, n.pos.z];
  localStorage.setItem("km_positions", JSON.stringify(out));
}
savePositionsThrottled._last = 0;

// ---------- Helpers ----------
function idToNodeMap() {
  return new Map(state.graph.nodes.map((n) => [n.id, n]));
}

function computeNeighborSet(centerId) {
  const set = new Set([centerId]);
  for (const L of state.graph.links) {
    if (L.a === centerId) set.add(L.b);
    if (L.b === centerId) set.add(L.a);
  }
  return set;
}

// ---------- Selection ----------
function selectNode(id, moveCamera = false) {
  const map = idToNodeMap();
  const node = map.get(id);
  if (!node) return;

  state.selection.nodeId = id;

  applySelectionVisuals({ state });
  updateRenderObjects({ state });

  const neighborIds = computeNeighborSet(node.id);
  neighborIds.delete(node.id);

  setInspector({
    node,
    neighborIds,
    onJump: (nid) => selectNode(nid, true),
  });

  if (moveCamera) {
    controls.target.copy(node.pos);
    camera.position.set(node.pos.x + 5, node.pos.y + 3, node.pos.z + 5);
  }
}

// ---------- Interaction ----------
installSelectionPicking({
  domElement: renderer.domElement,
  camera,
  raycaster,
  mouse,
  nodeMeshes: getNodeMeshes(), // stable array reference from scene.js
  selectNode,
});

// ---------- UI ----------
strengthEl?.addEventListener("input", () => {
  if (strengthValEl) strengthValEl.textContent = Number(strengthEl.value).toFixed(2);
});

document.getElementById("btnRecenter")?.addEventListener("click", () => {
  const c = new THREE.Vector3();
  for (const n of state.graph.nodes) c.add(n.pos);
  c.multiplyScalar(1 / Math.max(1, state.graph.nodes.length));
  for (const n of state.graph.nodes) n.pos.sub(c);
  setStatus("Recentered.");
});

document.getElementById("btnResetLayout")?.addEventListener("click", () => {
  localStorage.removeItem("km_positions");
  location.reload();
});

// ---------- Resize ----------
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- Animate ----------
function animate() {
  requestAnimationFrame(animate);
  tickPhysics({ state, globalStrength: Number(strengthEl?.value ?? 0.5) });
  updateRenderObjects({ state });
  savePositionsThrottled();
  controls.update();
  renderer.render(scene, camera);
}

// ---------- Boot ----------
async function boot() {
  try {
    await loadNodesFromSupabase({ supabase, state, setStatus });
    await loadLinksFromSupabase({ supabase, state, setStatus });

    rebuildScene({ scene, state });
    applySelectionVisuals({ state });
    updateRenderObjects({ state });

    setStatus(`Loaded nodes + links from Supabase (${state.graph.nodes.length} / ${state.graph.links.length}).`);
} catch (e) {
  console.error("Supabase load failed:", e);
  setStatus("Supabase load failed — see console.");
}

  animate();
}

boot();
