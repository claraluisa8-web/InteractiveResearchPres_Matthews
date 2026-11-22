// Collapsible research tree, adapted from D3's Observable "collapsible tree" example
// to run as a plain web page. Data comes from data.js.

function createTree(data, {onSelect, onOpenMap, onOpenPrototype = () => {}, onChange = () => {}, insetRight = () => 0}) {
  // The chart fills its container; width and height are measured from it (see measure()).
  // insetRight is space on the right covered by the notes card, which focus() frames around.
  let width = 0;
  let height = 0;

  // Room around a focused group of nodes, and how far the view can zoom in on it.
  const pad = 24;
  const maxFocusScale = 2.5;

  // Long labels wrap onto several lines of at most this many characters.
  const maxLineChars = 34;
  const lineHeight = 16;

  // The pearl orb is drawn at 17px and scaled down to sit in a row like any other topic.
  const pearlRadius = 17;
  const pearlScale = 12 / 17;
  const orbR = pearlRadius * pearlScale; // its size on screen

  // Rows are separated by multiples of dx pixels, columns by dy pixels. (dx is a height and
  // dy a width, because the tree is laid out sideways with the root on the left.)
  const root = d3.hierarchy(data);
  const dx = lineHeight;
  const dy = 280;

  root.each(d => d.lines = wrap(d.data.name));
  const rows = d => d.lines.length;

  // Define the tree layout and the shape for links. Neighbouring nodes are spaced by how
  // many lines their labels take up, plus a gap (bigger between different parents).
  const tree = d3.tree()
      .nodeSize([dx, dy])
      .separation((a, b) => (rows(a) + rows(b)) / 2 + (a.parent === b.parent ? 0.8 : 1.6));
  // Links leave the parent straight along its own row, bend only in the clear gap between two
  // columns' labels, then run straight into the child. So a line never cuts across a label beside
  // it. (colRight / colLeft come from placeColumns: where each column's labels end and begin.)
  let colRight = [], colLeft = [];
  function diagonal({source: s, target: t}) {
    const k = (s.depth ?? 0);
    let xa = s.y, xb = t.y;
    if (t.depth !== undefined && s !== t && t.y > s.y) {
      xa = Math.min(colRight[k] ?? s.y, t.y);
      xb = Math.max(xa, Math.min(colLeft[k + 1] ?? t.y, t.y));
    }
    const mid = (xa + xb) / 2;
    return `M${s.y},${s.x}H${xa}C${mid},${s.x} ${mid},${t.x} ${xb},${t.x}H${t.y}`;
  }

  // Create the SVG container, a zoomable layer, and inside it a layer for the links and
  // a layer for the nodes.
  const svg = d3.create("svg")
      .attr("class", "tree");

  // The pearl orb for a topic with a prototype (handoff/docs/embed-and-deploy.md): the "You"
  // orb from the prototype, drawn in SVG so it scales with the tree.
  const defs = svg.append("defs");
  // Flat orbs for every other node: a subtle 135° gradient in the canvas blues (style.css).
  const nodeGradient = defs.append("linearGradient")
      .attr("id", "node-gradient")
      .attr("x1", "0").attr("y1", "0").attr("x2", "1").attr("y2", "1");
  nodeGradient.append("stop").attr("offset", "0%").attr("stop-color", "#5B7BC4");
  nodeGradient.append("stop").attr("offset", "100%").attr("stop-color", "#22335C");

  const pearl = defs.append("linearGradient")
      .attr("id", "pearl-gradient")
      .attr("x1", "0").attr("y1", "0").attr("x2", "1").attr("y2", "1");
  pearl.append("stop").attr("offset", "0%").attr("stop-color", "#F6F2FF");
  pearl.append("stop").attr("offset", "50%").attr("stop-color", "#DDD4FF");
  pearl.append("stop").attr("offset", "100%").attr("stop-color", "#C3D6FF");
  defs.append("clipPath").attr("id", "pearl-clip")
    .append("circle").attr("r", pearlRadius);
  defs.append("filter").attr("id", "pearl-blur")
      .attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%")
    .append("feGaussianBlur").attr("stdDeviation", 2.2);
  defs.append("filter").attr("id", "pearl-glow")
      .attr("x", "-100%").attr("y", "-100%").attr("width", "300%").attr("height", "300%")
    .append("feDropShadow")
      .attr("dx", 0).attr("dy", 0).attr("stdDeviation", 6)
      .attr("flood-color", "rgb(185, 168, 255)").attr("flood-opacity", 0.45);

  const gZoom = svg.append("g");
  const gLink = gZoom.append("g").attr("class", "links");
  const gNode = gZoom.append("g").attr("class", "nodes");

  // Scroll to zoom and drag to pan. Double-click zoom is turned off so it doesn't fight
  // with clicking nodes.
  const zoom = d3.zoom()
      .scaleExtent([0.3, 4])
      .on("zoom", event => gZoom.attr("transform", event.transform));

  svg.call(zoom).on("dblclick.zoom", null);

  function placeCtas() {
    // Map icons sit 6px after the label's last line.
    svg.selectAll(".map-badge").each(function(d) {
      const label = this.parentNode.querySelector(":scope > text");
      const box = label.getBBox();
      const right = box.width ? box.x + box.width : 10 + d3.max(d.lines, l => l.length) * 7;
      const lastLine = ((d.lines.length - 1) / 2) * lineHeight;
      d3.select(this).attr("transform", `translate(${right + 6},${lastLine - 8})`);
    });
  }
  // Once Red Hat has loaded, lay out again with its real widths.
  document.fonts?.ready.then(() => { update(null, root); requestAnimationFrame(placeCtas); });

  // Columns are spaced by their labels, so no label ever runs into another column, whichever
  // branches are open. A topic with children has its label on its left; one without, on its right
  // (plus the map icon); the orb's label sits on its right too. Each gap fits the widest
  // right-side label of one column plus the widest left-side label of the next, plus a margin.
  const measureCtx = document.createElement("canvas").getContext("2d");
  const fontFamily = () => getComputedStyle(document.body).fontFamily || "sans-serif";
  function textWidth(text, weight = 600, size = 13, family = fontFamily()) {
    measureCtx.font = `${weight} ${size}px ${family}`;
    return measureCtx.measureText(text).width;
  }
  function labelWidth(d) {
    let w = d3.max(d.lines, line => textWidth(line));
    if (d.depth === 1 && d.data.stage) w += textWidth("00  ", 500, 12, "'Red Hat Mono', monospace");
    return w * 1.04; // headroom for the selected (heavier) weight and font loading
  }
  const columnGap = 64; // room for the lines to bend between columns
  const minColumn = 120;
  function placeColumns(visible) {
    const left = [], right = [];
    for (const d of visible) {
      const k = d.depth;
      left[k] ??= 0;
      right[k] ??= 0;
      if (d.data.prototype) {
        left[k] = Math.max(left[k], orbR + 8);
        right[k] = Math.max(right[k], orbR + 8 + labelWidth(d) + 10);
      } else if (d._children) {
        left[k] = Math.max(left[k], labelWidth(d) + 10);
        right[k] = Math.max(right[k], 8);
      } else {
        right[k] = Math.max(right[k], labelWidth(d) + 10 + (d.data.map ? 26 : 0));
      }
    }
    const x = [0];
    for (let k = 1; k < left.length; k++) {
      x[k] = x[k - 1] + Math.max(minColumn, (right[k - 1] || 0) + (left[k] || 0) + columnGap);
    }
    for (const d of visible) d.y = x[d.depth];
    // Where each column's right-side labels end and its left-side labels begin (for the links).
    colRight = x.map((xk, k) => xk + (right[k] || 0) + 4);
    colLeft = x.map((xk, k) => xk - (left[k] || 0) - 4);
  }

  // The guided path moves the view briefly (200 ms), and not at all with reduced motion.
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const guidedDuration = () => (reducedMotion() ? 0 : 200);

  function update(event, source) {
    const duration = event?.guided ? guidedDuration() : event?.altKey ? 2500 : 300; // hold the alt key to slow down the transition
    const nodes = root.descendants().reverse();
    const links = root.links();

    // Compute the new tree layout, then space the columns by the labels that are showing.
    tree(root);
    placeColumns(root.descendants());

    const transition = svg.transition()
        .duration(duration);

    // Update the nodes…
    const node = gNode.selectAll(":scope > g") // node groups only, not the groups inside the orb
      .data(nodes, d => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append("g")
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", (event, d) => {
          // Shift-click opens everything beneath the node; a plain click toggles it.
          if (event.shiftKey) openAll(d, event);
          else toggle(d, event);
          if (d.data.prototype) onOpenPrototype(d);
        })
        .each(function(d) { d.element = this; });

    nodeEnter.filter(d => !d.data.prototype).append("circle")
        .attr("r", 5);

    // The prototype's entry: a pearl orb with two blurred swirls, a soft glow and a reflection.
    // It's the one node reachable by keyboard: Enter or Space opens the prototype.
    const orb = nodeEnter.filter(d => d.data.prototype)
        .classed("prototype", true)
        .attr("tabindex", 0)
        .attr("role", "button")
        .attr("aria-label", "Open the Pre-Merge Review prototype")
        .on("keydown", (event, d) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          select(d, event);
          onOpenPrototype(d);
        });
    orb.append("circle")
        .attr("class", "pearl-ring")
        .attr("r", orbR + 4);
    const body = orb.append("g")
        .attr("transform", `scale(${pearlScale})`)
      .append("g")
        .attr("class", "pearl")
        .attr("filter", "url(#pearl-glow)");
    body.append("circle")
        .attr("class", "pearl-body")
        .attr("r", pearlRadius);
    const swirls = body.append("g")
        .attr("clip-path", "url(#pearl-clip)")
        .attr("filter", "url(#pearl-blur)");
    swirls.append("ellipse")
        .attr("cx", -2).attr("cy", 1).attr("rx", 13).attr("ry", 5)
        .attr("transform", "rotate(-18)")
        .attr("fill", "#C77DFF").attr("opacity", 0.85);
    swirls.append("ellipse")
        .attr("cx", 5).attr("cy", 6).attr("rx", 10).attr("ry", 4)
        .attr("transform", "rotate(-12)")
        .attr("fill", "#4C7DFF").attr("opacity", 0.95);
    body.append("circle")
        .attr("class", "pearl-edge")
        .attr("r", pearlRadius - 0.5);
    // A play mark on the orb says it opens the prototype (clicking the orb or its label does).
    orb.append("path")
        .attr("class", "pearl-play")
        .attr("d", "M-2.6 -4.2 L4.4 0 L-2.6 4.2 Z");
    orb.append("title").text("Open the Pre-Merge Review prototype");

    // One line per tspan, vertically centred on the node.
    const text = nodeEnter.append("text")
        .attr("text-anchor", d => !d.data.prototype && d._children ? "end" : "start");

    text.selectAll("tspan")
      .data(d => d.lines.map((line, i) => ({line, i, d})))
      .join("tspan")
        .attr("x", ({d}) => d.data.prototype ? orbR + 8 : d._children ? -10 : 10)
        .attr("y", ({i, d}) => (i - (d.lines.length - 1) / 2) * lineHeight)
        .attr("dy", "0.31em")
        .each(function({line, i, d}) {
          // A guided-path stage shows its number first ("03"), in Red Hat Mono.
          if (i === 0 && d.depth === 1 && d.data.stage) {
            d3.select(this).append("tspan").attr("class", "stage-num").text(`${String(d.data.stage).padStart(2, "0")}  `);
            d3.select(this).append("tspan").text(line);
          } else {
            this.textContent = line;
          }
        });

    // Topics with a map get a small map icon (the Codicon) after their label that opens it.
    // It's placed after the label once the label can be measured (placeCtas).
    const mapBadge = nodeEnter.filter(d => d.data.map).append("g")
        .attr("class", "map-badge")
        .attr("aria-hidden", "true")
        .on("click", (event, d) => {
          event.stopPropagation();
          goTo(d, event);
          onOpenMap(d);
        });
    mapBadge.append("rect").attr("width", 20).attr("height", 20).attr("x", -2).attr("y", -2);
    mapBadge.append("path").attr("d", d => d.data.map.gallery ? GALLERY_ICON_PATH : "M2.5 5.77705V12.0978L5.5 10.2228V3.90205L2.5 5.77705ZM6.5 3.90205V10.2228L9.5 12.0978V5.77705L6.5 3.90205ZM6 11.0896L2.265 13.4239L1.5 12.9999V5.49993L1.735 5.07593L5.735 2.57593H6.265L10 4.9103L13.735 2.57593L14.5 2.99993V10.4999L14.265 10.9239L10.265 13.4239H9.735L6 11.0896ZM10.5 5.77705V12.0978L13.5 10.2228V3.90205L10.5 5.77705Z");
    mapBadge.append("title").text(d => d.data.map.gallery ? "View gallery" : "View map");

    // The root (the problem statement) gets a small eyebrow label above its text, so the long
    // statement reads as what it is. It uses the topic's short name.
    nodeEnter.filter(d => d.depth === 0).append("text")
        .attr("class", "root-eyebrow")
        .attr("text-anchor", "end")
        .attr("x", -10)
        .attr("y", d => -((d.lines.length - 1) / 2) * lineHeight - lineHeight - 6)
        .attr("dy", "0.31em")
        .text(d => (d.data.short || "Problem statement").toUpperCase());

    // Measure once the text is laid out (and again when the web font arrives).
    placeCtas();
    requestAnimationFrame(placeCtas);

    // Transition nodes to their new position.
    node.merge(nodeEnter)
        .classed("has-children", d => !!d._children)
        .classed("response", d => !!d.data.response)
        .classed("collapsed", d => d._children && !d.children)
      .transition(transition)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    node.exit().transition(transition).remove()
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path")
      .data(links, d => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().append("path")
        .attr("d", d => {
          const o = {x: source.x0, y: source.y0, depth: source.depth};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.merge(linkEnter).transition(transition)
        .attr("d", diagonal);

    // Transition exiting links to the parent's new position.
    link.exit().transition(transition).remove()
        .attr("d", d => {
          const o = {x: source.x, y: source.y, depth: source.depth};
          return diagonal({source: o, target: o});
        });

    if (selected) markPath();

    // Stash the old positions for transition.
    root.eachBefore(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    onChange();
  }

  // Open a closed node, or close an open one along with everything beneath it, then select it.
  function toggle(d, event) {
    if (d._children) {
      if (d.children) collapse(d);
      else d.children = d._children;
      update(event, d);
    }
    select(d, event);
  }

  let selected = root;

  // The links on the way from the root to the selected node, so they can be styled.
  function markPath() {
    const onPath = new Set(selected.ancestors());
    gLink.selectAll("path").classed("on-path", l => onPath.has(l.target));
  }

  // Highlight the clicked node, zoom to it, and pass it to the side panel.
  function select(d, event) {
    selected = d;
    gNode.selectAll(":scope > g").classed("selected", n => n === d);
    markPath();
    focus(d, event);
    onSelect(d);
  }

  // Match the SVG's coordinate system to its size on screen.
  function measure() {
    const rect = svg.node().getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    svg.attr("viewBox", [0, 0, width, height]);
  }

  // Zoom and pan so the node and its open subtopics fill the view, with the parent's dot
  // in frame for context (but not its label, which can be long). An end topic is framed
  // with its siblings. Focusing the root fits the whole visible tree.
  function focus(d, event) {
    const duration = event === undefined ? 0 : event?.guided ? guidedDuration() : event?.altKey ? 2500 : 750;
    const group = d.children || !d.parent ? d.descendants() : d.parent.children;

    // Measure each node with its label at its new position. Layout x is vertical and y is
    // horizontal, so swap them for screen space.
    const boxes = group.map(n => {
      const b = n.element.getBBox();
      return {x0: n.y + b.x, x1: n.y + b.x + b.width, y0: n.x + b.y, y1: n.x + b.y + b.height};
    });
    if (d.parent) {
      const p = d.parent;
      boxes.push({x0: p.y, x1: p.y, y0: p.x, y1: p.x});
    }
    const x0 = d3.min(boxes, b => b.x0) - pad;
    const x1 = d3.max(boxes, b => b.x1) + pad;
    const y0 = d3.min(boxes, b => b.y0) - pad;
    const y1 = d3.max(boxes, b => b.y1) + pad;
    const boxWidth = x1 - x0;
    const boxHeight = y1 - y0;

    // Fit the box into the part of the chart not covered by the notes card.
    const viewWidth = Math.max(width - insetRight(), width / 2);
    const scale = Math.min(maxFocusScale, viewWidth / boxWidth, height / boxHeight);
    const transform = d3.zoomIdentity
        .translate(viewWidth / 2, height / 2)
        .scale(scale)
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);

    // A named transition, so it runs alongside the node transitions instead of cancelling them.
    svg.transition("focus")
        .duration(duration)
        .ease(d3.easeCubicInOut)
        .call(zoom.transform, transform);
  }

  // Close a node and every branch beneath it, so reopening it starts fresh with only its
  // direct children showing. Walks _children so branches hidden under a closed node are
  // reset too.
  function collapse(d) {
    d.children = null;
    d._children?.forEach(collapse);
  }

  // Open a node and every branch beneath it, then select it so the zoom fits the lot.
  function openAll(d, event) {
    if (!d._children) return select(d, event);
    (function expand(n) {
      if (!n._children) return;
      n.children = n._children;
      n.children.forEach(expand);
    })(d);
    update(event, d);
    select(d, event);
  }

  // Split a label into lines of at most maxLineChars, breaking between words.
  function wrap(text) {
    const lines = [];
    let line = "";
    for (const word of text.split(" ")) {
      if (line && (line + " " + word).length > maxLineChars) {
        lines.push(line);
        line = word;
      } else {
        line = line ? line + " " + word : word;
      }
    }
    lines.push(line);
    return lines;
  }

  // Open every closed branch on the way to a node so it's visible, then select it. The node
  // itself stays as it was: only clicking it in the tree opens or closes it.
  // New nodes grow out of the highest branch that had to be opened.
  function goTo(d, event) {
    const toOpen = d.ancestors().slice(1).reverse();

    let source = null;
    for (const a of toOpen) {
      if (!a.children) {
        a.children = a._children;
        if (!source) source = a;
      }
    }

    if (source) update(event, source);
    select(d, event);
  }

  // Every topic in reading order (depth-first), including ones inside closed branches.
  const allNodes = [];
  root.eachBefore(d => allNodes.push(d));

  // Start with only the root and its top-level categories showing.
  root.x0 = 0;
  root.y0 = 0;
  allNodes.forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth >= 1) d.children = null;
  });

  update(null, root);

  svg.node().nodes = allNodes;
  svg.node().goTo = goTo;
  svg.node().openAll = openAll;
  svg.node().toggle = toggle;

  // Guided path: close the branch being left (if any), open the target stage's branch (none for
  // the root), then select the target so the view frames it. A short move, only on request.
  svg.node().guideTo = (target, leaving) => {
    const event = {guided: true};
    if (leaving && leaving !== target && leaving !== root) collapse(leaving);
    if (target !== root && target._children) target.children = target._children;
    update(event, target);
    select(target, event);
  };
  svg.node().root = root;

  // Selects the root and fits the whole tree. Used for the "Show all" button, and once the
  // chart is on the page (labels can't be measured before then).
  svg.node().reset = event => {
    measure();
    select(root, event);
  };

  // Keep the current topic framed when the window (and so the chart) changes size.
  new ResizeObserver(() => {
    if (!svg.node().isConnected) return;
    measure();
    focus(selected);
  }).observe(svg.node());

  return svg.node();
}

