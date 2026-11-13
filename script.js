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

  // Radius of the pearl orb, and how far its label sits from the centre.
  const pearlRadius = 17;
  const pearlLabelGap = pearlRadius + 9;

  // Rows are separated by multiples of dx pixels, columns by dy pixels. (dx is a height and
  // dy a width, because the tree is laid out sideways with the root on the left.)
  const root = d3.hierarchy(data);
  const dx = lineHeight;
  const dy = 280;

  root.each(d => d.lines = wrap(d.data.name));

  // Define the tree layout and the shape for links. Neighbouring nodes are spaced by how
  // many lines their labels take up, plus a gap (bigger between different parents).
  const tree = d3.tree()
      .nodeSize([dx, dy])
      .separation((a, b) => (a.lines.length + b.lines.length) / 2 + (a.parent === b.parent ? 0.8 : 1.6));
  const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

  // Create the SVG container, a zoomable layer, and inside it a layer for the links and
  // a layer for the nodes.
  const svg = d3.create("svg")
      .attr("class", "tree");

  // The pearl orb for a topic with a prototype (handoff/docs/embed-and-deploy.md): the "You"
  // orb from the prototype, drawn in SVG so it scales with the tree.
  const defs = svg.append("defs");
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

  function update(event, source) {
    const duration = event?.altKey ? 2500 : 300; // hold the alt key to slow down the transition
    const nodes = root.descendants().reverse();
    const links = root.links();

    // Compute the new tree layout.
    tree(root);

    const transition = svg.transition()
        .duration(duration);

    // Update the nodes…
    const node = gNode.selectAll("g")
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
    orb.append("ellipse")
        .attr("class", "pearl-reflection")
        .attr("cy", pearlRadius + 7)
        .attr("rx", pearlRadius * 0.8)
        .attr("ry", 3);
    orb.append("circle")
        .attr("class", "pearl-ring")
        .attr("r", pearlRadius + 6);
    const body = orb.append("g")
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

    // One line per tspan, vertically centred on the node.
    const text = nodeEnter.append("text")
        .attr("text-anchor", d => d._children ? "end" : "start");

    text.selectAll("tspan")
      .data(d => d.lines.map((line, i) => ({line, i, d})))
      .join("tspan")
        .attr("x", ({d}) => d._children ? -10 : d.data.prototype ? pearlLabelGap : 10)
        .attr("y", ({i, d}) => (i - (d.lines.length - 1) / 2) * lineHeight)
        .attr("dy", "0.31em")
        .text(({line}) => line);

    // Topics with a map get a small ✱ after their label that opens it.
    text.filter(d => d.data.map)
      .select("tspan:last-child")
      .append("tspan")
        .attr("class", "map-badge")
        .text(" ✱")
        .on("click", (event, d) => {
          event.stopPropagation();
          goTo(d, event);
          onOpenMap(d);
        })
      .append("title")
        .text("View map");

    // The prototype topic gets an "Open prototype" badge after its label, like a map's.
    text.filter(d => d.data.prototype)
      .select("tspan:last-child")
      .append("tspan")
        .attr("class", "map-badge prototype-badge")
        .text("  Open prototype")
        .on("click", (event, d) => {
          event.stopPropagation();
          goTo(d, event);
          onOpenPrototype(d);
        });

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
          const o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.merge(linkEnter).transition(transition)
        .attr("d", diagonal);

    // Transition exiting links to the parent's new position.
    link.exit().transition(transition).remove()
        .attr("d", d => {
          const o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        });

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

  // Highlight the clicked node, zoom to it, and pass it to the side panel.
  function select(d, event) {
    selected = d;
    gNode.selectAll("g").classed("selected", n => n === d);
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
    const duration = event === undefined ? 0 : event?.altKey ? 2500 : 750;
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
  document.getElementById("detail-title").textContent = d.data.name;
  document.getElementById("detail-note").textContent = d.data.note || "";
  document.getElementById("detail-map").hidden = !d.data.map;
  document.getElementById("detail-open-all").hidden = !d._children;
}

// Show a map hotspot's note in the side panel, under the map's topic.
function showHotspot(d, info) {
  document.getElementById("detail-path").textContent = `${d.data.name} ✱`;
  document.getElementById("detail-title").textContent = info.title;
  document.getElementById("detail-note").textContent = info.note || "";
  document.getElementById("detail-map").hidden = true;
  document.getElementById("detail-open-all").hidden = true;
}

let sidebar;
let selected;

const mapViewer = createMapViewer({
  onHotspot: showHotspot,
  onClose: () => showDetails(selected)
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
    showDetails(d);
    sidebar?.setCurrent(d);
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
chart.reset();

document.getElementById("detail-map").addEventListener("click", () => mapViewer.open(selected));
document.getElementById("detail-open-all").addEventListener("click", event => chart.openAll(selected, event));
document.getElementById("reset").addEventListener("click", event => chart.reset(event));
