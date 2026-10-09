#!/usr/bin/env bash
# Pulls the latest code, updates the database schema, rebuilds and restarts with no downtime.
# Run on the server from the app folder:   bash deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Pulling latest code"
git pull --ff-only

echo "→ Installing dependencies"
npm ci --legacy-peer-deps

echo "→ Updating database schema (safe to re-run)"
node scripts/init-db.mjs

echo "→ Building"
npm run build

echo "→ Restarting"
pm2 reload deploy/ecosystem.config.cjs --update-env
pm2 save

echo "✓ Deployed"
