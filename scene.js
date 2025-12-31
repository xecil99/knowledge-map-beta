// scene.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Owned by this module (do not reassign; cleared in place)
const nodeMeshes = [];
let linkLines = null;
let linkPosAttr = null;

const nodeGeom = new THREE.SphereGeometry(0.7, 24, 24);
const baseNodeMat = new THREE.MeshStandardMaterial({ transparent: true });

export function getNodeMeshes() {
  return nodeMeshes; // stable reference
}

export function createThreeApp() {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
  camera.position.set(0, 10, 30);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(10, 20, 10);
  scene.add(dir);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  return { scene, camera, renderer, controls, raycaster, mouse };
}

export function rebuildScene({ scene, state }) {
  // remove old nodes
  for (const m of nodeMeshes) scene.remove(m);
  nodeMeshes.length = 0;

  // remove old links
  if (linkLines) {
    scene.remove(linkLines);
    linkLines.geometry.dispose();
    linkLines.material.dispose();
    linkLines = null;
    linkPosAttr = null;
  }

  // nodes
  for (const n of state.graph.nodes) {
    const mat = baseNodeMat.clone();
    const mesh = new THREE.Mesh(nodeGeom, mat);
    mesh.material.color.setHSL(Math.random(), 0.6, 0.55);
    mesh.position.copy(n.pos);
    mesh.userData = { id: n.id };
    scene.add(mesh);
    nodeMeshes.push(mesh);
  }

  // links (single buffer)
  const positions = new Float32Array(state.graph.links.length * 2 * 3);
  const geom = new THREE.BufferGeometry();
  linkPosAttr = new THREE.BufferAttribute(positions, 3);
  geom.setAttribute("position", linkPosAttr);

  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  linkLines = new THREE.LineSegments(geom, mat);
  scene.add(linkLines);
}

export function applySelectionVisuals({ state }) {
  const sel = state.selection.nodeId;

  if (!sel) {
    for (const m of nodeMeshes) m.material.opacity = 1.0;
    return;
  }

  const neighborIds = new Set([sel]);
  for (const L of state.graph.links) {
    if (L.a === sel) neighborIds.add(L.b);
    if (L.b === sel) neighborIds.add(L.a);
  }

  for (const m of nodeMeshes) {
    const id = m.userData.id;
    m.material.opacity = neighborIds.has(id) ? 1.0 : 0.15;
  }
}

export function updateRenderObjects({ state }) {
  if (!linkLines || nodeMeshes.length !== state.graph.nodes.length) return;

  // nodes
  for (let i = 0; i < state.graph.nodes.length; i++) {
    nodeMeshes[i].position.copy(state.graph.nodes[i].pos);
  }

  // links
  const idToIndex = new Map(state.graph.nodes.map((n, i) => [n.id, i]));
  const posAttr = linkPosAttr;

  const sel = state.selection.nodeId;
  let k = 0;

  for (const L of state.graph.links) {
    const ia = idToIndex.get(L.a);
    const ib = idToIndex.get(L.b);

    if (ia === undefined || ib === undefined) {
      posAttr.setXYZ(k++, 0, 0, 0);
      posAttr.setXYZ(k++, 0, 0, 0);
      continue;
    }

    const a = state.graph.nodes[ia];
    const b = state.graph.nodes[ib];

    const show = !sel || L.a === sel || L.b === sel;

    if (!show) {
      posAttr.setXYZ(k++, 0, 0, 0);
      posAttr.setXYZ(k++, 0, 0, 0);
    } else {
      posAttr.setXYZ(k++, a.pos.x, a.pos.y, a.pos.z);
      posAttr.setXYZ(k++, b.pos.x, b.pos.y, b.pos.z);
    }
  }

  posAttr.needsUpdate = true;
}
