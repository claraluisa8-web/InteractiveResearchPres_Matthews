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
  --exclude 'handoff' --exclude 'scripts' --exclude '_site' --exclude 'node_modules' \
  --exclude 'package.json' --exclude 'OFFLINE.md' --exclude 'CLAUDE.md' \
  ./ _site/
mkdir -p _site/prototype
cp -r prototype-src/dist/. _site/prototype/

echo "Built _site/. Serve it with: npm run serve:offline"
