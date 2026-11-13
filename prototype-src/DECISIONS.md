# Decisions and deviations

Each entry records what changed from the design or the handoff, why, and which frame it affects.

## Phase 0

- **`shared/tokens.css` has no Google Fonts `@import`.** The handoff file imports Red Hat from fonts.googleapis.com, which breaks non-negotiable #13 (offline, no runtime CDN). The prototype bundles `@fontsource/red-hat-text` and `@fontsource/red-hat-mono` instead. Phase 7 has to load the same fonts locally for the tree map. Applies to all frames.
- **Copy is imported straight from `handoff/data/scenario.json`.** There's one source of truth, so `handoff/` has to stay committed: the CI build reads it. New strings for the chrome (overflow menu, About dialog, Start over confirm, toast, aria labels, and "Add node", which Figma draws but the JSON didn't have) are under `chrome` with `"new": true`.
- **Where Figma and `docs/screens.md` disagree on frame 01 positions, Figma wins** (BRIEF: visual detail goes to Figma). The spec card is at 396,500 (283×69); the doc's 448,505 is the text inside it. The coach card is at 820,300 (294×98); 836,316 is its title. The `+` button beside You is 32px, not 24px. These matter from Phase 1 on.
- **Window title** sits with its left edge at x 688, as in Figma, rather than centered on 688 as the doc says.
- **Send button icon** is Codicon `arrow-up`, which matches the doc. Figma uses `arrow-right` rotated to point up, which looks the same.
- **Overflow (ellipsis) button** sits at the far right of the title bar. Frame 01 doesn't draw it; its position extends the title-bar pattern.
- **Perspective grid** is drawn in SVG to approximate the `Space / Background v2` component (inner box 440,250 to 1000,550, six depths, eight divisions per wall). Fine-tune against Figma in Phase 1 if it reads too strong.
- **Phase 0 placeholders:** Add node, Send and the Code tab show the "Not part of this prototype" toast until Phases 1–3 wire them up. The status pill isn't clickable yet.

## Phase 1

- **Slots follow Figma, not `screens.md`.** Builder is at (600, 500) and reviewer at (900, 520), as in frame 05; the doc says (560, 500). Tester (1110, 320) and teammate (190, 330) are unchanged. The first shared slot for other agents moved from (380, 300) to (380, 410): at (380, 300) it sat on the You–teammate line.
- **The team moves aside while the configure panel is open.** Frame 03 shows the whole team offset (You at 520, 320 instead of 720, 420) so the ghost stays clear of the panel. A new collaborator shifts the team 200px left and 60px down, further if its slot is still under the panel. Editing an existing one shifts only as much as needed. The shift moves orbs and lines as one layer, so it's a layout change, not a camera move, and nothing else changes view. (Frame 03.)
- **You moves to the team layout as soon as a ghost exists.** This matches frame 03, where You is already in its team position relative to the ghost. Orbs change position instantly; only the panel shift eases. Easing them separately made the SVG lines lag behind the orbs.
- **The + beside You moves once there's a team.** Frames 04–05 don't draw it. Alone, it sits to the right of You (frame 01). With a team, You's label takes that side, so the + moves to the upper left, where no lines are drawn.
- **The spec card shows only in the empty start.** Frames 03 onward don't draw it. The You popover has "Open recurring-investments.yaml", so the spec is never out of reach.
- **The team rail lists You, every collaborator and any ghost** (frame 05 counts the suggested tester). It appears at 3 or more and is capped at frame 05's 230px height, scrolling when longer, so it never covers the teammate slot. Frame 10 draws no rail, so Figma doesn't settle this.
- **"Show whole team"** sits in the rail header. With fewer than 3 on the team, there's no rail, so it appears as a small standalone button in the rail's spot. It shows only after the user has panned or zoomed. Fitting never zooms in past the designed 1:1, and when everything fits at 1:1 it returns to the designed view.
- **CONNECTS TO chips** show the current links. Clicking a chip removes that link; "+ Connect" adds one. Removing a link removes it from both ends. A collaborator left with no links reconnects to You.
- **Other agents** get a TYPE select (Accessibility, Security, Docs, Performance, Custom…). The default name follows the type ("Security agent") until the user types their own. Icons are Codicons: shield, person, book, dashboard, gear.
- **The status pill** reads "{n} agents in your orbit" once there's a team. Phase 2's ready and building states will replace it. In the empty start, clicking it opens the add menu.
- **Composer replies are live now.** The intent matcher from `docs/agent-replies.md` drives them, so adding agents and renaming by text work ("rename the builder to Codey" opens the panel with the new name filled in). Until Phase 2, messages in the ready context don't start the build.
- **Placeholders until Phase 2:** "Open PlanService.java" on the builder popover and the Code tab show "Not part of this prototype".

