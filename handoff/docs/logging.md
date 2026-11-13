# Session logging (for usability testing)

The goal is to let Clara see afterwards where each tester followed the designed path and where they wandered.

## What to record

One event per entry, in memory and mirrored to `localStorage` (`pmr:session:<id>`), so a refresh doesn't lose it.

```json
{ "t": 12.84, "type": "click", "target": "line:builder-reviewer", "state": "issue", "milestone": "M4", "onPath": true }
```

| type | When | Extra fields |
|---|---|---|
| `session` | start and reset | `participant` (optional label), `userAgent`, `viewport` |
| `milestone` | each milestone fires | `id`, `msSinceStart`, `msSincePrevMilestone` |
| `click` | any interactive element | `target` (stable id like `orb:reviewer#1`, `button:verify-section`), `onPath` |
| `input` | text submitted (composer, NAME, PR title, comment reply) | `field`, `text`, `intent` (composer), `score` |
| `edit` | editor change, debounced 1.5 s | `file`, `section`, `linesChanged` |
| `save` | Save | `file`, `section`, `resolved` (bool) |
| `hint` | idle hint shown | `state`, `affordance` |
| `offPath` | a click that isn't the expected next step | `expected`, `actual` |
| `fallback` | composer reply was a fallback | `text` |
| `toast` | "Not part of this prototype" shown | `target` |

`onPath` is true when the click is on the current state's expected affordance (the same table as the hints).

## Controls

- **Off by default for the public site; on when the URL has `?test=1`** (or `?test=P1` to label the participant).
- When on, a small, unobtrusive "● Recording" dot appears in the title bar for Clara. Hide it with `?test=1&quiet=1`.
- **Export:** title-bar overflow menu → "Export session log", or Ctrl/Cmd+Shift+E. It downloads `pmr-session-<participant>-<date>.json` plus a readable `.md` summary (milestones with timings, off-path moments, fallbacks, free-text inputs).
- "Start over" asks whether to keep or clear the log.

## Privacy

Nothing leaves the browser. No network calls, no analytics.
