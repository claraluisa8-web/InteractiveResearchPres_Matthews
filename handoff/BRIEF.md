# The Pre-Merge Review: interactive prototype brief

You are building a working, browser-hosted prototype of **The Pre-Merge Review**, a graduate design concept (NC State MGXD, GD 503, in collaboration with IBM). It goes into Clara Matthews's existing research tree map repo and publishes to GitHub Pages.

Read this file first, then the docs it links. When a doc and this file disagree, this file wins. When anything here disagrees with the Figma frames on **copy**, `data/scenario.json` wins. When it disagrees on **visual detail**, Figma wins.

## Dates that drive every decision

| Date | What happens |
|---|---|
| Nov 13 | Pilot session on the deployed prototype. The full happy path must work end to end. |
| Nov 14–17 | 3 usability sessions with engineers. The prototype must not dead-end, crash or need a facilitator to rescue it. |
| Nov 18–21 | Fixes from testing, then the tree map restyle. |
| Nov 22 | Freeze. An offline build must exist. |
| Nov 23 | Symposium demo. |

Build the prototype first. The tree map restyle comes after usability testing.

## 1. The concept in one paragraph

A senior software engineer (persona: **Leila Moreno**) builds a feature with AI agents. Instead of a chat window, she gets a **constellation**: she is a single dot in a 3D-feeling space, and she adds collaborators (a builder agent, a reviewer agent, a tester, a human teammate, any other agent) as orbs connected by lines. Work flows along the lines. When two collaborators disagree, **the line between them turns red**. Clicking it shows the **sections** of code involved, in plain names. Choosing a section opens **just that section's code** in an editor she can type in. She saves, both agents recheck, she verifies the section, and once every section is verified the lines settle. She opens a pull request with a **verification receipt** attached, a human teammate reviews it, and it merges. The research problem behind it: *engineers need a way to increase the verification efficacy of agent-generated outputs so they can stay accountable for code they didn't fully author.*

