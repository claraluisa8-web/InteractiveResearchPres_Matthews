// Guided path: walks the research in stages (the "stage" field on each top-level branch, 1-8),
// starting from the problem statement (the root). Free exploration keeps working: whatever a
// visitor clicks, the stage bar follows the stage that topic belongs to.
// Buttons, the dots, and "[" / "]" move between stages; #stage-3 opens the path at Stage 3.

function createGuidedPath({chart, isBlocked = () => false}) {
  const root = chart.root;
  const stages = (root.data.children || [])
    .map((data, i) => ({data, node: (root.children || root._children)[i]}))
    .filter(s => s.data.stage)
    .sort((a, b) => a.data.stage - b.data.stage)
    .map(s => s.node);

  const entry = document.getElementById("guide-entry");
  const bar = document.getElementById("guide-bar");
  const status = document.getElementById("guide-status");
  const prev = document.getElementById("guide-prev");
  const next = document.getElementById("guide-next");
  const nextLabel = next.querySelector("span");
  const dots = document.getElementById("guide-dots");
  let on = false;
  let explored = false;
  let index = -1; // -1 is the problem statement, 0-7 the stages
  let current = root;

  const label = d => d.data.short || d.data.name;
  const stageOf = d => {
    if (!d || d === root) return -1;
    const top = d.ancestors().find(n => n.depth === 1);
    return stages.indexOf(top);
  };

  // One dot per stage; clicking one jumps there.
  stages.forEach((s, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "guide-dot";
    b.setAttribute("aria-label", `Stage ${i + 1}: ${label(s)}`);
    b.addEventListener("click", () => go(i));
    li.append(b);
    dots.append(li);
  });

  function render() {
    entry.hidden = on || explored || current !== root;
    bar.hidden = !on;
    if (!on) return;
    status.textContent = index < 0
      ? `Start · ${label(root)}`
      : `Stage ${index + 1} of ${stages.length} · ${label(stages[index])}`;
    prev.disabled = index < 0;
    nextLabel.textContent = index === stages.length - 1 ? "Back to the problem" : "Next stage";
    [...dots.querySelectorAll(".guide-dot")].forEach((b, i) => {
      if (i === index) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
      b.classList.toggle("is-past", i < index);
    });
    const hash = index < 0 ? "" : `#stage-${index + 1}`;
    if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname + location.search);
  }

  // Move to a stage (-1 = the problem). Closes the branch being left and opens the new one.
  function go(i) {
    const target = i < 0 ? root : stages[i];
    const leaving = index >= 0 ? stages[index] : null;
    index = i;
    chart.guideTo(target, leaving);
  }

  function start(i = -1) {
    on = true;
    explored = false;
    if (i >= 0) go(i);
    else { index = -1; render(); }
    // Keyboard users land on Next stage in the bar they just opened.
    next.focus({preventScroll: true});
  }

  function exit() {
    on = false;
    explored = true;
    // Clear #stage-n so a reload doesn't restart the path.
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    render();
  }

  prev.addEventListener("click", () => go(index - 1));
  next.addEventListener("click", () => go(index === stages.length - 1 ? -1 : index + 1));
  document.getElementById("guide-exit").addEventListener("click", exit);
  document.getElementById("guide-start").addEventListener("click", () => start(0));
  document.getElementById("guide-explore").addEventListener("click", () => { explored = true; render(); });

  // "[" and "]" for Previous and Next. The arrow keys already step through topics (sidebar.js).
  // Ignored while typing, with a modifier held, or while the prototype is open.
  document.addEventListener("keydown", event => {
    if (!on || (event.key !== "[" && event.key !== "]")) return;
    if (event.target.closest?.("input, textarea, select, [contenteditable]") || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isBlocked()) return;
    event.preventDefault();
    if (event.key === "[") { if (index >= 0) go(index - 1); }
    else go(index === stages.length - 1 ? -1 : index + 1);
  });

  // Called whenever any topic is selected, by the path or by free exploration.
  function onSelect(d) {
    current = d;
    if (on) index = stageOf(d);
    render();
  }

  // Deep link: #stage-3 opens the guided path at Stage 3.
  const match = /^#stage-(\d+)$/.exec(location.hash);
  const deep = match ? Number(match[1]) - 1 : null;

  return {
    onSelect,
    start: () => (deep !== null && deep >= 0 && deep < stages.length ? start(deep) : render()),
    isOn: () => on,
  };
}
