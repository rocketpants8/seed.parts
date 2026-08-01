#!/usr/bin/env bash
# Build a self-contained static release zip + SHA256SUMS from dist/secrets/browser.
# Expects a production build to already exist (yarn build -c production).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(grep -oE '"version": "[0-9]+\.[0-9]+\.[0-9]+"' src/config.ts | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"
if [[ -z "${VERSION}" ]]; then
  echo "Could not read version from src/config.ts" >&2
  exit 1
fi

# When run from a tag push (refs/tags/vX.Y.Z), require config.ts to match.
if [[ "${GITHUB_REF:-}" == refs/tags/v* ]]; then
  TAG_VERSION="${GITHUB_REF#refs/tags/v}"
  if [[ "${TAG_VERSION}" != "${VERSION}" ]]; then
    echo "Tag version (${TAG_VERSION}) does not match src/config.ts (${VERSION})" >&2
    exit 1
  fi
fi

DIST="dist/secrets/browser"
if [[ ! -f "${DIST}/index.html" ]]; then
  echo "Missing build output at ${DIST}. Run: yarn build -c production" >&2
  exit 1
fi

OUT="release"
ZIP_NAME="seed-parts-${VERSION}.zip"
rm -rf "${OUT}"
mkdir -p "${OUT}/staging"

# Copy without preserving ownership (dist may be owned by another uid in containers).
cp -R "${DIST}/." "${OUT}/staging/"

cat > "${OUT}/staging/RUN.txt" <<EOF
Seed.Parts ${VERSION}
====================

This folder is a self-contained build of Seed.Parts. All secret splitting
and encryption runs in your browser; nothing is sent to a server.

Serve locally (do not open index.html via file://):

  npx --yes serve -l 8080
  # or: python3 -m http.server 8080

Then open http://localhost:8080 in your browser.

Verify integrity (from the directory that contains this zip and SHA256SUMS):

  sha256sum -c SHA256SUMS
EOF

(
  cd "${OUT}/staging"
  zip -r "../${ZIP_NAME}" .
)

(
  cd "${OUT}"
  sha256sum "${ZIP_NAME}" > SHA256SUMS
)

rm -rf "${OUT}/staging"

echo "Created ${OUT}/${ZIP_NAME}"
echo "Created ${OUT}/SHA256SUMS"
cat "${OUT}/SHA256SUMS"
