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

export async function loadNodesFromSupabase({ supabase, state, setStatus }) {
  setStatus?.("Loading nodes (Supabase)...");

  const { data, error } = await supabase
    .from("nodes")
    .select("node_id,label,definition,strength,x,y,z");

  if (error) throw error;

  state.graph.nodes = (data || [])
    .map((r) => {
      const id = cleanId(r.node_id);
      if (!id) return null;

      return {
        id,
        label: (r.label || "").trim(),
        strength: r.strength == null ? null : Number(r.strength),
        meta: { definition: (r.definition || "").trim() },
        pos: new THREE.Vector3(
          r.x == null ? (Math.random() - 0.5) * 20 : Number(r.x),
          r.y == null ? (Math.random() - 0.5) * 12 : Number(r.y),
          r.z == null ? (Math.random() - 0.5) * 20 : Number(r.z)
        ),
        vel: new THREE.Vector3(),
      };
    })
    .filter(Boolean);

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

    // store both directions so the rest of your app can treat links as undirected
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
