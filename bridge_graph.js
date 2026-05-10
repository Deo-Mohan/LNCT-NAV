
const fs = require('fs');
const path = 'd:/DEVELOPMENT/SmartLnctMap/client/src/data/campusGraph.js';

let content = fs.readFileSync(path, 'utf8');

// Simple parser for the JS file
const nodesMatch = content.match(/CAMPUS_NODES = (\[[\s\S]*?\]);/);
const edgesMatch = content.match(/CAMPUS_EDGES = (\[[\s\S]*?\]);/);

if (!nodesMatch || !edgesMatch) {
    console.error("Could not parse campusGraph.js");
    process.exit(1);
}

const nodes = JSON.parse(nodesMatch[1]);
const edges = JSON.parse(edgesMatch[1]);

console.log(`Original: ${nodes.length} nodes, ${edges.length} edges`);

const getDist = (c1, c2) => {
  const R = 6371e3;
  const φ1 = c1[0] * Math.PI/180;
  const φ2 = c2[0] * Math.PI/180;
  const Δφ = (c2[0]-c1[0]) * Math.PI/180;
  const Δλ = (c2[1]-c1[1]) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

let bridges = 0;
// Only bridge nodes that aren't already connected to anything or are at the end of a chain
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const d = getDist(nodes[i].coords, nodes[j].coords);
    if (d < 8.0) { // 8 meters bridge threshold to ensure connectivity
       // Check if edge already exists
       const exists = edges.some(e => (e.from === nodes[i].id && e.to === nodes[j].id) || (e.from === nodes[j].id && e.to === nodes[i].id));
       if (!exists) {
         edges.push({ from: nodes[i].id, to: nodes[j].id, weight: d });
         edges.push({ from: nodes[j].id, to: nodes[i].id, weight: d });
         bridges++;
       }
    }
  }
}

const newContent = `export const CAMPUS_NODES = ${JSON.stringify(nodes, null, 2)};\n\nexport const CAMPUS_EDGES = ${JSON.stringify(edges, null, 2)};`;
fs.writeFileSync(path, newContent);
console.log(`Added ${bridges} proximity bridge edges. Total edges: ${edges.length}`);
