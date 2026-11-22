// Prototype viewer: opens the Pre-Merge Review prototype over the chart in an iframe.
// The iframe keeps the tree's global shortcuts (arrows, Page Up/Down, "/") and wheel zoom
// from firing while someone types or scrolls in the prototype, and keeps the two apps' CSS apart.
// See handoff/docs/embed-and-deploy.md.

function createPrototypeViewer({onClose}) {
  const viewer = document.getElementById("prototype-viewer");
  const title = document.getElementById("prototype-title");
  const frameBox = document.getElementById("prototype-frame");
  const newTab = document.getElementById("prototype-new-tab");
  const closeButton = document.getElementById("prototype-close");
  let iframe = null;
  let current = null;

  const win = viewer.querySelector(".prototype-window");
  const header = viewer.querySelector(".prototype-header");

  // The prototype opens as a framed window over the dimmed tree, not edge to edge: 16:10 (its
  // 1440x900 design), as large as fits with a margin around it, and never wider than MAX_W.
  const MAX_W = 960;
  const MARGIN = 56;
  function fit() {
    if (!iframe) return;
    const r = viewer.getBoundingClientRect();
    const head = header.offsetHeight;
    const w = Math.max(320, Math.min(r.width - MARGIN * 2, (r.height - MARGIN * 2 - head) * 1.6, MAX_W));
    win.style.width = `${Math.round(w)}px`;
    iframe.style.width = `${Math.round(w)}px`;
    iframe.style.height = `${Math.round(w / 1.6)}px`;
  }
  new ResizeObserver(fit).observe(viewer);

  // A click on the dimmed tree around the window closes it.
  viewer.addEventListener("click", event => {
    if (event.target === viewer) close();
  });

  function open(d) {
    const proto = d.data.prototype;
    if (current === d) return iframe?.focus();
    current = d;
    title.textContent = proto.title || d.data.name;
    newTab.href = `${proto.src}?reset`; // full screen starts fresh too
    iframe = document.createElement("iframe");
    iframe.title = proto.title || d.data.name;
    // `reset` clears the prototype's saved progress (it keeps it in localStorage, which this site
    // shares), the same as its own Start over: no team, no saved constellations, no reviewer.
    // Every open, in the window or full screen, starts from the beginning.
    iframe.src = `${proto.src}?embed=1&reset`;
    frameBox.replaceChildren(iframe);
    viewer.hidden = false;
    // Sized right away (not in an animation frame, which a background tab may never run).
    fit();
    iframe.focus();
    requestAnimationFrame(() => {
      if (current === d) viewer.classList.add("open"); // fade in, unless closed again already
    });
  }

  function close({restoreFocus = true} = {}) {
    if (!current) return;
    const d = current;
    current = null;
    viewer.classList.remove("open");
    viewer.hidden = true;
    frameBox.replaceChildren(); // unloads the prototype, so it starts fresh next time
    iframe = null;
    if (restoreFocus) onClose(d);
  }

  closeButton.addEventListener("click", () => close());

  // Escape inside the iframe never reaches this page, so the prototype posts a message when
  // Esc has nothing left to close there. Only messages from our own iframe count.
  window.addEventListener("message", event => {
    if (iframe && event.source === iframe.contentWindow && event.data?.type === "pmr:close") close();
  });

  // Escape on this page (the header has focus) closes the viewer before anything else gets it.
  document.addEventListener("keydown", event => {
    if (current && event.key === "Escape") {
      event.stopImmediatePropagation();
      close();
    }
  }, true);

  return {open, close, isOpen: () => current !== null};
}
