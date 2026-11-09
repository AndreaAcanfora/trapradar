#!/bin/sh
# Builds the zip to upload to addons.mozilla.org and the Chrome Web Store:
# dist/trapradar-<version>.zip, with manifest.json at the root and no tests.
set -eu
cd "$(dirname "$0")/../extension"
version=$(node -p 'require("./manifest.json").version')
out="../dist/trapradar-$version.zip"
mkdir -p ../dist
rm -f "$out"
zip -qrX "$out" manifest.json icons popup src -x '.*' '*/.*'
echo "$out"
