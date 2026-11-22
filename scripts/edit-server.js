// Local editing server for the tree map's wording. Serves the site at http://localhost:8010 and
// lets the notes panel save titles, notes, quotes and map-section text straight into data.js.
// Only listens on this computer (127.0.0.1); the published site never has this.
//   node scripts/edit-server.js     (or: npm run edit)
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataPath = path.join(root, "data.js");
const PORT = Number(process.env.PORT) || 8010;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json",
  ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
};

function load() {
  const src = fs.readFileSync(dataPath, "utf8");
  const data = new Function(src + ";return data;")();
  return {src, data};
}

// Write data.js back out: the file's header comments stay, the tree is written in the same shape.
const q = JSON.stringify;
const ORDER = ["stage", "name", "short", "revised", "note", "quote", "response", "prototype", "map", "children"];
function ser(node, ind) {
  const pad = " ".repeat(ind);
  const keys = Object.keys(node).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  if (node.response && keys.length === 2) return `response(${q(node.name)})`;
  const parts = keys.map(k => {
    const v = node[k];
    if (k === "children") return `children: [\n${v.map(c => pad + "    " + ser(c, ind + 4)).join(",\n")}\n${pad}  ]`;
    if (k === "map") {
      const hs = Object.entries(v.hotspots || {}).map(([id, h]) =>
        `${pad}      ${q(id)}: { title: ${q(h.title)}, note: ${q(h.note)}${h.zoom ? `, zoom: ${q(h.zoom)}` : ""}${h.image ? `, image: ${q(h.image)}` : ""} }`).join(",\n");
      const enlarge = v.enlarge === false ? `\n${pad}    enlarge: false,` : "";
      const step = v.step ? `\n${pad}    step: ${q(v.step)},` : "";
      const head = v.gallery ? `\n${pad}    gallery: true,` : `\n${pad}    src: ${q(v.src)},`;
      return `map: {${head}${enlarge}${step}\n${pad}    hotspots: {\n${hs}\n${pad}    }\n${pad}  }`;
    }
    if (k === "prototype") return `prototype: { src: ${q(v.src)}, title: ${q(v.title)} }`;
    if (k === "quote") return `quote: { text: ${q(v.text)}, who: ${q(v.who)} }`;
    return `${k}: ${typeof v === "string" ? q(v) : v}`;
  });
  const flat = keys.every(k => typeof node[k] !== "object" || (k === "children" && node[k].every(c => c.response && Object.keys(c).length === 2)));
  const one = `{ ${parts.join(", ")} }`;
  if (flat && !one.includes("\n") && one.length + ind < 120) return one;
  return `{\n${parts.map(p => pad + "  " + p).join(",\n")}\n${pad}}`;
}
function save(src, data) {
  const header = src.slice(0, src.indexOf("const data = {"));
  const keys = Object.keys(data).filter(k => k !== "children");
  const out = `${header}const data = {\n${keys.map(k => `  ${k}: ${q(data[k])},`).join("\n")}\n  children: [\n${data.children.map(c => "    " + ser(c, 4)).join(",\n")}\n  ]\n};\n`;
  // Check the result still loads before replacing the file.
  new Function(out + ";return data;")();
  fs.writeFileSync(dataPath + ".tmp", out);
  fs.renameSync(dataPath + ".tmp", dataPath);
}

function apply(body) {
  const {path: at, hotspot, fields} = body;
  const {src, data} = load();
  let node = data;
  for (const i of at) {
    node = node.children?.[i];
    if (!node) throw new Error("That topic no longer exists. Reload the page.");
  }
  const clean = v => String(v).replace(/\r\n?/g, "\n").replace(/\n{2,}/g, "\n").trim();
  if (hotspot) {
    const h = node.map?.hotspots?.[hotspot];
    if (!h) throw new Error("That map section no longer exists. Reload the page.");
    if (fields.title !== undefined) h.title = clean(fields.title);
    if (fields.note !== undefined) h.note = clean(fields.note);
  } else {
    if (fields.name !== undefined) {
      if (!clean(fields.name)) throw new Error("A topic needs a title.");
      node.name = clean(fields.name);
    }
    if (fields.note !== undefined) {
      if (clean(fields.note)) node.note = clean(fields.note);
      else delete node.note;
    }
    if (fields.quote !== undefined && node.quote) node.quote.text = clean(fields.quote);
  }
  save(src, data);
  return node;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/ping") {
    res.writeHead(200, {"Content-Type": "application/json"});
    return res.end('{"editing":true}');
  }
  if (url.pathname === "/api/save" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; if (body.length > 1e6) req.destroy(); });
    req.on("end", () => {
      try {
        apply(JSON.parse(body));
        console.log(`Saved ${new Date().toLocaleTimeString()}`);
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end('{"ok":true}');
      } catch (error) {
        res.writeHead(400, {"Content-Type": "application/json"});
        res.end(JSON.stringify({ok: false, error: error.message}));
      }
    });
    return;
  }
  // Static files; /prototype/ comes from the built prototype if there is one.
  let file = decodeURIComponent(url.pathname);
  if (file.endsWith("/")) file += "index.html";
  const base = file.startsWith("/prototype/") ? path.join(root, "prototype-src", "dist") : root;
  const full = path.join(base, file.replace(/^\/prototype\//, "/"));
  if (!full.startsWith(base) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404);
    return res.end("Not found");
  }
  res.writeHead(200, {"Content-Type": TYPES[path.extname(full)] || "application/octet-stream", "Cache-Control": "no-store"});
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => console.log(`Editing the tree map at http://localhost:${PORT} (saves into data.js)`));
