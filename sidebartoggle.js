// The left sidebar can be hidden to give the tree the whole width, and shown again from a button
// at the top left of the chart. The choice is remembered on this browser (if storage works).

(function sidebarToggle() {
  const hide = document.getElementById("sidebar-hide");
  const show = document.getElementById("sidebar-show");
  const KEY = "sidebar:collapsed";

  function set(collapsed, {focus = false} = {}) {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    hide.setAttribute("aria-expanded", String(!collapsed));
    show.hidden = !collapsed;
    try { localStorage.setItem(KEY, collapsed ? "1" : "0"); } catch {}
    if (focus) (collapsed ? show : hide).focus();
  }

  hide.addEventListener("click", () => set(true, {focus: true}));
  show.addEventListener("click", () => set(false, {focus: true}));

  let saved = false;
  try { saved = localStorage.getItem(KEY) === "1"; } catch {}
  set(saved);
})();
