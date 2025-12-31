// data.js
import * as THREE from "three";

const NODES_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRftJtRWP1c6U2X_cW-bQbQcUxVf5yV4ZupIo7ny_kjiziW96jdJ2JQZF9sfUXg_HslF5wzw-uWVYKo/pub?output=csv&gid=1909312092";

const LINKS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRftJtRWP1c6U2X_cW-bQbQcUxVf5yV4ZupIo7ny_kjiziW96jdJ2JQZF9sfUXg_HslF5wzw-uWVYKo/pub?gid=553801754&single=true&output=csv";

const META_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRftJtRWP1c6U2X_cW-bQbQcUxVf5yV4ZupIo7ny_kjiziW96jdJ2JQZF9sfUXg_HslF5wzw-uWVYKo/pub?output=csv&gid=2124445442";

// ---------- Helpers ----------
function cleanId(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}

function parseCSV(text) {
  const lines = text.trim().split("\n").map((l) => l.replace("\r", ""));
  const header = lines[0].split(",").map((s) => s.trim());
  const rows = lines.slice(1).map((line) => line.split(","));
  return { header, rows };
}

function loadSavedPositions() {
  try {
    return JSON.parse(localStorage.getItem("km_positions") || "{}");
  } catch {
    return {};
  }
}

// ---------- Public API ----------
export async function loadNodesOnce({ state, setStatus }) {
  setStatus?.("Loading nodes...");
  const text = await fetch(NODES_URL).then((r) => r.text());
  const { rows } = parseCSV(text);

  const byId = new Map(); // id -> { node, t }

  for (const parts of rows) {
    const timestampRaw = (parts[0] || "").trim();
    const t = Date.parse(timestampRaw) || 0;

    const id = cleanId(parts[2]);
    if (!id) continue;

    const node = {
      id,
      label: (parts[3] || "").trim(),
      strength: clamp01(parts[4]),
      meta: { definition: (parts[5] || "").trim() },
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 20
      ),
      vel: new THREE.Vector3(),
    };

    const prev = byId.get(id);
    if (!prev || t >= prev.t) byId.set(id, { node, t });
  }

  state.graph.nodes = Array.from(byId.values()).map((x) => x.node);

  const saved = loadSavedPositions();
  for (const n of state.graph.nodes) {
    const p = saved[n.id];
    if (p) {
      n.pos.set(p[0], p[1], p[2]);
      n.vel.set(0, 0, 0);
    }
  }

  setStatus?.(`Nodes loaded: ${state.graph.nodes.length}`);
}

export async function loadLinksOnce({ state, setStatus }) {
  setStatus?.("Loading links...");
  const text = await fetch(LINKS_URL).then((r) => r.text());
  const { header, rows } = parseCSV(text);

  if (rows.length === 0) {
    state.graph.links = [];
    setStatus?.("Links loaded: 0");
    return;
  }

  const idx = {};
  header.forEach((h, i) => (idx[h] = i));

  const iFrom = idx.fromId ?? idx.from;
  const iTo = idx.toId ?? idx.to ?? idx.told;
  const iW = idx.strength;

  if (iFrom === undefined || iTo === undefined || iW === undefined) {
    console.warn("LINKS HEADER PROBLEM:", header);
    state.graph.links = [];
    setStatus?.("Links loaded: 0 (bad header)");
    return;
  }

  const rawLinks = rows.map((p) => ({
    a: cleanId(p[iFrom]),
    b: cleanId(p[iTo]),
    w: clamp01(p[iW]),
  }));

  const seen = new Set();
  const links = [];

  for (const L of rawLinks) {
    if (!L.a || !L.b || L.w === null) continue;
    if (L.a === L.b) continue;

    const k1 = `${L.a}->${L.b}`;
    const k2 = `${L.b}->${L.a}`;

    if (!seen.has(k1)) {
      links.push({ a: L.a, b: L.b, w: L.w });
      seen.add(k1);
    }
    if (!seen.has(k2)) {
      links.push({ a: L.b, b: L.a, w: L.w });
      seen.add(k2);
    }
  }

  state.graph.links = links;
  setStatus?.(`Links loaded: ${state.graph.links.length}`);
}

export async function reloadGraph({ state, setStatus, rebuildScene }) {
  await loadNodesOnce({ state, setStatus });
  await loadLinksOnce({ state, setStatus });
  rebuildScene();
  setStatus?.("Reloaded from Sheets.");
}

export function createUpdateChecker({ setStatus, onChangeReload }) {
  let lastStamp = null;

  return async function checkForUpdates() {
    const text = await fetch(META_URL).then((r) => r.text());
    const lines = text.trim().split("\n");
    if (lines.length < 2) return;

    const stamp = lines[1].replace("\r", "").trim();

    if (lastStamp === null) {
      lastStamp = stamp;
      return;
    }

    if (stamp !== lastStamp) {
      lastStamp = stamp;
      setStatus?.("Update detected… reloading");
      await onChangeReload();
    }
  };
}
