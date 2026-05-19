#!/bin/bash
# =============================================================================
# CLOUDFLARED TUNNEL
# =============================================================================
#
# Exposes the local dev server (port 3001) at a public HTTPS URL on a
# Cloudflare-managed domain. Alternative to ngrok — no interstitial warning
# and uses your own branded domain.
#
# PREREQUISITES:
#   1. Install cloudflared: brew install cloudflared
#   2. Authenticate: cloudflared tunnel login
#      (opens a browser; pick the zone you'll route the tunnel under)
#   3. Create a named tunnel + DNS route (one-time):
#        cloudflared tunnel create roboledger-local
#        cloudflared tunnel route dns roboledger-local qb.your-domain.com
#   4. Set CLOUDFLARED_TUNNEL_NAME + PUBLIC_TUNNEL_DOMAIN in .env:
#        CLOUDFLARED_TUNNEL_NAME=roboledger-local
#        PUBLIC_TUNNEL_DOMAIN=qb.your-domain.com
#   5. In robosystems/.env, add to EXTRA_CORS_ORIGINS:
#        EXTRA_CORS_ORIGINS=https://qb.your-domain.com
#
# USAGE:
#   npm run tunnel:cloudflared            # forwards to port 3001 (default)
#   npm run tunnel:cloudflared -- 3002    # forwards to a different port
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

if [ -z "${CLOUDFLARED_TUNNEL_NAME:-}" ]; then
  echo "Error: CLOUDFLARED_TUNNEL_NAME not set."
  echo ""
  echo "Set it in $REPO_ROOT/.env to the name of a tunnel you've created:"
  echo "  cloudflared tunnel create roboledger-local"
  echo "  cloudflared tunnel route dns roboledger-local qb.your-domain.com"
  echo "  echo 'CLOUDFLARED_TUNNEL_NAME=roboledger-local' >> .env"
  echo "  echo 'PUBLIC_TUNNEL_DOMAIN=qb.your-domain.com' >> .env"
  exit 1
fi

# next.config.js reads PUBLIC_TUNNEL_DOMAIN to wire the dev-server API proxy
# and rewrite NEXT_PUBLIC_ROBOSYSTEMS_API_URL. Without it the tunnel will
# carry traffic but the frontend will still call http://localhost:8000 from
# the browser and trip Chrome's Private Network Access guard.
if [ -z "${PUBLIC_TUNNEL_DOMAIN:-}" ]; then
  echo "Error: PUBLIC_TUNNEL_DOMAIN not set."
  echo ""
  echo "Set it in $REPO_ROOT/.env to the hostname routed to this tunnel"
  echo "(the same hostname you passed to 'cloudflared tunnel route dns')."
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Error: cloudflared not installed. See https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ (macOS: brew install cloudflared)"
  exit 1
fi

# Warn if nothing is listening on the target port. Non-fatal — the dev
# server may start after the tunnel — but most "tunnel up, nothing
# serving" confusion lands here.
if command -v nc >/dev/null 2>&1 && ! nc -z localhost "$PORT" 2>/dev/null; then
  echo "Warning: nothing listening on port $PORT. Start the dev server first (e.g., 'npm run dev')."
fi

exec cloudflared tunnel --url "http://localhost:${PORT}" run "${CLOUDFLARED_TUNNEL_NAME}"
