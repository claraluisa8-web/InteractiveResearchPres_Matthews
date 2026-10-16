// Left sidebar: search, progress through the tree, and an outline for jumping to any topic.
// Works with the chart returned by createTree() in script.js.

function createSidebar(chart) {
  const nodes = chart.nodes; // every topic, in reading order
  const visited = new Set();
  let current = null;

  const outline = document.getElementById("outline");
  const progressText = document.getElementById("progress-text");
  const progressFill = document.getElementById("progress-fill");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const input = document.getElementById("search");
  const resultList = document.getElementById("search-results");

  // Outline: one button per topic, indented by depth.
  const items = new Map();
  for (const d of nodes) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.style.setProperty("--depth", d.depth);
    button.textContent = d.data.name;
    button.title = d.data.name;
    if (d.data.response) button.classList.add("response");
    if (d.data.map) {
      const mark = document.createElement("span");
      mark.className = "map-mark";
      mark.textContent = " ✱";
      mark.title = "Has a map";
      button.append(mark);
    }
    button.addEventListener("click", event => chart.goTo(d, event));
    li.append(button);
    outline.append(li);
    items.set(d, button);
  }

  // Called by the chart whenever a node is selected, however it got selected.
  function setCurrent(d) {
    if (current) {
      items.get(current).classList.remove("current");
      items.get(current).removeAttribute("aria-current");
    }
    current = d;
    visited.add(d);

    const button = items.get(d);
    button.classList.add("current", "visited");
    button.setAttribute("aria-current", "true");
    scrollOutlineTo(button);

    progressText.textContent = `${visited.size} of ${nodes.length} topics visited`;
    progressFill.style.width = `${(visited.size / nodes.length) * 100}%`;

    const visible = visibleNodes();
    const index = visible.indexOf(d);
    prevButton.disabled = index === 0;
    nextButton.disabled = index === visible.length - 1;
  }

  // Topics currently showing in the tree (every branch above them is open), in reading order.
  function visibleNodes() {
    return nodes.filter(d => d.ancestors().slice(1).every(a => a.children));
  }

  // Keep the current item in view inside the outline without scrolling the whole page.
  function scrollOutlineTo(button) {
    const top = button.offsetTop;
    const bottom = top + button.offsetHeight;
    if (top < outline.scrollTop || bottom > outline.scrollTop + outline.clientHeight) {
      outline.scrollTop = top - outline.clientHeight / 2;
    }
  }

  // Step forward or back through the visible topics in reading order. Closed branches are
  // skipped over; click a topic in the tree to open it and step into it.
  function step(offset, event) {
    const visible = visibleNodes();
    const next = visible[visible.indexOf(current) + offset];
    if (next) chart.goTo(next, event);
  }

  prevButton.addEventListener("click", event => step(-1, event));
  nextButton.addEventListener("click", event => step(1, event));

  // Search. Every word typed must appear in the topic's name, the names of the categories
  // it sits under, or its note. Matches in the topic's own name rank first.
  let results = [];
  let active = 0;

  function search(query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return {terms, matches: []};

    const matches = nodes
      .map(d => {
        // Leave the root out of each topic's path; its long statement would match everything.
        const path = d.parent ? d.ancestors().slice(0, -1) : [d];
        const haystack = [...path.map(n => n.data.name), d.data.note || ""].join(" ").toLowerCase();
        if (!terms.every(t => haystack.includes(t))) return null;
        const name = d.data.name.toLowerCase();
        const score = terms.filter(t => name.includes(t)).length * 10 - d.depth;
        return {d, score};
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(r => r.d);

    return {terms, matches};
  }

  function renderResults() {
    const {terms, matches} = search(input.value);
    results = matches;
    active = 0;
    resultList.replaceChildren();
    resultList.hidden = !terms.length;
    if (!terms.length) return;

    if (!matches.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No matching topics";
      resultList.append(li);
      return;
    }

    matches.forEach((d, i) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.id = `result-${i}`;
      button.setAttribute("role", "option");

      const name = document.createElement("span");
      name.className = "result-name";
      name.append(highlight(d.data.name, terms));

      const path = document.createElement("span");
      path.className = "result-path";
      path.textContent = d.ancestors().slice(1, -1).reverse().map(n => n.data.name).join(" › ") || "Top level";

      button.append(name, path);
      button.addEventListener("click", event => choose(i, event));
      button.addEventListener("mousemove", () => setActive(i));
      li.append(button);
      resultList.append(li);
    });
    setActive(0);
  }

  function setActive(i) {
    active = i;
    resultList.querySelectorAll("button").forEach((b, j) => b.classList.toggle("active", j === i));
    input.setAttribute("aria-activedescendant", `result-${i}`);
  }

  function choose(i, event) {
    if (results[i]) chart.goTo(results[i], event);
  }

  function clearSearch() {
    input.value = "";
    renderResults();
  }

  input.addEventListener("input", renderResults);
  input.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActive((active + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActive((active - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(active, event);
    } else if (event.key === "Escape") {
      clearSearch();
      input.blur();
    }
  });

  // Keyboard shortcuts: "/" to search, arrows or Page Up/Down to step through topics.
  // Ignored while typing in a field.
  document.addEventListener("keydown", event => {
    if (event.target.closest("input, textarea") || event.metaKey || event.ctrlKey) return;
    if (event.key === "/") {
      event.preventDefault();
      input.focus();
    } else if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      step(1, event);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      step(-1, event);
    }
  });

  return {setCurrent};
}

// Wrap each occurrence of the search terms in <mark>, building nodes instead of HTML so
// topic names are never treated as markup.
function highlight(text, terms) {
  const lower = text.toLowerCase();
  const marked = new Array(text.length).fill(false);
  for (const term of terms) {
    for (let i = lower.indexOf(term); i !== -1; i = lower.indexOf(term, i + term.length)) {
      marked.fill(true, i, i + term.length);
    }
  }

  const fragment = document.createDocumentFragment();
  let start = 0;
  while (start < text.length) {
    let end = start;
    while (end < text.length && marked[end] === marked[start]) end++;
    const piece = text.slice(start, end);
    if (marked[start]) {
      const mark = document.createElement("mark");
      mark.textContent = piece;
      fragment.append(mark);
    } else {
      fragment.append(piece);
    }
    start = end;
  }
  return fragment;
}
