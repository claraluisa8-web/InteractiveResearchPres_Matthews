// Map viewer: opens a topic's SVG map over the chart, with pan/zoom and clickable hotspots.

function createMapViewer({onHotspot, onClose, onOpen = () => {}}) {
  const viewer = document.getElementById("map-viewer");
  const title = document.getElementById("map-title");
  const canvas = document.getElementById("map-canvas");
  const closeButton = document.getElementById("map-close");
  const cache = new Map();
  let current = null;

  // Drag to pan and scroll to zoom. The map is moved with a CSS transform.
  const zoom = d3.zoom()
      .scaleExtent([0.5, 4]) // the big maps (stakeholder, ecosystem, journey) need about 4x to read
      .on("zoom", ({transform}) => {
        const svg = canvas.firstElementChild;
        if (svg) svg.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
      });
  d3.select(canvas).call(zoom).on("dblclick.zoom", null);
  const quick = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200);

  async function load(src) {
    if (!cache.has(src)) {
      cache.set(src, fetch(src).then(r => {
        if (!r.ok) throw new Error(`Couldn't load ${src}`);
        return r.text();
      }));
    }
    return cache.get(src);
  }

  async function open(d) {
    const map = d.data.map;
    current = d;
    title.textContent = d.data.name;
    canvas.replaceChildren();
    viewer.hidden = false;
    requestAnimationFrame(() => viewer.classList.add("open"));
    d3.select(canvas).call(zoom.transform, d3.zoomIdentity);

    let text;
    try {
      text = await load(map.src);
    } catch (error) {
      canvas.textContent = error.message;
      return;
    }
    if (current !== d) return; // another map was opened while this one loaded

    const svg = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
    // Drop anything executable from the file before putting it on the page. <image> stays (the
    // maps are raster exports of Figma frames), but only with a relative path; <use> only with an
    // in-file #reference.
    svg.querySelectorAll("script, foreignObject, iframe, a").forEach(el => el.remove());
    svg.querySelectorAll("*").forEach(el => {
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) el.removeAttribute(attr.name);
        else if (name === "href" || name === "xlink:href") {
          const value = attr.value.trim();
          const relative = !/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith("//");
          const ok = (el.localName === "image" && relative) || (el.localName === "use" && value.startsWith("#"));
          if (!ok) el.removeAttribute(attr.name);
        }
      }
    });
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    canvas.append(svg);

    // Each hotspot is a button: focusable, named from its title, opened by click, Enter or Space.
    for (const [id, info] of Object.entries(map.hotspots || {})) {
      const el = svg.querySelector(`#${CSS.escape(id)}`);
      if (!el) continue;
      el.classList.add("hotspot");
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", info.title);
      const activate = () => {
        svg.querySelectorAll(".hotspot.active").forEach(h => h.classList.remove("active"));
        el.classList.add("active");
        onHotspot(d, info);
        enlarge(svg, el, info);
      };
      el.addEventListener("click", activate);
      el.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        activate();
      });
    }
    onOpen(d);
  }

  // Clicking a section opens it enlarged: a full-window view of just that part of the map, with
  // its title and note. Esc, the close button or a click outside closes it and returns focus.
  const CLOSE_ICON = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const box = document.createElement("div");
  box.id = "map-enlarged";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "map-enlarged-title");
  box.hidden = true;
  box.innerHTML = `<div class="enlarged-card">
      <div class="enlarged-header">
        <div class="enlarged-text"><h2 id="map-enlarged-title"></h2><div class="enlarged-note"></div></div>
        <button type="button" class="enlarged-close" aria-label="Close enlarged view (Esc)">${CLOSE_ICON}</button>
      </div>
      <div class="enlarged-figure"></div>
    </div>`;
  document.body.append(box);
  let returnFocus = null;
  function enlarge(svg, el, info) {
    const b = el.getBBox();
    const pad = Math.min(b.width, b.height) * 0.04;
    const copy = svg.cloneNode(true);
    copy.querySelectorAll(".hotspot").forEach(h => h.remove());
    copy.removeAttribute("style");
    copy.removeAttribute("class");
    copy.setAttribute("viewBox", `${b.x - pad} ${b.y - pad} ${b.width + 2 * pad} ${b.height + 2 * pad}`);
    copy.setAttribute("aria-hidden", "true");
    box.querySelector("#map-enlarged-title").textContent = info.title;
    const note = box.querySelector(".enlarged-note");
    note.replaceChildren(...(info.note || "").split("\n").filter(l => l.trim()).map(line => {
      const p = document.createElement("p");
      p.textContent = line;
      return p;
    }));
    box.querySelector(".enlarged-figure").replaceChildren(copy);
    returnFocus = el;
    box.hidden = false;
    box.querySelector(".enlarged-close").focus();
  }
  function closeEnlarged() {
    if (box.hidden) return false;
    box.hidden = true;
    box.querySelector(".enlarged-figure").replaceChildren();
    returnFocus?.focus();
    return true;
  }
  box.querySelector(".enlarged-close").addEventListener("click", closeEnlarged);
  box.addEventListener("click", event => { if (event.target === box) closeEnlarged(); });

  // "Show hotspots": outline every hotspot for a moment.
  let flashTimer;
  function flashHotspots() {
    const svg = canvas.querySelector("svg");
    if (!svg) return;
    clearTimeout(flashTimer);
    svg.classList.add("show-hotspots");
    flashTimer = setTimeout(() => svg.classList.remove("show-hotspots"), 2000);
  }

  function close() {
    if (!current) return;
    closeEnlarged();
    current = null;
    viewer.classList.remove("open");
    viewer.hidden = true;
    onClose();
  }

  closeButton.addEventListener("click", close);

  // Zoom buttons, so nobody has to know about scroll-to-zoom. Steps of 1.5x around the centre,
  // within the same 0.5x to 4x range; Fit returns to the whole map.
  document.getElementById("map-zoom-in").addEventListener("click", () => d3.select(canvas).transition().duration(quick()).call(zoom.scaleBy, 1.5));
  document.getElementById("map-zoom-out").addEventListener("click", () => d3.select(canvas).transition().duration(quick()).call(zoom.scaleBy, 1 / 1.5));
  document.getElementById("map-fit").addEventListener("click", () => d3.select(canvas).transition().duration(quick()).call(zoom.transform, d3.zoomIdentity));

  // Escape closes the map before anything else gets the key.
  document.addEventListener("keydown", event => {
    if (current && event.key === "Escape") {
      event.stopImmediatePropagation();
      if (!closeEnlarged()) close();
    }
  }, true);

  return {open, close, flashHotspots, isOpen: () => current !== null};
}
