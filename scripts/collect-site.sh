#!/bin/sh
# Copy the files GitHub Pages should serve. Leaves README, scripts, and workflows out.
set -eu
dest="${1:-_site}"
rm -rf "$dest"
mkdir -p "$dest"
cp index.html site.config.json site.config.schema.json status.json .nojekyll "$dest/"
cp -R css "$dest/css"
cp -R js "$dest/js"
cp -R assets "$dest/assets"
