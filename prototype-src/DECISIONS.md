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
