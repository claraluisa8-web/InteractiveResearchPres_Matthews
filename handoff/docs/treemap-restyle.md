# Tree map restyle: dark canvas (phase 7, after usability testing)

Restyle the existing tree map so it feels like the same product as the prototype. **Change styling only.** The data, interactions, keyboard shortcuts, search, progress and map viewer behavior all stay as they are.

## Direction

- **Canvas:** the prototype's dark canvas (`--pmr-canvas-gradient`, floor glow, faint perspective grid, vignette) behind the tree. Use `shared/tokens.css`. No separate palette.
- **Type:** Red Hat Text for everything; Red Hat Mono only for code-like strings. Replace the system font stack.
- **Accent:** lavender replaces the orange `--accent: #c2410c` everywhere (focus outlines, progress fill, search highlights, active outline item bar).
- **Text:** `--pmr-text` and `--pmr-text-2` only (AAA). The current `--muted #6b6b66` goes.

## Element mapping

| Today | Restyled |
|---|---|
| White chart background, `#fafaf8` sidebar | dark canvas; sidebar becomes a glass panel (`.pmr-glass`) on the canvas |
| 5px node circles | small flat orbs: 8px (leaf) / 10px (category) circles with a subtle 135° gradient in the canvas blues, a 1px `rgba(255,255,255,0.22)` border; categories with hidden children get a faint lavender ring |
| Response nodes (dashed circle, italic) | dashed ring in `--pmr-text-2`, label in Red Hat Text italic |
| Link paths `--line #b9b9b2` | 1.5px `rgba(255,255,255,0.16)` "constellation" lines; the path to the selected node uses `--pmr-working-line` |
| Labels | 13/500 `--pmr-text` (selected 13/600), with a soft dark text shadow for legibility over the grid |
| The prototype node | the You pearl orb from `embed-and-deploy.md`; the brightest thing on the canvas |
| Details card (`#details`) | glass card, 18/600 title, 13/400 note, buttons per `tokens.css` |
| Search, results, kbd | glass input (`--pmr-input`), results in a glass list, highlight `mark` tinted lavender |
| Progress bar | 4px track `rgba(255,255,255,0.08)`, lavender fill |
| Prev/Next, Show all, Open all, View map buttons | secondary button style; "View map" keeps its mark |

## The research maps (Stakeholder, Ecosystem, Journey SVGs)

These stay **light**. In the map viewer, present each SVG on a **light card**: an off-white `#F5F5FA` panel with a 16px radius and the glass shadow, centered on the dark overlay, like a document laid on the desk. Hotspot highlights use lavender. The map header (title, hint, close) sits on the dark overlay in Red Hat Text.

## Checks

- Every text pairing passes AAA (7:1; large text 4.5:1). Run the same contrast check as the prototype.
- Wheel zoom, drag pan, ←/→ stepping, `/` search, Shift-click open-all and Alt-click slow animation all still work.
- With D3 vendored locally, the restyled tree map loads with the network off.
