# Embedding in the tree map and deploying

## Repo layout after this work

```
/ (existing tree map, static, unchanged except where noted)
  index.html  style.css  data.js  sidebar.js  mapviewer.js  script.js  maps/
  shared/tokens.css  shared/tokens.json          <- new, copied from handoff/tokens
  prototypeviewer.js                             <- new: overlay that hosts the prototype
  vendor/d3.v7.9.0.min.js                        <- new (phase 7): local D3 for offline
  prototype-src/                                 <- new Vite app (the prototype)
  handoff/                                       <- this folder, kept for reference
  .github/workflows/pages.yml                    <- new
```

The published site: `/` = tree map, `/prototype/` = the prototype (standalone, used for usability testing).

## Entry point in the tree map: the "You" orb

- In `data.js`, add one node (Clara will confirm the exact placement; default: a new top-level child **"Solution: The Pre-Merge Review"** after "Mapping") with a new field, mirroring the existing `map` field:

```js
{ name: "Solution: The Pre-Merge Review", short: "Solution",
  note: "Open the working prototype.",
  prototype: { src: "prototype/index.html", title: "The Pre-Merge Review" } }
```

- In `script.js`, nodes with `d.data.prototype` render as the **You pearl orb** instead of the 5px dot: about 16–18px radius, SVG `linearGradient` (135°, `#F6F2FF → #DDD4FF → #C3D6FF`) plus two blurred swirl ellipses (`#C77DFF`, `#4C7DFF`) clipped to the circle, a 1px `rgba(255,255,255,0.22)` border, a soft `rgba(185,168,255,0.45)` glow (SVG filter), and a small reflection ellipse beneath. Keep the existing label behavior. Add an "Open prototype" badge next to the label, styled like the existing "View map" badge.
- Hover/focus: glow +20%, a 2px lavender focus ring. Keyboard: Enter/Space opens it. `aria-label="Open the Pre-Merge Review prototype"`.
- Sidebar outline: give this item a 10px pearl dot instead of the ✱ map mark.

## Prototype overlay (`prototypeviewer.js`)

- Model it on `mapviewer.js`: a full-chart dialog (`role="dialog"`, labelled) with a header (title, "Open in new tab" link, close × with `aria-label="Close prototype (Esc)"`) and an **iframe** to `prototype/index.html?embed=1`.
- The iframe keeps a 1440×900 aspect ratio, scaled to fit the overlay, letterboxed on `#050A12`.
- **Why an iframe:** the tree map listens globally for ←/→, PageUp/PageDown and `/` (`sidebar.js`) and uses wheel zoom (`d3.zoom`). The iframe stops those from firing while testers type or scroll in the prototype, and keeps the two apps' CSS separate.
- **Esc inside the iframe** never reaches the parent. When `embed=1`, the prototype handles Esc at the top level only when no layer is open, and then calls `parent.postMessage({type:'pmr:close'}, '*')`. The overlay listens for that message (check `event.source === iframe.contentWindow`) and closes.
- Opening the overlay closes any open map (same pattern as `mapViewer.close()` in `script.js`). Focus moves into the iframe on open and back to the orb node on close.
- When `embed=1`, the prototype hides the "Start over" confirm's "Export log" option unless `test` is also set.

## GitHub Pages workflow (`.github/workflows/pages.yml`)

```yaml
name: Deploy site
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: prototype-src/package-lock.json }
      - run: npm ci && npm run build
        working-directory: prototype-src
      - name: Assemble site
        run: |
          mkdir -p _site
          rsync -a --exclude '.git*' --exclude '.github' --exclude 'prototype-src' --exclude 'handoff' --exclude '_site' ./ _site/
          mkdir -p _site/prototype && cp -r prototype-src/dist/. _site/prototype/
      - uses: actions/upload-pages-artifact@v3
        with: { path: _site }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.d.outputs.page_url }}' }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```

**One-time manual step for Clara:** repo Settings → Pages → Source: **GitHub Actions**. Pages on a free account needs a **public** repo (or GitHub Pro, free with the Student Developer Pack).

## Offline / symposium build

- `npm run build` already produces a self-contained `/prototype/` (fonts and icons bundled; no CDN).
- Phase 7: vendor D3 into `vendor/` and point `index.html` at it, so the tree map works offline too.
- Add `npm run serve:offline` at the repo root (or document `python3 -m http.server 8000` after assembling `_site`) and a one-page `OFFLINE.md` explaining how to run it from a laptop with no internet.
