#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env not found at $ENV_FILE"
  echo "Copy .env.example to .env and fill in your credentials."
  exit 1
fi

source "$ENV_FILE"

if [ -z "$PYTHON_KOMOOT_PATH" ]; then
  echo "Error: PYTHON_KOMOOT_PATH not set in .env"
  exit 1
fi

for var in KOMOOT_EMAIL KOMOOT_PW KOMOOT_USERID; do
  if [ -z "${!var}" ]; then
    echo "Error: $var not set in .env"
    exit 1
  fi
done

PYTHON_DIR="$PYTHON_KOMOOT_PATH"
OUT_DIR="$PYTHON_DIR/out"

echo "→ Clearing existing GPX files and meta.js..."
rm -f "$ROOT_DIR/public/gpx/"*.gpx
rm -f "$ROOT_DIR/data/meta.js"

echo "→ Running komoot GPX creator..."
cd "$PYTHON_DIR"
KOMOOTEMAIL="$KOMOOT_EMAIL" \
  KOMOOTPW="$KOMOOT_PW" \
  USERID="$KOMOOT_USERID" \
  SHOW_REAL_DATES="$KOMOOT_SHOW_REAL_DATES" \
  python src/main.py

echo "→ Copying GPX files..."
shopt -s nullglob
gpx_files=("$OUT_DIR"/*.gpx)
if [ ${#gpx_files[@]} -eq 0 ]; then
  echo "  No GPX files found in $OUT_DIR"
else
  rsync -av "${gpx_files[@]}" "$ROOT_DIR/public/gpx/"
fi

echo "→ Syncing meta.js..."
if [ -f "$OUT_DIR/meta.js" ]; then
  cp "$OUT_DIR/meta.js" "$ROOT_DIR/data/meta.js"
  echo "  meta.js updated"
fi

echo "✓ Sync complete"
