// state.js
// Single source of truth (no Three.js objects here)

export const state = {
  graph: {
    nodes: [], // [{id,label,strength,meta:{definition}, pos:{x,y,z}, vel:{x,y,z}}]
    links: [], // [{a,b,w}]
  },
  selection: {
    nodeId: null,
  },
};
