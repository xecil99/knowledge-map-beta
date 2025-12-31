// main.js
import { createSupabaseClient } from "./supabaseClient.js";
import * as THREE from "three";
import { state } from "./state.js";
import { reloadGraph, createUpdateChecker } from "./data.js";
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
import { loadNodesFromSupabase } from "./dataSupabase.js";


console.log("main.js updated: supabase test running");

const supabase = createSupabaseClient();

// quick sanity check (remove later)
supabase
  .from("nodes")
  .select("id")
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error("Supabase error:", error);
    } else {
      console.log("Supabase connected. Sample:", data);
    }
  });

// ---------- DOM ----------
const statusEl = document.getElementById("status");
const strengthEl = document.getElementById("strength");
const strengthValEl = document.getElementById("strengthVal");
const setStatus = (t) => statusEl && (statusEl.textContent = t);

// ---------- Utils ----------
function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}

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

  // Springs
  const map = idToNodeMap();
  const globalStrength = Number(strengthEl.value);

  for (const L of state.graph.links) {
    const a = map.get(L.a);
    const b = map.get(L.b);
    if (!a || !b) continue;

    const d = new THREE.Vector3().subVectors(b.pos, a.pos);
    const dist = Math.max(0.001, d.length());
    const w = clamp01(L.w * 0.7 + globalStrength * 0.3) ?? 0.5;

    const rest = params.baseRest * (1.2 - w);
    const k = params.linkK * (0.5 + w);

    const stretch = dist - rest;
    const f = d.normalize().multiplyScalar(k * stretch);
    a.vel.add(f);
    b.vel.sub(f);
  }

// ---------- UI ----------
strengthEl.addEventListener("input", () => {
  strengthValEl.textContent = Number(strengthEl.value).toFixed(2);
});

document.getElementById("btnRecenter")?.addEventListener("click", () => {
  const c = new THREE.Vector3();
  for (const n of state.graph.nodes) c.add(n.pos);
  c.multiplyScalar(1 / Math.max(1, state.graph.nodes.length));
  for (const n of state.graph.nodes) n.pos.sub(c);
  setStatus("Recentered.");
});

document.getElementById("btnRandom")?.addEventListener("click", () => {
  setStatus("Random demo disabled in this cleaned file.");
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
  tickPhysics({ state, globalStrength: Number(strengthEl.value) });
  updateRenderObjects({ state });
  savePositionsThrottled();
  controls.update();
  renderer.render(scene, camera);
}

// ---------- Boot ----------
try {
  await loadNodesFromSupabase({ supabase, state, setStatus });
  // keep links from Sheets for now:
  await reloadGraph({
    state,
    setStatus,
    rebuildScene: () => {
      rebuildScene({ scene, state });
      applySelectionVisuals({ state });
      updateRenderObjects({ state });
    },
  });
} catch (e) {
  console.error("Supabase nodes load failed, falling back to Sheets:", e);
  await reloadGraph({
    state,
    setStatus,
    rebuildScene: () => {
      rebuildScene({ scene, state });
      applySelectionVisuals({ state });
      updateRenderObjects({ state });
    },
  });
}

  animate();

  const checkForUpdates = createUpdateChecker({
    setStatus,
    onChangeReload: async () =>
      reloadGraph({
        state,
        setStatus,
        rebuildScene: () => {
          rebuildScene({ scene, state });
          applySelectionVisuals({ state });
          updateRenderObjects({ state });
        },
      }),
  });

  setInterval(checkForUpdates, 1500);