// Show the selected topic's name, path and note in the side panel. The path leaves out
// the root, since it's the full problem statement.
function showDetails(d) {
  const path = d.ancestors().reverse().map(n => n.data.name);
  document.getElementById("detail-path").textContent = path.slice(1, -1).join(" › ");
  // The root's card is titled by its short name ("The Ask"); the tree shows its full question.
  document.getElementById("detail-title").textContent = d.depth === 0 && d.data.short ? d.data.short : d.data.name;
  setNote(d.data.note, d.data.quote);
  document.getElementById("detail-map").hidden = !d.data.map;
  if (d.data.map) {
    // The button says what it opens: a map, or a gallery of images.
    const button = document.getElementById("detail-map");
    button.dataset.mapIcon ??= button.querySelector(".map-mark").innerHTML;
    button.querySelector(".map-mark").innerHTML = d.data.map.gallery ? galleryIcon() : button.dataset.mapIcon;
    document.getElementById("detail-map-label").textContent = d.data.map.gallery ? "View gallery" : "View map";
  }
  document.getElementById("detail-open-all").hidden = !d._children;
  const flowPanel = document.getElementById("detail-flow");
  if (flowPanel) flowPanel.hidden = true;
  // The local editor (editmode.js) listens for what the panel is showing.
  document.dispatchEvent(new CustomEvent("details:shown", {detail: {d}}));
}