## Phase 2

- **The ready card** uses the update card's spot and pattern (frame 04: 971,72, 432 wide), as the brief asks. It appears 600 ms after the builder joins. Its meta is the builder's real model and configuration, so a builder set to "Strict security review" doesn't read "Default".
- **What starts the build.** "Start from the spec", the chip, or any message to the builder or to Team. Messages that match add agent, rename or a spec question get their own reply and don't start it (`anyMessageStartsBuild`). Messages to another agent, e.g. To: Reviewer, get normal replies.
- **Composer target:** once a builder joins, the composer switches to "To: {builder}", as in frame 04. The target pill now sizes itself to the name; it was a fixed 101px. The real `<select>` covers the pill, transparent, so it stays a native control.
- **The update card has a close ×** ("Hide update"). Frame 05 draws no update card, so it must be dismissable. Clicking the "Building · no issues" pill brings it back.
- **Floating editor:** CodeMirror 6 at 12/20 to match frame 04's line pitch; the 13/23 code token is for the big section editor. Unsaved typing is kept per file, so closing the editor never loses work. Save commits it and shows the toast; Ctrl/Cmd+S saves too. Tab indents inside the editor, so keyboard users leave it with Esc, which closes the editor and returns focus to the file chip.
- **"CreatePlanRequest.java +3" opens CreatePlanRequest.java.** The +3 DTOs aren't listed separately.
- **Generated-by comments in the dummy code use the user's builder name** (`// Generated by Codey from …`), so role never shows as a name.
- **The builder wears a neutral ring while its file is open** (frame 04 draws a 64px ring around it).
- **The recommendation** fires 4 s after the build starts, or right after the floating file is closed or saved, whichever comes first. "Not now" and Esc both dismiss it; the ring, the suggested tester ghost, the rail row and the "1 suggestion" pill stay. Clicking the ring, the ghost, its rail row or the pill reopens the card. A tester added any other way also settles the suggestion. Removing the reviewer withdraws it.
- **Removing the builder or reviewer after the build has started** asks first, inside the popover, with Cancel focused (off-path table).
- **"Open PlanService.java"** appears in the builder popover only once the build has started; before that there's no file to open.
- **Intent additions** in `intents.json`: a greeting intent; help phrases ("what do I do", "what now"); status phrases ("how much"); status replies for empty, ready and build; the tests intent in empty and ready (it answers with `noTester`); and a rename reply for when the named role doesn't exist yet. All are marked new.
- **Next-step hints** are more specific than the context: once a reviewer exists, the build hint stops saying "add a reviewer" (`constellation.nextStepHints` in `scenario.json`).

## Phase 3

