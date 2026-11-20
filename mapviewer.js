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
    current = null;
    viewer.classList.remove("open");
    viewer.hidden = true;
    onClose();
  }

  closeButton.addEventListener("click", close);

  // Escape closes the map before anything else gets the key.
  document.addEventListener("keydown", event => {
    if (current && event.key === "Escape") {
      event.stopImmediatePropagation();
      close();
    }
  }, true);

  return {open, close, flashHotspots, isOpen: () => current !== null};
}
