// Local wording editor. Only switches on when the page is served by scripts/edit-server.js on this
// computer: the notes panel then gets "Edit wording", and Save writes the change into data.js.
// The published site never runs it (there's no server to save to).

(async function editMode() {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) return;
  try {
    const r = await fetch("/api/ping", {cache: "no-store"});
    if (!r.ok || !(await r.json()).editing) return;
  } catch {
    return;
  }

  const panel = document.getElementById("details");
  const title = document.getElementById("detail-title");
  const note = document.getElementById("detail-note");
  const chart = document.querySelector(".tree");
  let subject = null; // {d} for a topic, {d, info} for a map section
  let editing = false;

  // A badge so it's clear this page saves.
  const badge = document.createElement("p");
  badge.className = "edit-badge";
  badge.textContent = "Editing mode · Save writes to data.js";
  document.body.append(badge);

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "edit-open";
  editButton.textContent = "Edit wording";
  title.after(editButton);

  const form = document.createElement("form");
  form.className = "edit-form";
  form.hidden = true;
  form.innerHTML = `
    <label><span>Title</span><textarea name="title" rows="2"></textarea></label>
    <label class="edit-note"><span>Note</span><textarea name="note" rows="6"></textarea>
      <small>Each line becomes its own paragraph.</small></label>
    <label class="edit-quote"><span>Quote</span><textarea name="quote" rows="4"></textarea></label>
    <div class="edit-actions">
      <button type="submit" class="edit-save">Save</button>
      <button type="button" class="edit-cancel">Cancel</button>
      <p class="edit-status" role="status" aria-live="polite"></p>
    </div>`;
  editButton.after(form);
  const field = name => form.querySelector(`[name="${name}"]`);
  const status = form.querySelector(".edit-status");

  // Grow each box to fit its text.
  const fit = t => { t.style.height = "auto"; t.style.height = `${t.scrollHeight + 2}px`; };
  form.addEventListener("input", e => e.target.matches("textarea") && fit(e.target));

  const pathOf = d => d.ancestors().reverse().slice(1).map(n => n.parent.data.children.indexOf(n.data));
  const hotspotId = (d, info) => Object.entries(d.data.map?.hotspots || {}).find(([, h]) => h === info)?.[0];

  function open() {
    if (!subject) return;
    const {d, info} = subject;
    field("title").value = info ? info.title : d.data.name;
    field("note").value = (info ? info.note : d.data.note) || "";
    const quote = !info && d.data.quote;
    form.querySelector(".edit-quote").hidden = !quote;
    field("quote").value = quote ? d.data.quote.text : "";
    status.textContent = "";
    editing = true;
    title.hidden = note.hidden = editButton.hidden = true;
    form.hidden = false;
    form.querySelectorAll("textarea").forEach(fit);
    field("title").focus();
  }

  function close() {
    editing = false;
    title.hidden = note.hidden = editButton.hidden = false;
    form.hidden = true;
    editButton.focus();
  }

  editButton.addEventListener("click", open);
  form.querySelector(".edit-cancel").addEventListener("click", close);
  // Esc cancels the edit first (before it can close a map).
  window.addEventListener("keydown", e => {
    if (editing && e.key === "Escape") {
      e.stopImmediatePropagation();
      e.preventDefault();
      close();
    }
  }, true);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const {d, info} = subject;
    const id = info && hotspotId(d, info);
    const fields = info
      ? {title: field("title").value, note: field("note").value}
      : {name: field("title").value, note: field("note").value, ...(d.data.quote ? {quote: field("quote").value} : {})};
    status.textContent = "Saving…";
    let result;
    try {
      const r = await fetch("/api/save", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({path: pathOf(d), hotspot: id, fields}),
      });
      result = await r.json();
    } catch {
      result = {ok: false, error: "Couldn't reach the editing server. Is it still running?"};
    }
    if (!result.ok) {
      status.textContent = result.error || "Couldn't save.";
      return;
    }
    const tidy = v => v.replace(/\r\n?/g, "\n").replace(/\n{2,}/g, "\n").trim();
    if (info) {
      info.title = tidy(fields.title);
      info.note = tidy(fields.note);
      document.querySelector(`#map-canvas #${CSS.escape(id)}`)?.setAttribute("aria-label", info.title);
      close();
      showHotspot(d, info);
      return;
    }
    const renamed = tidy(fields.name) !== d.data.name;
    d.data.note = tidy(fields.note) || undefined;
    if (d.data.quote) d.data.quote.text = tidy(fields.quote);
    if (renamed) {
      // The tree lays labels out once, so a new title reloads the page and comes back here.
      sessionStorage.setItem("edit:return", JSON.stringify(pathOf(d)));
      location.reload();
      return;
    }
    close();
    showDetails(d);
  });

  document.addEventListener("details:shown", e => {
    subject = e.detail;
    if (editing) close();
  });

  // After a title change, return to the topic that was being edited.
  const back = sessionStorage.getItem("edit:return");
  if (back) {
    sessionStorage.removeItem("edit:return");
    const target = JSON.parse(back).reduce((n, i) => n?.data.children && (n._children || n.children)?.find(c => c.data === n.data.children[i]), chart.nodes[0]);
    if (target) chart.goTo(target);
  }

  // The panel already shows the problem statement on load.
  subject = subject || {d: chart.nodes[0]};
  panel.classList.add("is-editable");
})();
