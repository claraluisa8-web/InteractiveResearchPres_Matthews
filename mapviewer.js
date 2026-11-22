// Map viewer: opens a topic's SVG map over the chart, with pan/zoom and clickable hotspots.
// A topic whose map is a gallery (map.gallery: true) opens one image at a time instead, with
// arrows, dots and the arrow keys to move between them; each image's note shows in the notes card.

// The gallery icon (pictures in a frame), used beside "View gallery" and on the tree's badge.
const galleryIcon = () => `<svg class="map-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor"><path d="${GALLERY_ICON_PATH}"/></svg>`;
const GALLERY_ICON_PATH = "M2.5 2h11l.5.5v11l-.5.5h-11l-.5-.5v-11l.5-.5zM3 3v7.3l2.65-2.65h.7L9 10.3l1.65-1.65h.7L13 10.3V3H3zm0 10h10v-1.3l-2-2-1.65 1.65h-.7L6 8.7l-3 3V13zm7.5-6.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z";

function createMapViewer({onHotspot, onClose, onOpen = () => {}, onTopic = () => {}}) {
  const viewer = document.getElementById("map-viewer");
  const title = document.getElementById("map-title");
  const canvas = document.getElementById("map-canvas");
  const closeButton = document.getElementById("map-close");
  const cache = new Map();
  let current = null;
  const mark = document.querySelector("#map-viewer .map-mark");
  const MAP_ICON = mark.innerHTML;

  // Drag to pan and scroll to zoom. The map is moved with a CSS transform.
  const zoom = d3.zoom()
      .filter(event => !current?.data.map.gallery && (!event.ctrlKey || event.type === "wheel") && !event.button)
      .scaleExtent([0.5, 4]) // the big maps (stakeholder, ecosystem, journey) need about 4x to read
      .on("zoom", ({transform}) => {
        const svg = canvas.firstElementChild;
        if (svg) svg.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
      });
  d3.select(canvas).call(zoom).on("dblclick.zoom", null);
  const quick = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200);

  // The light card takes the map's own proportions (a tall map gets a portrait card), as large
  // as the space allows, so there are no wide empty margins around it.
  function fitCard() {
    const svg = canvas.querySelector(":scope > svg");
    const vb = svg?.viewBox?.baseVal;
    if (!vb || !vb.width) return;
    const cs = getComputedStyle(canvas);
    const W = canvas.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = canvas.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const aspect = vb.width / vb.height;
    let w = W, h = W / aspect;
    if (h > H) { h = H; w = H * aspect; }
    svg.style.width = `${Math.floor(w)}px`;
    svg.style.height = `${Math.floor(h)}px`;
    // Zoom and pan are worked out from the canvas's corner, so scale from there too.
    // (An <svg> has no offsetLeft; it's centered in the canvas, so work its corner out.)
    const left = (canvas.clientWidth - Math.floor(w)) / 2, top = (canvas.clientHeight - Math.floor(h)) / 2;
    svg.style.transformOrigin = `${-left}px ${-top}px`;
  }
  new ResizeObserver(fitCard).observe(canvas);

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
    document.querySelector(".map-hint").textContent = map.gallery
      ? "Use the arrows, the dots or the arrow keys to move between images."
      : map.flow ? "Click any step, arrow or yes / no to move through the flow. The notes card shows where each step goes."
      : map.enlarge === false
      ? "Click a highlighted area to read about it. Drag to pan; zoom with the buttons or by scrolling."
      : "Click a highlighted area to see it larger. Drag to pan; zoom with the buttons or by scrolling.";
    current = d;
    title.textContent = d.data.name;
    canvas.replaceChildren();
    viewer.classList.toggle("is-gallery", !!map.gallery);
    mark.innerHTML = map.gallery ? galleryIcon() : MAP_ICON;
    gallery = null;
    endFlow();
    viewer.hidden = false;
    requestAnimationFrame(() => viewer.classList.add("open"));
    d3.select(canvas).call(zoom.transform, d3.zoomIdentity);
    if (map.gallery) return openGallery(d);

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
    fitCard();

    // Each hotspot is a button: focusable, named from its title, opened by click, Enter or Space.
    sections = [];
    stepWord = map.step || null;
    for (const [id, info] of Object.entries(map.hotspots || {})) {
      const el = svg.querySelector(`#${CSS.escape(id)}`);
      if (!el) continue;
      el.classList.add("hotspot");
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", info.title);
      const activate = () => {
        if (map.flow) return flowGo(id);
        svg.querySelectorAll(".hotspot.active").forEach(h => h.classList.remove("active"));
        el.classList.add("active");
        onHotspot(d, info);
        // Some maps (the Journey Map's very long phases) don't open a zoomed view; the note is enough.
        if (map.enlarge !== false) return enlarge(svg, el, info);
      };
      sections.push({el, activate});
      el.addEventListener("click", activate);
      el.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        activate();
      });
    }
    if (map.flow) startFlow(svg, d);
    onOpen(d);
    if (map.flow) flowOverview();
  }

  // A flow (map.flow: the User Flow): it opens on the whole diagram. Clicking any step, arrow or
  // yes/no badge moves there and zooms to it (hover is the only highlight), and the notes card offers the way(s) on (Next, or Yes / No at a decision), Back and
  // Start over. Right arrow takes the only way on; left arrow goes back.
  let flow = null; // {svg, d, at, history}
  const flowPanel = () => {
    let el = document.getElementById("detail-flow");
    if (!el) {
      el = document.createElement("div");
      el.id = "detail-flow";
      document.getElementById("detail-note").after(el);
    }
    return el;
  };
  function startFlow(svg, d) {
    flow = {svg, d, at: null, history: []};
    svg.querySelectorAll(".pmr-flow-edge").forEach(edge => {
      edge.addEventListener("click", event => {
        event.stopPropagation();
        flowGo(edge.dataset.to);
      });
    });
  }
  function flowWays(id) {
    const info = flow.d.data.map.hotspots[id];
    if (!info) return [];
    if (info.yes || info.no) return [["Yes", info.yes], ["No", info.no]].filter(([, to]) => to);
    return info.next ? [["Next", info.next]] : [];
  }
  function flowGo(id, {fresh = false, back = false} = {}) {
    if (!flow || !flow.d.data.map.hotspots[id]) return;
    if (fresh) flow.history = [];
    else if (!back && flow.at && flow.at !== id) flow.history.push(flow.at);
    flow.at = id;
    const {svg, d} = flow;
    // No lasting selection on the diagram: the zoom shows which step it is, and outlines and
    // arrows only light up on hover.
    const info = d.data.map.hotspots[id];
    onHotspot(d, info);
    renderFlowPanel();
    frameStep(id);
  }
  // Frame the step the person just moved to, close enough to read: the step and where it goes
  // next if they fit at a legible size, otherwise the step itself, centered. This moves only in
  // answer to a click or key (never on its own); with reduced motion it jumps instead of gliding.
  // Fit (or the zoom buttons) still shows the whole flow.
  const LEGIBLE = 300; // a step box (378 units wide) is at least this many screen pixels wide
  function frameStep(id) {
    const svg = flow.svg;
    const vb = svg.viewBox.baseVal;
    const sw = parseFloat(svg.style.width), sh = parseFloat(svg.style.height);
    const s0 = sw / vb.width; // screen px per unit at "Fit"
    const box = el => el?.firstElementChild?.getBBox();
    const ids = [id, ...flowWays(id).map(([, to]) => to)];
    const boxes = ids.map(i => box(svg.querySelector(`#${CSS.escape(i)}`))).filter(Boolean);
    if (!boxes.length || !s0) return;
    const cw = canvas.clientWidth, ch = canvas.clientHeight, pad = 48;
    const legible = Math.min(4, LEGIBLE / (378 * s0));
    const union = boxes.reduce((a, b) => ({x0: Math.min(a.x0, b.x), y0: Math.min(a.y0, b.y), x1: Math.max(a.x1, b.x + b.width), y1: Math.max(a.y1, b.y + b.height)}),
      {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity});
    const fitUnion = Math.min((cw - 2 * pad) / ((union.x1 - union.x0) * s0), (ch - 2 * pad) / ((union.y1 - union.y0) * s0));
    const useUnion = fitUnion >= legible;
    const k = useUnion ? Math.min(fitUnion, legible * 1.3, 4) : legible;
    const b = useUnion ? union : {x0: boxes[0].x, y0: boxes[0].y, x1: boxes[0].x + boxes[0].width, y1: boxes[0].y + boxes[0].height};
    const cx = (b.x0 + b.x1) / 2 - vb.x, cy = (b.y0 + b.y1) / 2 - vb.y;
    // The card is centered in the canvas, and zoom scales from the canvas's corner.
    const left = (cw - sw) / 2, top = (ch - sh) / 2;
    const t = d3.zoomIdentity.translate(cw / 2 - k * (left + cx * s0), ch / 2 - k * (top + cy * s0)).scale(k);
    d3.select(canvas).transition().duration(quick() ? 450 : 0).call(zoom.transform, t);
  }
  // The whole flow with nothing selected: what it opens on, and what Start over returns to.
  function flowOverview() {
    if (!flow) return;
    flow.at = null;
    flow.history = [];
    onTopic(flow.d); // the notes card goes back to the User Flow topic itself
    renderFlowPanel();
    d3.select(canvas).transition().duration(quick() ? 450 : 0).call(zoom.transform, d3.zoomIdentity);
  }
  function renderFlowPanel() {
    const panel = flowPanel();
    panel.hidden = false;
    const hotspots = flow.d.data.map.hotspots;
    const button = (label, cls, onClick) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = cls;
      b.innerHTML = label;
      b.addEventListener("click", onClick);
      return b;
    };
    // One way on is the primary button; at a decision, Yes and No look alike.
    const choice = flowWays(flow.at).length > 1 ? " is-choice" : "";
    if (!flow.at) {
      const first = Object.keys(hotspots)[0];
      const heading = document.createElement("p");
      heading.className = "flow-heading";
      heading.textContent = "Start at the beginning, or click any step";
      const start = button('<span class="flow-word">Start</span><span class="flow-to"></span>', "flow-way", () => flowGo(first));
      start.querySelector(".flow-to").textContent = hotspots[first].title;
      panel.replaceChildren(heading, start);
      return;
    }
    const ways = flowWays(flow.at).map(([word, to]) => button(
      `<span class="flow-word">${word}</span><span class="flow-to"></span>`, `flow-way${choice}`, () => flowGo(to)));
    flowWays(flow.at).forEach(([, to], i) => { ways[i].querySelector(".flow-to").textContent = hotspots[to].title; });
    const row = document.createElement("div");
    row.className = "flow-row";
    const back = button("Back", "flow-small", () => flowGo(flow.history.pop(), {back: true}));
    back.disabled = !flow.history.length;
    row.append(back, button("Show whole flow", "flow-small", flowOverview));
    const heading = document.createElement("p");
    heading.className = "flow-heading";
    heading.textContent = ways.length ? (ways.length > 1 ? "Choose an answer" : "Where it goes next") : "End of the flow";
    panel.replaceChildren(heading, ...ways, row);
  }
  function endFlow() {
    flow = null;
    const panel = document.getElementById("detail-flow");
    if (panel) panel.hidden = true;
  }
  window.addEventListener("keydown", event => {
    if (!flow || !current || !box.hidden || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    if (event.target.closest?.("input, textarea, [contenteditable]")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === "ArrowLeft") { if (flow.history.length) flowGo(flow.history.pop(), {back: true}); return; }
    if (!flow.at) return flowGo(Object.keys(flow.d.data.map.hotspots)[0]);
    const ways = flowWays(flow.at);
    if (ways.length === 1) flowGo(ways[0][1]);
  }, true);

  // A gallery: one image at a time, sized to fit, with Previous / Next arrows and a dot per image.
  // The image's title and note go to the notes card, like a map section's.
  const CHEVRON = dir => `<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="${dir < 0
    ? "M5.928 7.976l4.357 4.357-.618.62L5 8.284v-.618L9.667 3l.618.619-4.357 4.357z"
    : "M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"}"/></svg>`;
  let gallery = null; // {d, slides, index, img, dots, prev, next, count}
  function openGallery(d) {
    const slides = Object.values(d.data.map.hotspots || {});
    const wrap = document.createElement("div");
    wrap.className = "gallery";
    wrap.innerHTML = `
      <figure class="gallery-stage"><img alt=""></figure>
      <div class="gallery-nav">
        <button type="button" class="gallery-arrow" data-step="-1" aria-label="Previous image">${CHEVRON(-1)}</button>
        <ol class="gallery-dots"></ol>
        <button type="button" class="gallery-arrow" data-step="1" aria-label="Next image">${CHEVRON(1)}</button>
      </div>
      <p class="gallery-count" aria-live="polite"></p>`;
    const dots = slides.map((info, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "gallery-dot";
      b.setAttribute("aria-label", `${i + 1}: ${info.title}`);
      b.addEventListener("click", () => showSlide(i));
      li.append(b);
      return li;
    });
    wrap.querySelector(".gallery-dots").append(...dots);
    canvas.append(wrap);
    gallery = {d, slides, index: -1, img: wrap.querySelector("img"), dots: dots.map(li => li.firstChild),
      prev: wrap.querySelector('[data-step="-1"]'), next: wrap.querySelector('[data-step="1"]'), count: wrap.querySelector(".gallery-count")};
    wrap.querySelectorAll(".gallery-arrow").forEach(b => b.addEventListener("click", () => showSlide(gallery.index + Number(b.dataset.step))));
    onOpen(d);
    showSlide(0);
  }
  function showSlide(i) {
    const g = gallery;
    if (!g || i < 0 || i >= g.slides.length) return;
    g.index = i;
    const info = g.slides[i];
    g.img.src = info.image;
    g.img.alt = info.title;
    g.dots.forEach((b, k) => (k === i ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current")));
    g.prev.disabled = i === 0;
    g.next.disabled = i === g.slides.length - 1;
    g.count.textContent = `${i + 1} of ${g.slides.length} · ${info.title}`;
    onHotspot(g.d, info);
  }
  // Left and right arrows move through the gallery while it's open (before the tree's own arrow keys).
  window.addEventListener("keydown", event => {
    if (!gallery || !current || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    if (event.target.closest?.("input, textarea, [contenteditable]")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showSlide(gallery.index + (event.key === "ArrowRight" ? 1 : -1));
  }, true);

  // Clicking a section opens it enlarged: a full-window view of just that part of the map, with
  // its title and note. Esc, the close button or a click outside closes it and returns focus.
  const CLOSE_ICON = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const box = document.createElement("div");
  box.id = "map-enlarged";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "map-enlarged-title");
  box.hidden = true;
  // The zoom buttons reuse the map header's icons.
  const icon = id => document.querySelector(`#${id} svg`)?.outerHTML ?? "";
  box.innerHTML = `<div class="enlarged-card">
      <div class="enlarged-figure"></div>
      <div class="enlarged-aside">
        <div class="enlarged-tools">
          <div class="map-zoom enlarged-zoom" role="group" aria-label="Zoom">
            <button type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out">${icon("map-zoom-out")}</button>
            <button type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in">${icon("map-zoom-in")}</button>
            <button type="button" data-zoom="fit" aria-label="Fit" title="Fit">${icon("map-fit")}<span>Fit</span></button>
          </div>
          <button type="button" class="enlarged-close" aria-label="Close enlarged view (Esc)">${CLOSE_ICON}</button>
        </div>
        <h2 id="map-enlarged-title"></h2>
        <div class="enlarged-note"></div>
        <div class="enlarged-steps" hidden>
          <button type="button" data-step="-1"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.928 7.976l4.357 4.357-.618.62L5 8.284v-.618L9.667 3l.618.619-4.357 4.357z"/></svg><span></span></button>
          <span class="enlarged-count" aria-live="polite"></span>
          <button type="button" data-step="1"><span></span><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"/></svg></button>
        </div>
        <p class="enlarged-hint">Drag to move. Pinch, Ctrl + scroll or the buttons to zoom.</p>
      </div>
    </div>`;
  document.body.append(box);
  const card = box.querySelector(".enlarged-card");
  const figure = box.querySelector(".enlarged-figure");
  let returnFocus = null;
  // Stepping through a map's sections from the zoomed view ("Next ring", "Next segment"), so
  // nobody has to close it to see the next part. Order is the order the sections are listed in.
  let sections = [];
  let stepWord = null;
  const steps = box.querySelector(".enlarged-steps");
  function showSteps(el) {
    const i = sections.findIndex(s => s.el === el);
    steps.hidden = !stepWord || i < 0;
    if (steps.hidden) return;
    const [prev, next] = steps.querySelectorAll("button");
    prev.querySelector("span").textContent = `Previous ${stepWord}`;
    next.querySelector("span").textContent = `Next ${stepWord}`;
    prev.disabled = i === 0;
    next.disabled = i === sections.length - 1;
    steps.querySelector(".enlarged-count").textContent = `${i + 1} of ${sections.length}`;
  }
  async function step(delta) {
    const i = sections.findIndex(s => s.el === returnFocus);
    const target = sections[i + delta];
    if (!target) return;
    await target.activate();
    const button = steps.querySelector(`[data-step="${delta}"]`);
    (button.disabled ? steps.querySelector(`[data-step="${-delta}"]`) : button).focus();
  }
  steps.addEventListener("click", event => {
    const b = event.target.closest("button[data-step]");
    if (b && !b.disabled) step(Number(b.dataset.step));
  });
  // Left and right arrows step too while the zoomed view is open (before the tree's own arrow keys).
  window.addEventListener("keydown", event => {
    if (box.hidden || !stepWord || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    step(event.key === "ArrowRight" ? 1 : -1);
  }, true);
  let fitTransform = d3.zoomIdentity;

  // Pan and zoom inside the enlarged view. The wheel scrolls (a tall section reads top to bottom);
  // Ctrl + wheel or a pinch zooms; dragging pans. Zoom goes from the whole section to 4x its fit.
  const bigZoom = d3.zoom()
      .filter(event => (event.type === "wheel" ? event.ctrlKey : !event.button))
      .on("zoom", ({transform}) => {
        const svg = figure.firstElementChild;
        if (svg) svg.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
      });
  d3.select(figure).call(bigZoom).on("dblclick.zoom", null);
  figure.addEventListener("wheel", event => {
    if (event.ctrlKey) return;
    event.preventDefault();
    const t = d3.zoomTransform(figure);
    bigZoom.translateBy(d3.select(figure), -event.deltaX / t.k, -event.deltaY / t.k);
  }, {passive: false});
  box.querySelector(".enlarged-zoom").addEventListener("click", event => {
    const which = event.target.closest("button")?.dataset.zoom;
    const sel = d3.select(figure).transition().duration(quick());
    if (which === "in") sel.call(bigZoom.scaleBy, 1.5);
    else if (which === "out") sel.call(bigZoom.scaleBy, 1 / 1.5);
    else if (which === "fit") sel.call(bigZoom.transform, fitTransform);
  });

  // Clicking a section opens it enlarged, whole, with its title and note beside it (above it for
  // very wide sections). Esc, the close button or a click outside closes it and returns focus.
  async function enlarge(svg, el, info) {
    let copy, vb;
    if (info.zoom) {
      // This section has its own export from Figma: show that instead of a crop of the map.
      const img = new Image();
      img.src = info.zoom;
      try { await img.decode(); } catch { return; }
      const m = Math.round(Math.min(img.naturalWidth, img.naturalHeight) * 0.08);
      vb = {x: -m, y: -m, w: img.naturalWidth + 2 * m, h: img.naturalHeight + 2 * m};
      copy = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
      image.setAttribute("href", info.zoom);
      image.setAttribute("width", img.naturalWidth);
      image.setAttribute("height", img.naturalHeight);
      copy.append(image);
    } else {
      const b = el.getBBox();
      const pad = Math.min(b.width, b.height) * 0.08;
      vb = {x: b.x - pad, y: b.y - pad, w: b.width + 2 * pad, h: b.height + 2 * pad};
      copy = svg.cloneNode(true);
      copy.querySelectorAll(".hotspot").forEach(h => h.remove());
      copy.removeAttribute("style");
      copy.removeAttribute("class");
      // A ring, quadrant or circle isn't a rectangle, so the crop still shows its neighbours:
      // dim everything outside the section and outline it.
      const shape = el.firstElementChild;
      if (shape?.localName === "path") {
        const ns = "http://www.w3.org/2000/svg";
        const dim = document.createElementNS(ns, "path");
        dim.setAttribute("d", `M${vb.x},${vb.y}h${vb.w}v${vb.h}h${-vb.w}Z ${shape.getAttribute("d")}`);
        dim.setAttribute("fill-rule", "evenodd");
        dim.setAttribute("fill", "#FFFFFF");
        dim.setAttribute("fill-opacity", "0.82");
        const edge = document.createElementNS(ns, "path");
        edge.setAttribute("d", shape.getAttribute("d"));
        edge.setAttribute("fill", "none");
        edge.style.stroke = "var(--pmr-lavender)";
        edge.setAttribute("stroke-width", "2");
        edge.setAttribute("vector-effect", "non-scaling-stroke");
        copy.append(dim, edge);
      }
    }
    const aspect = vb.w / vb.h;
    copy.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    copy.setAttribute("aria-hidden", "true");

    box.querySelector("#map-enlarged-title").textContent = info.title;
    box.querySelector(".enlarged-note").replaceChildren(...(info.note || "").split("\n").filter(l => l.trim()).map(line => {
      const p = document.createElement("p");
      p.textContent = line;
      return p;
    }));
    figure.replaceChildren(copy);
    returnFocus = el;
    box.hidden = false;

    // Layout. The whole section shows, as large as the window allows (at most 1240px wide):
    // - most sections sit beside a 300px text panel, so the image gets the full height;
    // - very wide ones (aspect over 1.6, like the pain point charts) have the text above them;
    // - a strip too narrow to read whole (a journey phase) shows at a readable width from the top.
    const PAD = 16, GAP = 16, ASIDE = 300;
    const maxW = Math.min(window.innerWidth - 48, 1240);
    const maxH = window.innerHeight - 48;
    const stacked = aspect > 1.6;
    card.classList.toggle("is-stacked", stacked);
    const aside = box.querySelector(".enlarged-aside");
    let w, h, figH;
    if (!stacked) {
      card.style.width = "";
      const availW = maxW - 2 * PAD - GAP - ASIDE;
      const availH = maxH - 2 * PAD;
      w = Math.min(availW, availH * aspect);
      h = w / aspect;
      figH = h;
      if (w < 300) {
        w = Math.min(480, availW);
        h = w / aspect;
        figH = Math.min(h, availH);
      }
    } else {
      const availW = maxW - 2 * PAD;
      w = availW;
      for (let pass = 0; pass < 2; pass++) {
        card.style.width = `${w + 2 * PAD}px`;
        figure.style.height = "0px";
        const availH = maxH - 2 * PAD - GAP - aside.offsetHeight;
        w = Math.min(availW, availH * aspect);
      }
      h = w / aspect;
      figH = h;
      card.style.width = `${w + 2 * PAD}px`;
    }
    figure.style.width = `${w}px`;
    figure.style.height = `${figH}px`;
    copy.setAttribute("width", w);
    copy.setAttribute("height", h);
    const figW = w;
    fitTransform = d3.zoomIdentity;
    bigZoom
        .scaleExtent([Math.min(1, figH / h), 4])
        .extent([[0, 0], [figW, figH]])
        .translateExtent([[0, 0], [w, Math.max(h, figH)]]);
    d3.select(figure).call(bigZoom.transform, fitTransform);
    showSteps(el);
    box.querySelector(".enlarged-close").focus();
  }
  function closeEnlarged() {
    if (box.hidden) return false;
    box.hidden = true;
    figure.replaceChildren();
    card.style.width = "";
    card.classList.remove("is-stacked");
    returnFocus?.focus();
    return true;
  }
  box.querySelector(".enlarged-close").addEventListener("click", closeEnlarged);
  box.addEventListener("click", event => { if (event.target === box) closeEnlarged(); });

  // "Show hotspots": outline every hotspot for a moment.
  let flashTimer;
  function flashHotspots() {
    const svg = canvas.querySelector(":scope > svg");
    if (!svg) return;
    clearTimeout(flashTimer);
    svg.classList.add("show-hotspots");
    flashTimer = setTimeout(() => svg.classList.remove("show-hotspots"), 2000);
  }

  function close() {
    if (!current) return;
    closeEnlarged();
    current = null;
    gallery = null;
    endFlow();
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
