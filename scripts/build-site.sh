#!/bin/sh
# Builds the whole published site into _site/: the tree map at the root and the prototype at
# /prototype/. GitHub Pages and the offline symposium build both use this script, so they match.
set -e
cd "$(dirname "$0")/.."

(cd prototype-src && npm ci && npm run build)

rm -rf _site
mkdir -p _site
rsync -a \
  --exclude '.git*' --exclude '.github' --exclude '.claude' --exclude 'prototype-src' \
  --exclude 'handoff' --exclude 'handoff-research' --exclude 'scripts' --exclude '_site' --exclude 'node_modules' \
  --exclude 'package.json' --exclude 'OFFLINE.md' --exclude 'CLAUDE.md' \
  ./ _site/
mkdir -p _site/prototype
cp -r prototype-src/dist/. _site/prototype/

# Stamp the tree map's own CSS and JS links with this build's version, so a new deploy is never
# hidden behind the browser's cached copy (GitHub Pages lets browsers keep files for 10 minutes).
VERSION=$(git rev-parse --short HEAD 2>/dev/null || date +%s)
sed -i.bak -E "s#(href=\"(shared/[a-z]+|style)\.css)\"#\1?v=$VERSION\"#g; s#(src=\"[a-z]+\.js)\"#\1?v=$VERSION\"#g" _site/index.html
rm -f _site/index.html.bak

echo "Built _site/. Serve it with: npm run serve:offline"
