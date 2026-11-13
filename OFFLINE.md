# Running offline (symposium, Nov 23)

The tree map and the prototype both run from your laptop with no internet. D3 is vendored, and fonts, icons and tokens are local, so nothing loads from a CDN.

## Once, while you still have internet (before Nov 22)

You need Node.js 20 or later and Python 3 (macOS has it).

```sh
cd InteractiveResearchPres_Matthews
git pull
npm run build:offline
```

This builds the prototype and puts the whole site in `_site/`, the same way GitHub Pages builds it. `npm ci` inside the script is the only step that needs the network.

## At the symposium (Wi-Fi can be off)

```sh
cd InteractiveResearchPres_Matthews
npm run serve:offline
```

Then open **http://localhost:8000/** in Chrome:

- `http://localhost:8000/`: the tree map. The pearl orb under "Solution" opens the prototype in its overlay.
- `http://localhost:8000/prototype/?reset`: the prototype on its own, from a clean start.

Stop the server with Ctrl+C.

## Check it the day before

1. Run `npm run build:offline`, then turn Wi-Fi off.
2. Run `npm run serve:offline` and open both links above.
3. Open a branch, open a research map, open the prototype from the orb, and add a builder. Everything should work and look the same as online.

## If something's off

- **Blank page or 404:** the build didn't run. Run `npm run build:offline` (with internet), then serve again.
- **Port 8000 is busy:** run `python3 -m http.server 8001 --directory _site` and use `localhost:8001`.
- **The prototype shows an old state:** add `?reset` to its URL, or use the ⋯ menu, then Start over.
- **No Node on the demo machine:** build on your own laptop, then copy the `_site/` folder over. Any static server works, e.g. `python3 -m http.server 8000 --directory _site`.
