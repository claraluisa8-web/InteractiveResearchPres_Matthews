# Acceptance checklist

Run the items for a phase before showing Clara. Tick in a copy of this file, or in the PR description.

## Phase 0 · Skeleton
- [ ] `/prototype/` is live on GitHub Pages from `main`; the tree map at `/` is unchanged.
- [ ] The stage renders at 1440×900 and scales to the window without reflow; no horizontal scroll.
- [ ] Red Hat Text and Red Hat Mono load from bundled files (network tab shows no font CDN).
- [ ] Title bar, tabs, canvas, composer and status pill match `references/01-the-constellation.png`.

## Phase 1 · Empty start → add → configure
- [ ] First load shows only You, the spec card, the coach card, the `+`, the composer and "Just you so far".
- [ ] All five roles can be added from `+`, from "Add node" and from the composer ("add a reviewer").
- [ ] Naming an agent "Codey" makes "Codey" appear on the orb, the team rail, the line hover and every later screen.
- [ ] Reviewer-first, tester-first and teammate-first orders all work; auto-connect follows the rules.
- [ ] Cancel and Esc remove the ghost; nothing is left behind.
- [ ] The cross-team checkbox persists and shows in the agent popover.
- [ ] Pan, zoom and "Show whole team" work; nothing moves the camera by itself.

## Phase 2 · Build and recommendation
- [ ] Adding a builder shows the ready card, the chip and "To: {builder}"; the build does **not** start on its own.
- [ ] The build starts from each of: Start from the spec, the chip, a typed message ("build it", "start with createPlan", "asdf"), and a message sent To: Team. The builder replies, then the update card and file chips appear.
- [ ] "add a reviewer" or a spec question typed while the builder is ready gets its own reply and doesn't start the build.
- [ ] The floating editor accepts typing, shows "You're typing on line n" live, and Save keeps the edit.
- [ ] The tester recommendation appears only when a reviewer exists and no tester does; all three buttons work.
- [ ] The composer answers every test phrase in `docs/agent-replies.md`.

## Phase 3 · Issue → sections → code → verify (core of the test)
- [ ] The red line, the "2" badge, the team rail "!" flags, the legend and the red status pill appear once builder and reviewer exist and the build has started.
- [ ] Line hover card → See sections → panel; the line, badge and status pill also open it.
- [ ] Section rows show the right files and live line ranges; hovering rings the right orbs and dims the others; labels stay full strength.
- [ ] Every section opens its own file and range (not just Idempotency key).
- [ ] Typing a reasonable key check and saving resolves issue 1; typing nonsense and saving doesn't, and the reviewer says why kindly.
- [ ] Accept fix (diff preview → Apply) and Reject (confirm) both resolve; Verify then unlocks.
- [ ] Verify, Next section and ← → work; quick-verify in the panel works for non-issue rows.
- [ ] Issue 2 (Location header) is resolvable the same three ways.

## Phase 4 · All clear → PR → review → recap
- [ ] All sections verified → mint lines, check badges, the receipt with correct WROTE values ("Builder + You" when edited, using custom names).
- [ ] Copy puts a readable text receipt on the clipboard.
- [ ] The PR panel fields are editable; the teammate ghost appears only if no teammate exists.
- [ ] Replying to the comment (any text) leads to approval; or approval comes after 20 s idle.
- [ ] Merge → recap; "n caught" tags only on lines that exist; totals stay 7.

## Phase 5 · Polish
- [ ] Hover, focus and pressed states per `docs/screens.md`.
- [ ] Full keyboard path from empty start to merge (Tab / Shift-Tab / Enter / Esc / arrows in menus).
- [ ] Automated contrast check: every text pairing in every reachable state is ≥ 7:1 (≥ 4.5:1 for large text).
- [ ] `prefers-reduced-motion` removes transitions and flowing dots.
- [ ] No emoji or Unicode glyph icons anywhere (search the source for ↔ → ✓ ✱ etc.); all icons are Codicons or SVG.
- [ ] Idle hints appear after 25 s, once per state.
- [ ] Off-path table in `flow-and-milestones.md`: every row behaves as specified.
- [ ] `?test=P1` logs; export produces `.json` and `.md`; `?reset` and Start over work.
- [ ] No console errors through a full run; works in current Chrome, Safari and Firefox.

## Phase 6 · Tree map entry
- [ ] The prototype node renders as the pearl orb and is keyboard accessible.
- [ ] The overlay opens the prototype; ←/→ and `/` inside the iframe don't move the tree; Esc and × close it; "Open in new tab" works.

## Phase 7 · Restyle and offline
- [ ] The tree map matches `docs/treemap-restyle.md`; every existing interaction still works.
- [ ] With Wi-Fi off, both `/` and `/prototype/` work from the local build.
