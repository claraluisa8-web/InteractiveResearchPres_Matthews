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
