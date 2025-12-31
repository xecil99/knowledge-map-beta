// dataSupabase.js
import * as THREE from "three";

function cleanId(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

function loadSavedPositions() {
  try {
    return JSON.parse(localStorage.getItem("km_positions") || "{}");
  } catch {
    return {};
  }
}

export async function loadNodesFromSupabase({ supabase, state, setStatus }) {
  setStatus?.("Loading nodes (Supabase)...");
  const { data, error } = await supabase
    .from("nodes")
    .select("id,label,definition,strength,x,y,z");

  if (error) throw error;

  state.graph.nodes = (data || [])
    .map((r) => {
      const id = cleanId(r.id);
      if (!id) return null;

      const node = {
        id,
        label: (r.label || "").trim(),
        strength: r.strength == null ? null : Number(r.strength),
        meta: { definition: (r.definition || "").trim() },
        pos: new THREE.Vector3(
          Number(r.x ?? (Math.random() - 0.5) * 20),
          Number(r.y ?? (Math.random() - 0.5) * 12),
          Number(r.z ?? (Math.random() - 0.5) * 20)
        ),
        vel: new THREE.Vector3(),
      };
      return node;
    })
    .filter(Boolean);

  // override positions with local saved positions if present
  const saved = loadSavedPositions();
  for (const n of state.graph.nodes) {
    const p = saved[n.id];
    if (p) {
      n.pos.set(p[0], p[1], p[2]);
      n.vel.set(0, 0, 0);
    }
  }

  setStatus?.(`Nodes loaded (Supabase): ${state.graph.nodes.length}`);
}
