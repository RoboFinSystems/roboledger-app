#!/bin/bash
# =============================================================================
# NGROK TUNNEL
# =============================================================================
#
# Exposes the local dev server (port 3001) at a public HTTPS URL so OAuth
# providers like QuickBooks can redirect back to localhost.
#
# PREREQUISITES:
#   1. Install ngrok: brew install ngrok
#   2. Authenticate: ngrok config add-authtoken <your-token>
#      (get a token at https://dashboard.ngrok.com/get-started/your-authtoken)
#   3. Reserve a static domain (free tier includes one):
#      https://dashboard.ngrok.com/domains
#   4. Set NGROK_DOMAIN in .env to that domain
#   5. In robosystems/.env, set EXTRA_CORS_ORIGINS=https://<your-domain>
#   6. Add the same hostname to NEXT_ALLOWED_DEV_ORIGINS in this repo's .env
#
# USAGE:
#   npm run tunnel:ngrok                  # forwards to port 3001 (default)
#   npm run tunnel:ngrok -- 3002          # forwards to a different port
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

PORT="${1:-3001}"

if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$REPO_ROOT/.env"
  set +a
fi

if [ -z "${NGROK_DOMAIN:-}" ]; then
  echo "Error: NGROK_DOMAIN not set."
  echo ""
  echo "Set it in $REPO_ROOT/.env. Reserve a free static domain at:"
  echo "  https://dashboard.ngrok.com/domains"
  exit 1
fi

if ! command -v ngrok >/dev/null 2>&1; then
  echo "Error: ngrok not installed. Install with: brew install ngrok"
  exit 1
fi

exec ngrok http --url="https://${NGROK_DOMAIN}" "$PORT"
