// physics.js
// Force-directed layout (no rendering, no DOM)

console.log("physics.js vX loaded");

import * as THREE from "three";

export const physicsParams = {
  repulsion: 60,
  damping: 0.88,
  linkK: 0.06,
  baseRest: 10,
  centerPull: 0.002,
};

export function tickPhysics({ state, globalStrength }) {
  const nodes = state.graph.nodes;
  if (!nodes.length) return;

  // Repulsion
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const d = new THREE.Vector3().subVectors(a.pos, b.pos);
      const dist = Math.max(0.6, d.length());
      const force = physicsParams.repulsion / (dist * dist);
      d.normalize().multiplyScalar(force);
      a.vel.add(d);
      b.vel.sub(d);
    }
  }

  // Springs
  const map = new Map(nodes.map((n) => [n.id, n]));

  for (const L of state.graph.links) {
    const a = map.get(L.a);
    const b = map.get(L.b);
    if (!a || !b) continue;

    const d = new THREE.Vector3().subVectors(b.pos, a.pos);
    const dist = Math.max(0.001, d.length());
    const w = Math.max(
      0,
      Math.min(1, L.w * 0.7 + globalStrength * 0.3)
    );

    const rest = physicsParams.baseRest * (1.2 - w);
    const k = physicsParams.linkK * (0.5 + w);

    const stretch = dist - rest;
    const f = d.normalize().multiplyScalar(k * stretch);
    a.vel.add(f);
    b.vel.sub(f);
  }

  // Integrate
  for (const n of nodes) {
    n.vel.add(n.pos.clone().multiplyScalar(-physicsParams.centerPull));
    n.vel.multiplyScalar(physicsParams.damping);
    n.pos.add(n.vel.clone().multiplyScalar(0.02));
  }
}
