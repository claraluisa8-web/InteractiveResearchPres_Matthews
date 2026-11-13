# CLAUDE.md

This repo holds two things:

1. **The research tree map** at the root: a static D3 site (`index.html`, `style.css`, `data.js`, `sidebar.js`, `mapviewer.js`, `script.js`, `maps/`). Run it locally with `python3 -m http.server 8000`.
2. **The Pre-Merge Review prototype** in `prototype-src/` (Vite + React + TypeScript), published at `/prototype/`.

Before working on the prototype, embedding or restyle, read **`handoff/BRIEF.md`**. It links everything else in `handoff/`.

## Standing rules

- Never edit the Figma file. Read it only (file `lq5SOnVbKksTaIyUq67y3s`, page "Hi-Fi Screens (Spatial) v9").
- Tree map files change only as described in `handoff/docs/embed-and-deploy.md` (phase 6) and `handoff/docs/treemap-restyle.md` (phase 7).
- All colors, type and radii come from `shared/tokens.css` / `shared/tokens.json`. All text must pass WCAG AAA. There is one secondary text color; hierarchy comes from size and weight.
- Two typefaces only (Red Hat Text, Red Hat Mono). No emoji or Unicode glyphs as icons; use Codicons or SVG.
- No automatic camera motion. Red is for issues only.
- Logic keys off agent **role**, never name.
- Copy comes from `handoff/data/scenario.json`. New strings are added there with `"new": true`.
- Log any deviation from the design in `prototype-src/DECISIONS.md`.
- Keep `main` deployable; small commits.