- **Section ranges are computed from the live text with explicit resolvers** for each anchor in `scenario.json`, which the `{text}` anchors can't express on their own. "closing brace of X" is brace-matched, ignoring braces inside strings and comments (`"/plans/{id}"`). The create-call anchor also matches the reviewer's fix (`create(request, idempotencyKey)`). A lost anchor falls back to the whole file, so a section can never fail to open. Ranges therefore differ from the 06b placeholders (README note): createPlan L18–27, listPlans L29–34, updatePlanStatus L36–42, Amount handling L26–31, Error responses L12–45.
- **Progress counts top-level sections** (7, or 8 with a tester). createPlan is verified once its three subsections are. listPlans, updatePlanStatus and Generated DTOs start verified (`initial` in `scenario.json`), so a team with a tester starts at 3 of 8, as in 06b.
- **Save rechecks every open issue whose code is in the saved file**, not just the one on screen. Milestones follow conditions, not clicks, so fixing issue 2 while looking at issue 1 still counts. The left-column cards only speak for the issue on screen; other issues keep their result and show it when opened.
- **Issue checks** follow `resolvedWhen`. Issue 1 needs a line in the createPlan body, before the create call, that mentions `idempotencyKey` with an if, ternary, throw or check-like call. Comments don't count. Issue 2 needs Location, URI or `ResponseEntity.created(` in the createPlan body.
- **Accept fix** patches the user's current text, unsaved edits included, rather than swapping in `PlanController.reviewer-fix.java` whole, so the user's own changes survive. The diff preview shows three lines of context per hunk. Added rows are mint and removed rows red with a strike, as the flow doc specifies, even though red otherwise means issues only.
- **Next section** walks open issues first, then sections on the builder↔reviewer line, then elsewhere. With nothing left, it closes the editor, the panel stays open, and a toast says every section is verified. ← → step through the two issue sections while any issue is open, then through every section.
- **Authorship marks** compare against the builder's original file: rows that aren't in it are yours (solid), the rest are the builder's (dashed). CHANGELOG is all yours. "You · not saved yet" marks the first row that differs from the last save.
- **The flagged rows and notes** shown are only those for the open issue of the section on screen, to keep the focus on one disagreement.
- **Generated DTOs** opens the four model files as tabs. Contract tests and CHANGELOG open the whole file as their section. The spec tab is read-only CodeMirror.
- **Hover linking** dims orbs, rings and halos to 30%; labels and their text stay at full strength, as AAA requires. While the sections panel is open, the team sits 40px left, as in 06b.
- **The status pill** after both issues are resolved but before everything is verified reads "{v} of {t} sections verified" (sections panel copy). With everything verified it reads "All lines clear". The receipt and mint lines come in Phase 4.
- **Code tab:** with sections, it opens the first unverified one. After the build but before the issue, it opens PlanController.java in the floating editor. Before the build, it shows a toast saying there's nothing to open yet.
- **Composer in the editor** defaults to "To: {builder} + {reviewer}". "just fix it" opens the fix preview (on the first open issue if the editor isn't open) without applying it. Replies written as "{reviewer}: …" now come from that agent without the prefix.
- **Intent phrases added** (marked new): "the gateway" and friends for sideBuilder, "what does the spec say" for spec. Without them, both lost a tie to fix and why.
- **Diff line numbers** on tinted rows use the primary text color: the secondary color measured 6.2:1 there, under AAA.

## Phase 4

- **The teammate slot moves to (340, 320).** Frames 09–11 draw Dana at 200,320 with the team shifted 140px left. The doc's (190, 330) put her under the team rail. This replaces the Phase 1 note.
- **From M7 on, the team sits 140px left**, as in frames 08–11, clear of the right-hand panels. A far orb's label (the tester) moves above it, as drawn.
- **The receipt, PR and recap panels have a close ×**, and Esc closes them; Figma doesn't draw one, but Close and Esc must always work. The status pill reopens the receipt or the recap. Closing the PR panel removes the "adding" ghost and returns to the receipt.
- **WROTE** adds "You" when the section's own lines differ from the builder's original, and adds the reviewer when its fix was accepted. A rejected issue shows "Rejected by you" under REVIEWED.
- **Footnote variants** (new copy): none, one, two (Clara's line), many, and no tester.
- **Copy** writes a plain-text receipt, with a selection-based fallback for browsers that refuse the async clipboard.
- **The comment card is bottom-anchored 45px above the You–teammate line**, so a growing thread rises instead of covering You. It also stays clear of the team rail, which frame 10 doesn't draw.
- **During review, any composer message counts as a reply** to the comment (`replyToTeammate`). Asking to merge once everything is clear opens the PR panel (M8).
- **The PR status card hides "Contract tests" when there's no tester.** The recap moves missing lines' counts onto builder↔reviewer, so the total stays 7.

## Phase 5

- **Session logging** follows `docs/logging.md`. It's on only with `?test=1` or `?test=P1`, and refreshing continues the same participant's session. Every event records the expected step it happened in. On-path means the click hit the hint table's affordance for that state. Clicks inside the panel that holds that affordance (a field or checkbox in the configure panel) aren't counted as off-path, because they're working the step, not wandering. Opening the add menu has its own step, so choosing a role isn't off-path.
- **Start over with logging on** offers "keep log" (same recording continues) or "clear log" (a new session starts). Neither deletes earlier sessions from localStorage, so nothing is lost before it's exported.
- **The recording indicator** is a CSS dot plus the word "Recording", not a ● glyph, in the secondary text color so it doesn't read as an issue. `&quiet=1` hides it.
- **Idle hints** use the same expected-step table as the log, fire once per state after 25 s, and reset while the user types. With reduced motion, the pulse becomes a steady lavender ring for the same time.
- **Tab no longer indents in the code editors.** Tab-to-indent trapped keyboard users inside CodeMirror, away from Save and Verify. Enter still auto-indents, and typing, selection, undo and paste are unchanged.
- **The section editor is modal for keyboard users:** while it's open, everything behind the scrim is inert. The title bar, composer and status pill stay reachable, because frame 07 keeps them live.
- **Focus rescue.** When a keyboard action removes the focused control (Start from the spec, Apply fix, Create pull request, quick verify, the receipt replacing the panel), focus moves to the next expected step. Quick verify keeps focus on its row. Approval moves focus to Merge. Mouse users never have focus moved for them.
- **Tooltips** on Codicon-only buttons are a glass tooltip after 400 ms, on hover or focus, replacing the native `title`. They're hidden from screen readers, since the aria-label already says the same thing.
- **Read-only files** (the spec tab) stay focusable; typing in them shows "Approved specs are read-only for every agent."
- **Line hover cards** now name their state ("Cleared", "Waiting on {teammate}'s review") and, once sections exist, how many sections the line carries.
- **Glyph sweep:** no glyph icons are rendered anywhere. The ↔ in copy always renders as the Codicon. The "•" bullets in the PR description are your copy, as text inside an editable field, so they stay.

## Phase 6

- **Placement:** the default from the README, a new top-level "Solution: The Pre-Merge Review" after "Mapping", with `short: "Solution"` for the outline.
- **The pearl orb** is drawn in SVG inside the tree (gradient, two blurred swirls clipped to the circle, glow filter, reflection), at radius 17, so it zooms with the tree. Its label starts clear of the orb instead of the usual 10px. It's the one tree node in the tab order (role button, Enter or Space opens). Clicking it selects the topic as usual and also opens the overlay.
- **"Open prototype"** is a text badge after the label, using the map badge's style. The text replaces the ✱ glyph, which the no-glyph rule doesn't allow for new marks.
- **The overlay** covers the whole chart, including the notes card. The doc says "full-chart", and the prototype needs the room. The close × is drawn in SVG, not a × character. Closing unloads the iframe, so the next open starts fresh. Opening it closes any open map, and opening a map closes it.
- **Inside the iframe, Esc closes the topmost layer first.** With nothing left, the prototype posts `pmr:close` to the parent, and the tree map accepts it only from its own iframe.
- **The tree map's colors aren't touched**, beyond the overlay and pearl styles, until the Phase 7 restyle.
- **Local check:** `.claude/launch.json` has a `site-built` entry that serves `_site/`, assembled the way CI does it. It's gitignored.

## Phase 7

- **Restyle is styling only, apart from two hooks in `script.js`:** a `node-gradient` SVG gradient for the flat orbs (CSS can't fill SVG with a gradient on its own), and an `on-path` class on the links from the root to the selected node, for the `--pmr-working-line` color. Data, interactions, shortcuts, search, progress and map viewer behavior are unchanged.
- **Node sizes** come from CSS (`transform: scale(0.8)` on the existing r=5 circles, giving 8px topics and 10px categories) rather than changing the drawing code. That works in Safari, unlike the CSS `r` property.
- **Lavender for text uses `--pmr-link` (#B3ADFF)**, not `--pmr-lavender`. Lavender as text on the canvas is 5.9:1, under AAA, so it's used only for rings, bars, fills and focus outlines. This covers the map badge, map marks, link and arrow hovers.
- **Disabled Previous/Next** keep readable text (AAA) and show as disabled through a dimmer fill and border, instead of the old 40% opacity.
- **The canvas grid** is a static SVG (`shared/canvas-grid.svg`) with the same geometry as the prototype's canvas. The floor glow and vignette are CSS gradients from the tokens.
- **The tree map keeps its ✱ map marks and ‹ › on Previous/Next.** The restyle doc says "View map keeps its mark", and these are part of the existing tree map's own design. New marks use text or SVG: "Open prototype" and the overlay's close button.
- **The research maps stay light** on a #F5F5FA card with a 16px radius. Their own colors come from your SVG exports. The placeholder maps' grey caption (#6b6b66 on #F5F5FA, about 5:1) is below AAA, so check this when you replace them with your real exports.
- **Fonts for the tree map** are self-hosted in `shared/fonts/` (Red Hat Text 400/500/600/700 plus 400/500 italic for responses, Red Hat Mono 400/500, SIL OFL). D3 7.9.0 is vendored in `vendor/` from the npm package, with its license.
- **One build script, `scripts/build-site.sh`,** builds the site for GitHub Pages (the workflow now calls it) and for the offline copy (`npm run build:offline`), so the two can't drift. It leaves `handoff/`, `CLAUDE.md`, `OFFLINE.md`, `scripts/` and `package.json` out of the published site.
- **The offline check was simulated:** headless Chrome with every non-localhost host blocked, plus a scan of the built site for external URLs (none). Wi-Fi itself wasn't switched off; OFFLINE.md has the real-world check for the day before.

## Feedback round 1 (Nov 13)

- **Save confirms itself:** after Save, the button reads "Saved" with a mint check until the next edit, in both the floating editor and the section editor.
- **Human teammates have no made-up default.** NAME starts empty ("Teammate's full name"), and a WORK EMAIL field is added. Both are required, with inline messages and focus moved to the missing field. Messages are lavender, not red, because red is for agent issues only. The email shows in the teammate's popover and on the PR panel. Opening a PR without any teammate still shows the "adding" Dana Kim ghost from frame 09 (with a placeholder email); remove it if it reads as automatic too.
- **The stage fills the window.** It keeps the 900px design height and widens to the window's shape (1440 minimum; narrower-than-16:10 windows letterbox top and bottom as before). The constellation and composer stay centred. Right-hand cards and panels are anchored to the right edge; the section editor stretches to 40px from each side. Layout shifts that cleared the panels shrink as the stage widens. The tree map's overlay now lets the prototype fill it too. This replaces the brief's fixed, letterboxed 1440×900.
- **Primary buttons take focus.** Purple buttons in pop-ups take focus when they appear, so Enter selects them: Start from the spec, Add tester, Open pull request, Reply. The exception is when the user is typing in a field or the editor. In the suggestion card, the all-clear pop-up and the comment card, Tab and Shift+Tab cycle through the card's own buttons.
- **All clear is a pop-up.** When the last section is verified, a pop-up ("All lines clear") appears with Open pull request focused and View receipt beside it. The editor closes first, if it's open. Closing the pop-up leaves the receipt panel open, and the status pill reopens the pop-up. Before this, finishing inside the editor left only the pill.
- **The teammate's review takes time and needs a reply.** After Create pull request, the teammate reviews for 4 s before the comment arrives. The pill reads "Waiting on 1 review", then "Waiting on your reply to {name}". Approval needs a reply (composer or comment card); the teammate then "reads your reply" for 3.5 s and approves. The brief's 20 s auto-approve is removed, and the idle hint on Reply stops it dead-ending.