Vocabulary, used exactly as written: **Constellation** (one engineer's setup), **Cluster** (a team's constellations, not built in this prototype), **Galaxy** (the org's service network, mentioned only), **orbit** (only in descriptive text: "3 agents in your orbit", never on buttons). Agents run on **IBM Bob**. Strictness is **Strict** and locked by IBM policy.

## 2. Non-negotiables

1. **It follows the designed path, but it's forgiving.** The story always moves through the same milestones (see `docs/flow-and-milestones.md`), but users reach them by their own route. Track **milestones and conditions, not click sequences**.
2. **It starts as empty as possible.** First screen: Leila's dot, the attached spec card, a "Start your team" hint, an empty composer, and the "Just you so far" status pill. No collaborators, lines, issues or sections exist until the user's actions create them.
3. **Role, never name.** Users can name agents anything ("Codey", "Backend helper") and add them in any order. Logic keys off `role` (`builder | reviewer | tester | teammate | other`). Every string that mentions an agent interpolates the user's chosen name.
4. **Few dead ends.** Every visible control does something real or believable. Truly out-of-scope controls show a calm toast ("Not part of this prototype") rather than doing nothing. Close, Cancel, Esc and Back always work.
5. **Real input.** Real text fields, a real code editor (typing, selection, undo, paste), real checkboxes and selects. Nothing is a picture of a control.
6. **Hover and focus states everywhere** (see `docs/screens.md` §Hover & focus).
7. **Dummy code is real and consistent.** Use the files in `data/code/`. Every section opens to believable code, not just the one in the design.
8. **WCAG AAA text contrast** using `tokens/` only. One secondary text color (`#B8CAE2`); hierarchy comes from **size and weight**, not darker greys. Full keyboard access, visible focus rings, `prefers-reduced-motion` respected.
9. **Two typefaces only:** Red Hat Text (UI) and Red Hat Mono (code, file names, identifiers). **No emoji and no Unicode glyph stand-ins** for icons or arrows (no ↔ → ✓ as text). Use Codicons (`@vscode/codicons`) or drawn SVG.
10. **Enterprise calm motion.** No automatic camera moves or zooms. The user may zoom and pan the constellation themselves; a "Show whole team" control fits everything in view. Transitions are short cross-fades (≤200 ms).
11. **Red means issues only.** Lavender means non-urgent ("worth a look"). Mint means cleared or verified.
12. **No backend and no API keys.** Agent replies are scripted with intent matching (`data/intents.json`).
13. **It must run offline** for the symposium: self-host fonts, icons and D3; no runtime CDN calls in the production build.

## 3. Repo and integration

The repo (`InteractiveResearchPres_Matthews`) is a **static, no-build site** at its root: `index.html`, `style.css`, `data.js`, `sidebar.js`, `mapviewer.js`, `script.js`, `maps/*.svg`, with D3 7.9 loaded from jsDelivr. Locally it runs via `python3 -m http.server 8000` (`.claude/launch.json`).

- **Don't restructure the tree map.** In phases 1–5, the only tree map changes allowed are the ones in `docs/embed-and-deploy.md` (one data entry, the overlay, the orb node).
- Put the prototype in **`prototype-src/`** (Vite project). It builds to **`/prototype/`** on the published site.
- Copy `tokens/tokens.css` and `tokens/tokens.json` into the repo at **`shared/tokens.css`** and **`shared/tokens.json`**, and import them from both the prototype and (in phase 7) the tree map.
- Publish both together with one GitHub Actions workflow (`docs/embed-and-deploy.md`).
- localStorage keys are prefixed **`pmr:`**.

## 4. Stack

- **Vite + React + TypeScript.** Relative `base: './'` so it works under `/<repo>/prototype/`.
- **State:** one reducer or Zustand store holding the whole scenario state (section 5), plus derived selectors. No routing library is needed. "Screens" are states, not routes. Keep a `?reset` query param and a hidden reset shortcut (Ctrl/Cmd+Shift+R handled in-app).
- **Editor:** CodeMirror 6 with Java and YAML language support and a custom theme built from `tokens.color.code`. Line numbers 1px smaller than code. Gutter markers for authorship (dashed builder, solid you), issue rows and issue bars.
- **Constellation rendering:** HTML/CSS for orbs and labels plus an SVG layer for lines, inside one transformable "world" div (pan and zoom with pointer and wheel, clamped). Orbs are CSS gradients plus blurred swirl ellipses (`tokens.orb`).
- **Icons:** `@vscode/codicons` (SVG or font). **Fonts:** `@fontsource/red-hat-text`, `@fontsource/red-hat-mono`.
- **Viewport:** design at **1440×900**. Render the app at that fixed size and scale it uniformly to fit the window (letterboxed on the canvas color), so every layout matches Figma. Minimum supported window: 1280×720.

## 5. State model (summary; full rules in `docs/flow-and-milestones.md`)

```ts
type Role = 'you' | 'builder' | 'reviewer' | 'tester' | 'teammate' | 'other';
interface Collaborator { id: string; role: Role; name: string; subtitle: string; configuration: string;
  allowedToEdit: string[]; crossTeamRequests: boolean; connectsTo: string[];
  status: 'draft' | 'suggested' | 'active' | 'verified'; addedAt: number; }
interface Line { id: string; a: string; b: string; kind: 'connected' | 'working' | 'issue' | 'pending' | 'suggested' | 'cleared'; issues: number[]; caught: number; }
interface SectionState { id: string; status: 'issues' | 'open' | 'verified'; editedByYou: boolean; }
interface IssueState { id: number; status: 'open' | 'fixPreview' | 'savedAwaitingAgents' | 'resolved' | 'rejected'; }
interface Milestones { builderAdded; reviewerAdded; buildStarted; recommendationShown; issueRaised;
  sectionsOpened; sectionEdited; sectionSaved; allSectionsVerified; prOpened; teammateApproved; merged }
```

Files are held in state as editable strings, seeded from `data/code/`. Section line ranges are computed from the current file text using the anchors in `data/scenario.json`, so they stay correct after the user edits.

## 6. Where everything is

| Need | File |
|---|---|
| Milestones, triggers, any-order rules, off-path handling, hints | `docs/flow-and-milestones.md` |
| Every screen state: layout, copy keys, behavior, hover/focus, Figma node | `docs/screens.md` |
| Scripted agent replies and matching | `docs/agent-replies.md` + `data/intents.json` |
| All copy and scenario data | `data/scenario.json` |
| Dummy code and spec | `data/code/` |
| Colors, type, orbs, radii, optical rules, motion | `tokens/tokens.json`, `tokens/tokens.css` |
| Session logging and export | `docs/logging.md` |
| Tree map entry orb, overlay, GitHub Pages workflow, offline build | `docs/embed-and-deploy.md` |
| Tree map dark restyle (phase 7) | `docs/treemap-restyle.md` |
| What "done" means | `docs/acceptance-checklist.md` |
| Visual reference (1024px screenshots of every frame) | `references/*.png` |

## 7. Figma

- File: **GD-503 Working Files**, key `lq5SOnVbKksTaIyUq67y3s`, page **"Hi-Fi Screens (Spatial) v9"** (page id `551:2`). If the Figma MCP server is connected, use it to read exact spacing and values from the frames below. If it isn't, use `references/`.
- Frames: `00 Style Tile 551:5`, `01 The Constellation 551:165`, `02 Add a Node 551:213`, `03 Configure the Node 551:276`, `04 Build in the Constellation 551:373`, `05 Approve a Recommendation 551:480`, `06 Issues on the Lines 551:568`, `06b Sections on a Line 551:1424`, `07 Edit in Code 551:1246`, `08 All Clear 551:796`, `09 Open a Pull Request 551:937`, `10 Teammate Review 551:1025`, `11 Productivity Recap 551:1125`.
- **Never edit the Figma file.** Earlier pages (v1–v8) are Clara's process record.
- The frames are **storyboard snapshots**, not the full UI. Where a state isn't drawn (for example a builder configured before a reviewer, or a renamed agent), extend the drawn patterns. Don't invent new visual language.

## 8. Build phases (stop at each ★ and show Clara the deployed URL)

0. **Skeleton and deploy.** Vite app in `prototype-src/`, the workflow, `shared/` tokens, fonts and icons, the scaled 1440×900 stage, the title bar with tabs, the canvas background, composer and status pill. Deploy on day one. ★
1. **Empty start → add → configure.** Frames 01–03 for every role, renaming, Cancel, the cross-team checkbox, connects-to, the ghost "Not added yet" orb. Orb rendering and layout. Pan, zoom, "Show whole team". ★
2. **Build and recommendation.** Frames 04–05: the builder's ready state (it waits for the user's go: Start from the spec, the suggestion chip, or any message), builder update card, floating editable file (`PlanService.java`), Save, working lines, the reviewer's tester suggestion (skipped if a tester already exists). Composer with scripted replies. ★
3. **Issue → sections → code → verify.** Frames 06, 06b, 07: red line and badge, team rail flags, line hover card, sections panel with hover linking, section-scoped editor, issue explanations, Save → agents recheck → Verify, Next section, Accept fix and Reject, issue 2. This is the core of the usability test. ★
4. **All clear → PR → teammate → merge → recap.** Frames 08–11. ★
5. **Polish for testing.** Hover and focus everywhere, off-path handling sweep, hints, session logging and export, accessibility and AAA check, reset. Then Clara's pilot. ★
6. **Tree map entry.** Orb node, overlay, "Open in new tab", close message. ★
7. **After testing:** tree map dark restyle (`docs/treemap-restyle.md`), then the offline build. ★

## 9. Working agreements

- **Don't change design decisions silently.** If something in the design can't work as drawn, pick the closest faithful option, keep going, and log it in **`prototype-src/DECISIONS.md`** (what, why, which frame).
- **Use copy from `data/scenario.json`.** New strings that aren't in it (toasts, errors, replies) go into it, marked `"new": true`, so Clara can review them.
- **Clara's optical rules are real requirements** (`tokens.json → opticalRules`): extra bottom/right padding, text ~1px low in pills, plus icons centered on the glyph, checks 0.5px low.
- **Small commits** with clear messages. Keep `main` deployable.
- **Before each ★,** run the acceptance checklist items for that phase and an automated contrast check (axe-core or a script) on every state you can reach.
