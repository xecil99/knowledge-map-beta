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
    .select("node_id,label,definition,strength,x,y,z");
    console.log("Supabase nodes rows:", (data || []).map(r => r.node_id));


  if (error) throw error;

  state.graph.nodes = (data || [])
    .map((r) => {
      const id = cleanId(r.node_id);
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

export async function loadLinksFromSupabase({ supabase, state, setStatus }) {
  setStatus?.("Loading links (Supabase)...");

  const { data, error } = await supabase
    .from("links")
    .select("from_node_id,to_node_id,strength");

  if (error) throw error;

  const seen = new Set();
  const links = [];

  for (const r of data || []) {
    const a = cleanId(r.from_node_id);
    const b = cleanId(r.to_node_id);
    const w = r.strength == null ? null : Number(r.strength);

    if (!a || !b || w == null) continue;
    if (a === b) continue;

    const k1 = `${a}->${b}`;
    const k2 = `${b}->${a}`;

    if (!seen.has(k1)) {
      links.push({ a, b, w });
      seen.add(k1);
    }
    if (!seen.has(k2)) {
      links.push({ a: b, b: a, w });
      seen.add(k2);
    }
  }

  state.graph.links = links;
  setStatus?.(`Links loaded (Supabase): ${state.graph.links.length}`);
}
