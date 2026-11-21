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

  // The light card takes the map's own proportions (a tall map gets a portrait card), as large
  // as the space allows, so there are no wide empty margins around it.
  function fitCard() {
    const svg = canvas.querySelector("svg");
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
    svg.style.transformOrigin = `${-svg.offsetLeft}px ${-svg.offsetTop}px`;
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
    document.querySelector(".map-hint").textContent = map.enlarge === false
      ? "Click a highlighted area to read about it. Drag to pan; zoom with the buttons or by scrolling."
      : "Click a highlighted area to see it larger. Drag to pan; zoom with the buttons or by scrolling.";
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
    fitCard();

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
        // Some maps (the Journey Map's very long phases) don't open a zoomed view; the note is enough.
        if (map.enlarge !== false) enlarge(svg, el, info);
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
        <p class="enlarged-hint">Drag to move. Pinch, Ctrl + scroll or the buttons to zoom.</p>
      </div>
    </div>`;
  document.body.append(box);
  const card = box.querySelector(".enlarged-card");
  const figure = box.querySelector(".enlarged-figure");
  let returnFocus = null;
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
      const m = Math.round(img.naturalWidth * 0.04);
      vb = {x: -m, y: -m, w: img.naturalWidth + 2 * m, h: img.naturalHeight + 2 * m};
      copy = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
      image.setAttribute("href", info.zoom);
      image.setAttribute("width", img.naturalWidth);
      image.setAttribute("height", img.naturalHeight);
      copy.append(image);
    } else {
      const b = el.getBBox();
      const pad = Math.min(b.width, b.height) * 0.04;
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
        dim.setAttribute("fill", "#F5F5FA");
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
