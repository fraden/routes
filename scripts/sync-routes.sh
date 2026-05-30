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

PYTHON_DIR="$PYTHON_KOMOOT_PATH"
OUT_DIR="$PYTHON_DIR/out"

echo "→ Running komoot GPX creator..."
cd "$PYTHON_DIR"
KOMOOTEMAIL="$KOMOOT_EMAIL" \
  KOMOOTPW="$KOMOOT_PW" \
  USERID="$KOMOOT_USERID" \
  SHOW_REAL_DATES="$KOMOOT_SHOW_REAL_DATES" \
  python src/main.py

echo "→ Syncing GPX files (new files only)..."
rsync -av --ignore-existing "$OUT_DIR"/*.gpx "$ROOT_DIR/public/gpx/"

echo "→ Syncing meta.js..."
if [ -f "$OUT_DIR/meta.js" ]; then
  cp "$OUT_DIR/meta.js" "$ROOT_DIR/data/meta.js"
  echo "  meta.js updated"
fi

echo "✓ Sync complete"