// A note can hold several paragraphs, separated by "\n": each becomes its own <p>.
// A quote ({ text, who }) follows as a block quote, attributed by role only.
function setNote(note, quote) {
  const paragraphs = (note || "").split("\n").filter(line => line.trim()).map(line => {
    const p = document.createElement("p");
    p.textContent = line;
    return p;
  });
  if (quote) {
    const block = document.createElement("blockquote");
    block.className = "detail-quote";
    const text = document.createElement("p");
    text.textContent = `\u201C${quote.text}\u201D`;
    const who = document.createElement("footer");
    who.textContent = quote.who;
    block.append(text, who);
    paragraphs.push(block);
  }
  document.getElementById("detail-note").replaceChildren(...paragraphs);
}

// Show a map hotspot's note in the side panel, under the map's topic.
function showHotspot(d, info) {
  document.getElementById("detail-path").textContent = d.data.name;
  document.getElementById("detail-title").textContent = info.title;
  setNote(info.note);
  document.getElementById("detail-map").hidden = true;
  document.getElementById("detail-open-all").hidden = true;
  document.dispatchEvent(new CustomEvent("details:shown", {detail: {d, info}}));
}

let sidebar;
let selected;
let guide;

// While a map is open, the notes card says how to use it and offers "Show hotspots".
function setMapHint(on, d) {
  const hint = document.getElementById("detail-map-hint");
  const isGallery = !!d?.data.map?.gallery;
  hint.textContent = isGallery ? "Use the arrows, the dots or the arrow keys to move through the images."
    : d?.data.map?.flow ? "Click any step, arrow or yes / no on the flow, or use the buttons above. The arrow keys move forward and back."
    : d?.data.map?.enlarge === false ? "Click a highlighted area to read about it." : "Click a highlighted area to see it larger and read about it.";
  hint.hidden = !on;
  document.getElementById("detail-show-hotspots").hidden = !on || isGallery;
}

