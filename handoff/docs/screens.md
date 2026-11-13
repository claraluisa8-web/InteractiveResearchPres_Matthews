# Screens: layout, behavior, hover and focus

All coordinates are on the **1440×900 stage** (Figma frame space). Copy keys refer to `data/scenario.json`. Screenshots are in `references/`; exact values come from Figma via MCP (node IDs in `BRIEF.md` §7).

## Global chrome (every state)

- **Canvas** (`tokens.color.canvas`): vertical gradient, blue floor glow at the bottom, perspective grid (an outer box narrowing to an inner box centered around 720,400, with radiating lines), vignette. Purely decorative: no pointer events, `aria-hidden`.
- **Title bar** 0–36px, `--pmr-title-bar`: three 12px inert dots at x 14/32/50; tabs from x 76 (git-commit icon + "Constellation", files icon + "Code"). The active tab has an `--pmr-active-tab` fill and a 2px lavender bar along its top edge; the inactive label is `--pmr-text-2`. The window title is centered at x≈688 ("brokerage-api — feature/recurring-investments"; draw the dash as text, it's a real em dash in copy, not an icon). Right side: a Codicon `ellipsis` button opening an overflow menu ("Start over", "Export session log" when logging is on, "About this prototype").
- **Composer** (glass, 640×58, x 400, y 824, radius 28): "Add node" pill (add icon) · "To: …" target select (chevron) · placeholder input · 36px lavender send circle (arrow-up icon). Enter sends. The target select lists Team plus every active agent by its name, and "Both agents" while the editor is open.
- **Status pill** (bottom-right, right edge at 1412, y 832, h 41, radius 20): dot + text. Variants: neutral glass with a mint dot ("Just you so far", "Building · no issues", "All lines clear", "Merged · all lines clear"), lavender dot ("1 suggestion", "Waiting on 1 review"), red pill (`--pmr-issue-pill` + stroke, red dot: "2 issues on 1 line", "Issue 1 of 2 on this line"). Clicking a pill goes to the thing it describes.
- **Legend** (bottom-left, x 24, y ~844): a small line/ring sample + text, shown only when that encoding first appears ("Red line = issue…", "Lavender ring = worth a look, not urgent", "Dashed line = waiting on a teammate's review").
- **Team rail** (glass card top-left at 16,52, w 230): appears once 3+ collaborators exist (05 onward). "TEAM · n" label; rows of 24px orb + name (13/600) + subtitle (11/400). Right-side markers: lavender dot (suggestion), red "!" badge (issue), mint check (verified). Hovering a row highlights that orb in the constellation; clicking opens its popover.

## Constellation layout

- **Slots** (orb centers): You alone at (720, 420) (01–03). Once others join, You moves to (720, 260) with a 200 ms ease; that's layout, not a camera move. Builder (560, 500) · Reviewer (880, 520) · Tester (1110, 320) · Teammate (190, 330). Other agents fill (380, 300), (1050, 610), (300, 640), (1180, 470), and so on. A second agent of the same role takes the nearest free slot.
- **Depth:** orbs linked directly to You are 48px with a full label. Orbs that link only through another agent (e.g. Tester via Reviewer) are 36px and slightly dimmer (opacity 0.85). You is 64px with two halo rings. Every orb has a soft floor reflection ellipse at y≈794 in its color (see `tokens.orb`).
- **Labels:** name (13/600 `--pmr-text`) and subtitle (11/400 `--pmr-text-2`) below or beside the orb as in the frames.
- **Lines:** SVG, 1.5px. Kinds: connected (white 16%), working (`--pmr-working-line` + 2–3 small flowing dots), issue (3px `--pmr-issue` with a glow, a 32px badge with a dark ring and the count in white on `--pmr-issue-badge`), pending (dashed), suggested (dotted), cleared (mint, 1.5px, with an 18px check dot at the midpoint). Line ends stop 8–10px short of orbs (Clara's arrow rule).
- **Pan and zoom:** drag the empty canvas, or scroll/pinch, to zoom (0.6×–2×, centered on the pointer). "Show whole team" (appears in the team rail header once zoomed or panned) fits all orbs with a 200 ms ease. Never auto-zoom.

## 01 The Constellation (`551:165`) - empty start

- You orb (64px) at (720, 420) with halo rings; label "You / Leila Moreno" below.
- **Spec card** (glass, 448,505 → ~200×48) dashed-linked to You: files icon, `recurring-investments.yaml` (mono 13/500), "Approved spec · v1.2.0 · attached to you". Click → read-only spec viewer (the editor pop-up with the yaml, locked).
- **`+` button** (24px glass circle, 8px right of You): opens the Add menu. **Coach card** (glass, 836,316): "Start your team" + body, dashed-linked to `+`. Gone after the first collaborator is added.

## 02 Add a Node (`551:213`) - add menu

- Glass menu (radius 16) anchored to `+`, label "ADD TO YOUR CONSTELLATION", five rows (24px orb icon + title 13/600 + body 11–12/400): Builder, Reviewer, Tester, Human teammate, Other agent (with chevron → subtype submenu: Accessibility, Security, Docs, Performance, Custom…). Footer "Add as many of each as you need."
- Rows: hover = `--pmr-row-hover` with radius 4 (nested in the menu's 8); keyboard ↑/↓/Enter/Esc. The `+` button turns lavender while the menu is open.

## 03 Configure the Node (`551:276`) - configure panel

- Choosing a role creates a **ghost orb** (dashed ring, "Not added yet") in its slot, dashed-linked to You, and opens the **configure panel** (glass, x 880, y 51, 400×755, radius 16).
- Header: role orb (32px), name (18/600, updates live as the user types in NAME), "Set up how this collaborator works.", close ×.
- Fields as in the frame and `scenario.configurePanel`: NAME (real input, prefilled with the role default; empty → falls back to the default on save) · MODEL (locked: lock icon, "IBM Bob", right "Required by IBM") · CONFIGURATION (select) · checkbox "Let Bob request other team configurations on your behalf" (real checkbox, stored, shown on the agent popover) · CHECKS AGAINST (select with the `Auto` chip) · STRICTNESS (locked "Strict", "Set by org policy", help text) · ALLOWED TO EDIT (checkboxes Source code / Test files; "The spec" locked with a lock icon; help lines) · CONNECTS TO (chips for existing collaborators, toggleable; "+ Connect" opens a small list) · footer "Add to constellation" (primary) / "Cancel".
- Human teammate panel: NAME, ROLE ("Reviews or pairs with you"), CONNECTS TO, and an invite note in place of model/strictness. Other agent: the same as the builder plus a TYPE select.
- Enter in NAME = Add. Esc / Cancel removes the ghost.

## 04 Build in the Constellation (`551:373`)

- **Before the build: ready state (not drawn in Figma; extend the update card pattern).** Same glass card and position as the update card: builder orb + name, "IBM Bob · Default · ready", body "Ready to build from recurring-investments.yaml.", one primary button **Start from the spec**. Above the composer, a single suggestion chip (secondary chip style, sparkle Codicon) "Build the API from the spec". The composer target is "To: {builder}", placeholder "Tell {builder} what to build…". Any send starts the build. The builder's reply bubble shows above the composer and the card cross-fades (200 ms) into the update card below.
- **Builder update card** (glass, top-right ~ x 980, y 52, w 400): builder orb + name + "IBM Bob · Default · just now", body copy, file chips (`PlanController.java`, `CreatePlanRequest.java +3`, `PlanService.java`, the active one lavender-tinted). Clicking a chip opens that file in the **floating editor**.
- **Floating editor** (glass, top-left 40,52, w ~460): file name (mono 13/500), "Opened from {builder} · agent-written", close ×, CodeMirror with line numbers, a footer with a You avatar dot + "You're typing on line {n}" (live caret line), and Save (primary). The dashed line from the floating editor to the builder orb shows where it came from. Save → toast "Saved · {builder} will pick this up". Edits persist in state.
- Lines: You↔Builder working (flowing dots); Builder↔Reviewer working once the reviewer exists. Composer "To: {builder}", "Message {builder}…". Status "Building · no issues".

## 05 Approve a Recommendation (`551:480`)

- The reviewer orb gets a lavender ring + 6px dot. A suggested Tester ghost (36px dashed circle, beaker icon in `--pmr-text-2`) at the tester slot, dotted-linked to the reviewer; label "Tester / Suggested by {reviewer}". The team rail lists Tester with a dashed icon.
- **Recommendation card** (glass, ~1030,425, w 400): reviewer orb + "{reviewer} spotted a gap in test coverage" + meta, body, chips ("IBM Bob · Contract tests", "Edits tests only"), buttons Add tester (primary) / Adjust first / Not now.
- Add tester → the tester is added directly with defaults (connected to the reviewer). Adjust first → the configure panel prefilled as tester. Not now → card closes; the ring and the "1 suggestion" pill stay until the user clicks the ring (reopens the card) or the issue milestone arrives (then the suggestion quietly expires).

## 06 Issues on the Lines (`551:568`)

- The Builder↔Reviewer line turns red; badge "2" at the midpoint. Hover the line or badge → **hover card** (glass, under the line midpoint): "{builder} [link icon] {reviewer}" (13/600), body "2 issues in createPlan…", link "See sections →" (link color, arrow icon). Clicking the line, badge, card link or red status pill opens 06b.
- Team rail: the builder and reviewer rows get red "!" badges.

## 06b Sections on a Line (`551:1424`)

- **Sections panel** (glass, x 1008, y 52, 416×756) docked right; the constellation stays live.
- Header: "{builder} [link icon] {reviewer}" (18/600), subtitle "Sections this line touched · {n} issues", close ×. Divider. Progress "{v} of {t} sections verified" + right "against recurring-investments.yaml", a 4px track with a mint fill.
- "ON THIS LINE" rows (48px): status icon (red 16px count circle / mint check circle / hollow ring), name (mono 13/500 for code identifiers, Red Hat Text 13/500 for plain names), sub line "File · L{start}–{end}" (11/400) + author dots (8px agent colors), right side issue pill / "Verified" (mint 11/500) / chevron. `createPlan` expands to show its subsections (Idempotency key · Agents disagree; Plan creation · Not verified; Created response · No Location header) in a selected container (`--pmr-row-selected`, radius 10).
- "ELSEWHERE IN THIS CHANGE": Contract tests (only if a tester exists), CHANGELOG.md.
- **Hover linking:** hovering any row rings the orbs in that section's `line` (1.5px `--pmr-text` at 45%) and dims the other orbs and lines to 30%. **Labels stay at full strength (AAA).** Same on keyboard focus.
- Row click → 07 for that section. Hover/focus on a non-issue, unverified row shows a quick **Verify** button. Footer primary: "Open {first open issue}".

## 07 Edit in Code (`551:1246`) - section-scoped editor

- Scrim over the constellation (`--pmr-scrim`); **pop-up** (popup glass, x 40, y 52, 1360×756, radius 20). The Code tab becomes active.
- **Top bar** (52px): 8px red dot + issue title (14/600) for issue sections (or the section name for others) · separator · "{builder} [link icon] {reviewer}" · "· createPlan · {section} · issue n of N" (12/400). Right: ← → glass buttons and ×.
- **Left column** (x 64, w 340): agent cards (Builder says, blue-tinted stroke; The spec, neutral with a mono excerpt and line numbers; Reviewer says, violet-tinted stroke), or "About this section" for non-issue sections. Lower: "THIS SECTION" with Verify section (locked style + lock icon until allowed) and Next section, the help line, then "OR RESOLVE WITHOUT EDITING" with Accept {reviewer}'s fix / Reject (issue sections only).
- **Code panel** (`--pmr-code-panel`, x 424, y 124, 952×660, radius 12): a header with file tabs (active: mono 13/500 + 2px lavender underline; the other tab is the spec file, read-only), meta "Written by {builder} · edited by you", "Unsaved changes" + lavender dot, Save. Editor: line numbers (1px smaller), gutter authorship marks (dashed builder blue / solid you), issue rows (`--pmr-issue-row` + 3px red bar + red dot by the line number), right-aligned row notes ("read, never checked", "{reviewer}: check the key here"), lavender caret, section marker row.
- Composer "To: {builder} + {reviewer}", "Message both agents…". Status pill "Issue n of N on this line".

## 08 All Clear (`551:796`)

- Lines turn mint with check dots; every orb gets an 18px mint check badge; team rail checks.
- **Verification receipt** (glass, x 1040, y 72, w 380): title (18/600), meta, mint progress bar (full), a 4-column table (SECTION mono/plain names · WROTE · REVIEWED · TESTED; values use the user's agent names; "Builder + You" when the user edited; "Skimmed"; "—"; "Rejected by you" when applicable), footnote, buttons Open pull request / Copy (copies a plain-text receipt).

## 09 Open a Pull Request (`551:937`)

- PR panel (glass, x 1040, y 72, w 380): branch line (git-branch icon, mono `feature/recurring-investments` → arrow icon → `main`), TITLE input, DESCRIPTION textarea (prefilled, editable; pencil-icon note "Drafted from the receipt. Click in to edit."), REVIEWERS (teammate avatar row + "Joins the constellation as a teammate"; a select to pick any human teammate the user added), checkbox "Attach verification receipt" (checked), primary "Create pull request".
- The teammate ghost appears (dashed initials orb "DK", "Dana Kim / Human teammate · adding"), dashed-linked to You.

## 10 Teammate Review (`551:1025`)

- The teammate orb becomes solid (iridescent ring) with a lavender non-urgent ring; subtitle "Reviewing · pending"; a dashed line to You with a comment-icon node at its midpoint.
- **Comment card** (glass, above the line, ~180,85, w 350): initials avatar + name + "commented on this line · 2m", body, Reply / Show line. Reply opens an inline text field + Send; on send the teammate answers and approves (M10). Show line → opens 07 (read-only) on the createPlan 409 branch.
- **PR card** (glass, top-right): "Pull request #482", meta, check rows (Codicons `pass-filled` mint ×2, `history`), Merge (disabled style) + "Merging unlocks when {teammate} approves." After approval: Merge enabled (primary).

## 11 Productivity Recap (`551:1125`)

- Lines show "n caught" pill tags; the teammate gets a check badge, "Approved #482".
- **Recap panel** (glass, x 1000, y 72, w 420): merge icon + "Pull request merged" (18/600), meta, three stats (value 24/600, label 11/400), "CAUGHT ON EACH LINE" bar rows (a [link icon] b, lavender bars, counts), "THIS MONTH" with a 4-bar sparkline + three lines, buttons View receipt / Done.

## Hover & focus states (apply consistently)

| Element | Hover | Focus-visible | Pressed / active |
|---|---|---|---|
| Orb | scale 1.04, glow +20%, label brightens to `--pmr-text` | 2px lavender ring, 3px offset | scale 0.98 |
| Line | +1px width, hover card after 150 ms | n/a (badge is focusable) | n/a |
| Issue badge | glow pulse once | lavender ring | n/a |
| Primary button | fill lightens 6% | lavender ring | darkens 6% |
| Secondary button | fill `rgba(255,255,255,0.10)` | lavender ring | `0.04` |
| Menu / panel row | `--pmr-row-hover` | same + ring inset | n/a |
| Section row | `--pmr-row-hover` + orb linking | same | n/a |
| Chip | stroke brightens | lavender ring | n/a |
| Tab | label → `--pmr-text` | lavender ring | n/a |
| Code line | `--pmr-row-highlight` under the cursor row | n/a | n/a |
| Composer target / Add node | fill `0.12` | lavender ring | n/a |
| Status pill | stroke brightens | lavender ring | n/a |
| Checkbox | stroke brightens | lavender ring | lavender fill + check (0.5px low) |

Cursor: pointer on everything interactive, default on decoration and window chrome. Tooltips (Codicon buttons only): glass, 12/400, 400 ms delay.
