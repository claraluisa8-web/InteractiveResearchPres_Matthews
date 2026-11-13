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

  // Keep the prototype's 1440×900 stage ratio, scaled to fit and letterboxed.
  function fit() {
    if (!iframe) return;
    const box = frameBox.getBoundingClientRect();
    const scale = Math.min(box.width / 1440, box.height / 900);
    iframe.style.width = `${Math.floor(1440 * scale)}px`;
    iframe.style.height = `${Math.floor(900 * scale)}px`;
  }
  new ResizeObserver(fit).observe(frameBox);

  function open(d) {
    const proto = d.data.prototype;
    if (current === d) return iframe?.focus();
    current = d;
    title.textContent = proto.title || d.data.name;
    newTab.href = proto.src;
    iframe = document.createElement("iframe");
    iframe.title = proto.title || d.data.name;
    iframe.src = `${proto.src}?embed=1`;
    frameBox.replaceChildren(iframe);
    viewer.hidden = false;
    requestAnimationFrame(() => {
      if (current !== d) return; // closed again before the next frame
      viewer.classList.add("open");
      fit();
      iframe.focus();
    });
  }

  function close() {
    if (!current) return;
    const d = current;
    current = null;
    viewer.classList.remove("open");
    viewer.hidden = true;
    frameBox.replaceChildren(); // unloads the prototype, so it starts fresh next time
    iframe = null;
    onClose(d);
  }

  closeButton.addEventListener("click", close);

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
