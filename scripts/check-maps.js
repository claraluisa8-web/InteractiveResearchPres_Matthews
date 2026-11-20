// Checks that every map hotspot in data.js exists in its SVG, every hotspot group in each SVG has
// a note in data.js, and every image an SVG points to exists. Run from the repo root:
//   node scripts/check-maps.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const data = new Function(fs.readFileSync(path.join(root, "data.js"), "utf8") + ";return data;")();

const maps = [];
(function walk(n) {
  if (n.map) maps.push({topic: n.name, src: n.map.src, ids: Object.keys(n.map.hotspots || {})});
  (n.children || []).forEach(walk);
})(data);

let problems = 0;
const report = msg => { problems++; console.log("  " + msg); };

for (const m of maps) {
  const file = path.join(root, m.src);
  console.log(`${m.topic} (${m.src}): ${m.ids.length} hotspots`);
  if (!fs.existsSync(file)) { report(`missing file ${m.src}`); continue; }
  const svg = fs.readFileSync(file, "utf8");
  const groups = [...svg.matchAll(/<g\b[^>]*\bid="([^"]+)"[^>]*class="[^"]*pmr-hotspot/g)].map(x => x[1]);
  const allIds = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]));
  for (const id of m.ids) if (!allIds.has(id)) report(`in data.js, not in the SVG: ${id}`);
  for (const id of groups) if (!m.ids.includes(id)) report(`hotspot in the SVG, no note in data.js: ${id}`);
  for (const [, href] of svg.matchAll(/<image\b[^>]*\shref="([^"]+)"/g)) {
    if (!fs.existsSync(path.join(root, href))) report(`image not found: ${href}`);
  }
}

// SVG files no topic uses.
const used = new Set(maps.map(m => path.normalize(m.src)));
for (const f of fs.readdirSync(path.join(root, "maps")).filter(f => f.endsWith(".svg"))) {
  if (!used.has(path.normalize(`maps/${f}`))) report(`maps/${f} isn't used by any topic`);
}

console.log(problems ? `\n${problems} problem(s).` : "\nAll hotspots and images match.");
process.exit(problems ? 1 : 0);
