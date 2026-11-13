# Pre-Merge Review: Claude Code handoff

This folder is everything Claude Code needs to build the interactive prototype and fit it into your tree map repo.

## How to use it

1. On the computer with the repo, unzip this folder into the repo root so it sits at **`InteractiveResearchPres_Matthews/handoff/`**.
2. Install **Node.js 20** if it isn't already (needed for the prototype build).
3. Optional but recommended: connect the **Figma MCP server** in Claude Code, so it can read exact values from your v9 frames.
4. Open Claude Code in the repo folder and paste **`prompts/01-kickoff.md`**.
5. Work through **`prompts/02-phase-prompts.md`** one phase at a time. After each, check the deployed link against **`docs/acceptance-checklist.md`**.
6. On GitHub, once: **Settings → Pages → Source: GitHub Actions**. Keep the repo public (or use GitHub Pro via the Student Developer Pack).

## What's inside

| File | What it is |
|---|---|
| `BRIEF.md` | The main build brief. Claude Code reads this first. |
| `CLAUDE.md` | Standing rules; Claude Code moves it to the repo root. |
| `docs/flow-and-milestones.md` | How the story moves forward whatever order people do things in, and how off-path actions are handled. |
| `docs/screens.md` | Every screen state: layout, behavior, hover and focus. |
| `docs/agent-replies.md` + `data/intents.json` | Scripted, forgiving agent replies (no live AI). |
| `docs/logging.md` | Session logging and export for your usability tests (`?test=P1`). |
| `docs/embed-and-deploy.md` | The pearl-orb entry in the tree map, the overlay, the GitHub Pages workflow, the offline build. |
| `docs/treemap-restyle.md` | The dark-canvas restyle of the tree map (after testing). |
| `docs/acceptance-checklist.md` | What "done" means per phase. |
| `data/scenario.json` | All copy and scenario data from v9. |
| `data/code/` | The dummy Java, spec and changelog files. |
| `tokens/` | Colors, type, orbs, radii, your optical rules, motion. |
| `references/` | Screenshots of every v9 frame. |
| `prompts/` | Prompts to paste into Claude Code. |
| `testing/participant-intro.md` | The intro message to send with the test link. |

## Things for you to review

- **New copy** I had to write because it isn't in Figma: scripted agent replies (`data/intents.json`), issue 2's "Builder says / Reviewer says" lines, a few toasts, and the builder's new **ready state** (ready card, "Start from the spec", the "Build the API from the spec" chip). All are marked `"new": true` or listed in `$newCopy`.
- **Build kickoff:** the build no longer starts on its own. After a builder is added it waits for the user's go: the button, the chip, or any message. The spec still defines what gets built.
- **Line ranges:** the ranges in 06b (e.g. L18–31, L33–42) were placeholders; the prototype computes real ranges from the dummy code, so a few numbers will differ from Figma.
- **Spec card line 28:** the real spec file keeps your line 28 exactly; the 201/Location detail sits on line 29.
- **Tree map placement:** the prototype node defaults to a new top-level "Solution: The Pre-Merge Review" branch after "Mapping". Tell Claude Code if you want it elsewhere.
