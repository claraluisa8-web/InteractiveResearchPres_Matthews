# Flow, milestones and off-path handling

The prototype tells one story, but the user drives it. Model it as **conditions that fire milestones**, not as a click script. A milestone fires the moment its condition becomes true, whatever route the user took. Each milestone fires once.

## Milestones

| # | Milestone | Condition | What happens | Figma |
|---|---|---|---|---|
| M0 | start | page load / reset | Only You. Spec card attached to You. "Start your team" coach card points at the `+` beside You. Status pill "Just you so far". Composer "To: Team". | 01 |
| M1 | collaborator added | user confirms any configure panel | Orb becomes active; line to You (and to others per *Auto-connect*). Coach card disappears for good. | 02, 03 |
| M1b | buildReady | a builder is active and the build hasn't started | **The builder waits for the user's go.** Ready card (top-right, where the update card will appear): builder orb + name, "IBM Bob · Default · ready", "Ready to build from recurring-investments.yaml.", primary **Start from the spec**. A suggestion chip above the composer: "Build the API from the spec". Composer target switches to "To: {builder}", placeholder "Tell {builder} what to build…". Status "{builder} ready to build". | 04 (new state) |
| M2 | buildStarted | buildReady **and** the user clicks Start from the spec, clicks the chip, **or sends any message** to the builder or the team (see `anyMessageStartsBuild` in `data/intents.json`) | The ready card turns into the builder update card with file chips; the builder replies "Building createPlan, listPlans and updatePlanStatus from the spec."; You↔Builder line becomes *working* (blue with flowing dots). Status "Building · no issues". | 04 |
| M3 | recommendation | buildStarted **and** a reviewer is active **and** no tester exists, 4 s later (or right after the user closes or saves the floating file) | Reviewer gets the lavender non-urgent ring; a dashed suggested Tester ghost appears, dotted-linked to the reviewer; recommendation card. Status "1 suggestion". **Skipped entirely if a tester already exists.** | 05 |
| M4 | issueRaised | buildStarted **and** builder and reviewer both active **and** (M3 handled: accepted, dismissed or skipped), 3 s later | Builder↔Reviewer line turns red with badge "2". Team rail flags both with "!". Status "2 issues on 1 line" (red pill). Legend "Red line = issue between two collaborators". | 06 |
| M5 | sectionsOpened | user clicks the red line, its badge, the hover card's "See sections", or the red status pill | Sections panel for that line. | 06b |
| M6 | sectionEdited / sectionSaved | user types in a section's code / presses Save | See *Editor rules*. | 07 |
| M7 | allSectionsVerified | every section that exists is verified | All lines settle to mint with check dots; team rail shows mint checks; Verification receipt panel; status "All lines clear". | 08 |
| M8 | prOpened | user clicks "Open pull request" (receipt), asks to merge or ship, or uses the Code tab's PR action | PR panel. If no teammate exists, Dana Kim appears as a dashed ghost "Human teammate · adding" with a dashed pending line to You. | 09 |
| M9 | teammateReview | user clicks "Create pull request" | PR #482 panel with checks; Merge locked; the teammate's orb gets a lavender ring; a comment card is anchored to the You↔teammate line. Status "Waiting on 1 review". | 10 |
| M10 | teammateApproved | user replies to the comment (any text) **or** 20 s pass with no reply | Teammate subtitle "Approved #482"; Merge unlocks. | 10 |
| M11 | merged | user clicks Merge | Recap panel; "n caught" tags on each line; status "Merged · all lines clear". | 11 |

### Any-order rules