const mapViewer = createMapViewer({
  onHotspot: showHotspot,
  onOpen: d => setMapHint(true, d),
  onTopic: d => showDetails(d),
  onClose: () => { setMapHint(false); showDetails(selected); }
});

// Opening the prototype closes any open map; closing it returns focus to the orb.
const prototypeViewer = createPrototypeViewer({
  onClose: d => d.element?.focus()
});

const stage = document.getElementById("chart");

const chart = createTree(data, {
  onSelect: d => {
    selected = d;
    mapViewer.close(); // moving to another topic closes any open map
    // ...and the prototype window, so it never sits over the tree while someone moves on.
    // Focus stays where the person is navigating (sidebar, Next, search), not on the orb.
    if (!d.data.prototype) prototypeViewer.close({restoreFocus: false});
    showDetails(d);
    sidebar?.setCurrent(d);
    guide?.onSelect(d);
  },
  onOpenMap: d => {
    prototypeViewer.close();
    mapViewer.open(d);
  },
  onOpenPrototype: d => {
    mapViewer.close();
    prototypeViewer.open(d);
  },
  onChange: () => sidebar?.refresh(),
  // Width the notes card covers on the right, set in style.css as --panel-space.
  insetRight: () => parseFloat(getComputedStyle(stage).getPropertyValue("--panel-space")) || 0
});

// First in the stage, so the buttons, map viewer and notes card sit on top of it.
stage.prepend(chart);
sidebar = createSidebar(chart);
guide = createGuidedPath({chart, isBlocked: () => prototypeViewer.isOpen()});
chart.reset();
guide.start();

document.getElementById("detail-map").addEventListener("click", () => mapViewer.open(selected));
document.getElementById("detail-show-hotspots").addEventListener("click", () => mapViewer.flashHotspots());
document.getElementById("detail-open-all").addEventListener("click", event => chart.openAll(selected, event));
document.getElementById("reset").addEventListener("click", event => chart.reset(event));