- **Roles can arrive in any order.** A reviewer added before any builder just connects to You and says "Waiting for a builder" in its subtitle.
- **The build never starts on its own.** The spec defines *what* gets built; the user only gives the go (button, chip or any message). Prompting isn't the research focus, so any wording works and nothing is judged. Adding more agents while the builder is ready is fine; the ready card stays up.
- **Auto-connect.** When a reviewer and a builder both exist, connect them automatically (the reviewer checks the builder's work). A tester auto-connects to the reviewer. Teammates connect to You. Other agents connect to You and to the builder.
- **Multiples.** With several builders or reviewers, the issue goes on the line between the **first-added** builder and the **first-added** reviewer. Later ones get believable quiet statuses ("Helping {firstBuilder} · no conflicts").
- **"Other" agents** (security, accessibility, docs, performance, custom) join, connect, and show a believable status that never blocks the flow: Security "Watching for secrets · no findings", Accessibility "No UI in this change", Docs "Drafting the CHANGELOG entry", Performance "No hot paths changed", custom "Standing by".
- **Teammate added early** becomes the PR reviewer later; skip the "adding" ghost in M8.
- **No tester ever added:** the Contract tests section doesn't exist (total is 7, not 8), and the recap redistributes counts so the total stays 7.
- **Renaming** (configure panel or the orb's card) updates every label, line hover, breadcrumb, receipt row and reply immediately.

## Editor rules (section-scoped code, frame 07)

- Opening a section opens the pop-up with **that section's file**, scrolled so the section's first line sits about a third of the way down, with a section marker row above it (`SECTION · {NAME} · L{start}–{end}`). The whole file is still scrollable.
- **Left column:** issue sections show Builder says / The spec / Reviewer says cards (agent-tinted). Non-issue sections show an "About this section" card instead (who wrote, reviewed and tested it, plus a one-line plain summary) and the spec excerpt where relevant.
- **Typing** marks changed rows as yours (solid neutral gutter mark), shows "Unsaved changes" with a lavender dot, and annotates the first changed row "You · not saved yet".
- **Save** →
  - **Issue section:** toast "Sent to {builder} and {reviewer} to recheck", then 2 s later evaluate the issue's `resolvedWhen` (data/scenario.json). **If met:** "{builder} and {reviewer} agree. You can verify this section." and Verify unlocks. **If not met:** the reviewer card updates kindly ("The key still isn't checked before the plan is created.") and Verify stays locked. Accept fix and Reject remain available, so the user is never stuck.
  - **Non-issue section:** toast, and Verify is available (it always is for non-issue sections).
- **Accept {reviewer}'s fix** → an inline diff preview (added rows mint-tinted, removed rows red-tinted) with Apply / Cancel. Apply writes the fix, resolves the issue and unlocks Verify.
- **Reject** → an inline confirm: "Reject {reviewer}'s finding? It's recorded on the receipt with your name." Reject / Cancel. Rejecting resolves the issue for the flow; the receipt row shows "Rejected by you".
- **Verify section** → mint check on the row; the line's progress updates. **Next section** → the next unverified section, issues first, then same line, then elsewhere. Header ← → move between issues (or sections when there are no issues left). × closes back to the constellation with the sections panel still open.
- **Code tab:** clicking it with nothing open opens the editor on the first unverified section (or `PlanController.java` from the top when all are verified). Clicking the Constellation tab closes the pop-up.
- **Quick verify:** in the sections panel, rows without issues show a "Verify" button on hover and focus, so the user doesn't have to open every section. Issue sections must be resolved in the editor (or by Accept fix or Reject).

## Off-path handling (nothing dead-ends)

| User does… | Response |
|---|---|
| Clicks any orb | Agent popover: name, role, configuration, status, **Edit** (reopens configure), **Open {file}** (builder), **Remove**. Removing a builder or reviewer after M2 asks for confirmation, warning that the line's open work goes with it. Cancel is the default. |
| Clicks a non-issue line | Hover card with "{a} ↔ {b}", connection kind and section count; "See sections" opens that line's panel (sections with no issues). |
| Types anything in the composer | Intent match (`docs/agent-replies.md`); always a reply, never silence. |
| Adds more agents late | Allowed at any point; they join with quiet statuses and never reset progress. |
| Presses Esc | Closes the topmost layer: popover → confirm → menu → panel → pop-up. |
| Clicks title-bar traffic lights or the repo/branch title | Inert (window chrome). Default cursor, no hover. |
| Clicks an out-of-scope control (e.g. "Adjust first" → advanced options, "Copy" receipt) | Do the believable thing (Copy really copies a text receipt), otherwise toast "Not part of this prototype". |
| Waits with no progress for 25 s in a state | **Hint:** the next affordance pulses (lavender ring, 2 cycles), once per state. Never modal. |
| Gets confused and wants to restart | Title-bar overflow menu (⋯ icon) → "Start over" (confirm). Hidden: Ctrl/Cmd+Shift+R and `?reset`. |
| Edits the spec | Locked: "Approved specs are read-only for every agent." (the editor is read-only for `.yaml`). |
| Resizes the window | The stage scales; nothing reflows. |

## Hints by state (what pulses)

empty → `+` beside You · draft panel open → "Add to constellation" · builder ready → "Start from the spec" · building, no reviewer → `+` (the composer hint says "Add a reviewer") · recommendation → "Add tester" · issue → red line badge · sections panel → first issue row · editor with unsaved edits → Save · editor saved and resolved → Verify section · all verified → "Open pull request" · PR panel → "Create pull request" · review → comment Reply · approved → Merge.

## Timing constants (tune in one place)

`readyCardDelay 600 ms (after the builder is added) · recommendationDelay 4000 · issueDelay 3000 · recheckDelay 2000 · teammateAutoApprove 20000 · idleHint 25000 · replyThinking 700–1200`
