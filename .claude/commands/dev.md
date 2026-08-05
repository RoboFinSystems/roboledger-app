---
description: Start the frontend development server and verify it's serving against the API.
---

Start the Next.js development server for this app.

## Prerequisites

- **Node 24+** (`engines` in `package.json`; `.nvmrc` pins the version).
- **Dependencies installed** — `test -d node_modules || npm install`.
- **An `.env`** — copy `.env.example` if it's missing. The one value that matters for a working app is `NEXT_PUBLIC_ROBOSYSTEMS_API_URL` (default `http://localhost:8000`).
- **The backend API running.** This app is a client; without the API, pages render but every authenticated route fails. Start it with `/dev` in the `robosystems` repo (Docker stack, API on `:8000`). Point at a deployed API instead by setting `NEXT_PUBLIC_ROBOSYSTEMS_API_URL` — but note `NEXT_PUBLIC_*` is read at build/start, so changing it needs a server restart, not just a page reload.

## Start

```bash
npm run dev
```

Serves on **http://localhost:3001** (the port is pinned in the script, not left to Next's fallback scan — a stale process on 3001 makes the start fail rather than silently move to 3003). 3001 is not incidental: the sibling apps and the SSO cross-navigation URLs assume RoboLedger is there.

Run it as a **background** command rather than appending `&` — a foreground dev server blocks until killed. Then wait for the "Ready" line before hitting the app.

Next 16 uses **Turbopack** for `next dev`. If you hit a bundler-specific failure (a plugin or loader that hasn't caught up), fall back with:

```bash
npm run dev:webpack
```

That's a diagnostic, not a default — if webpack fixes it, the bug is worth reporting rather than working around permanently.

## Verify

```bash
curl -sf http://localhost:3001/api/utilities/health && echo OK
```

This is the same endpoint the deploy pipeline health-checks. It reports that the Next server is up — it does **not** check the RoboSystems API. Confirm that separately:

```bash
curl -sf http://localhost:8000/v1/status && echo API OK
```

## Related services

| Service          | Port | Notes                                       |
| ---------------- | ---- | ------------------------------------------- |
| roboledger-app   | 3001 | this app                                    |
| robosystems-app  | 3000 | sibling frontend, SSO cross-navigation      |
| roboinvestor-app | 3002 | sibling frontend, SSO cross-navigation      |
| RoboSystems API  | 8000 | started by `/dev` in the `robosystems` repo |

The `NEXT_PUBLIC_ROBO*_APP_URL` variables drive cross-app links; a link that 404s locally usually means the sibling app just isn't running, not that the link is wrong.

Alternatively the backend repo can run this app in Docker under its `apps` profile (`roboledger-app` container, same port 3001) — useful for testing the container image, but slower to iterate than `npm run dev` and it will collide on port 3001 with a local dev server.

## OAuth callbacks need a public URL

QuickBooks (and any other OAuth provider) has to redirect back to a public HTTPS URL — it cannot reach `localhost`. For connection flows, expose the dev server through a tunnel:

```bash
npm run tunnel:ngrok          # or: npm run tunnel:cloudflared
```

Both point at port 3001. The tunnel is only needed for the OAuth round trip; everything else works fine on plain localhost. Note the provider's redirect URI must match the tunnel URL, so an ngrok URL that rotates between sessions means re-registering it — cloudflared is steadier if you're iterating on the connection flow.

## When it doesn't come up

- **Port 3001 in use** → find and stop the stale process (`lsof -ti:3001`); don't just move ports, since the Turnstile, OAuth redirect, and SSO URLs assume 3001.
- **Module not found after a `@robosystems/core` or `@robosystems/client` bump** → `npm install`, and check `vitest.config.ts` aliases if it's only tests that break.
- **CAPTCHA blocking a form** → `.env.example` documents Cloudflare's test keys; `1x00000000000000000000AA` always passes, or leave `NEXT_PUBLIC_TURNSTILE_SITE_KEY` empty to disable.
- **Auth loops or 401s on every page** → the API isn't running, or `NEXT_PUBLIC_ROBOSYSTEMS_API_URL` points somewhere else. Check it before debugging the app.
- **Styles missing for a shared component** → `@robosystems/core` must be in the Tailwind `content` globs (`node_modules/@robosystems/core/**/*.js`); a rework of `tailwind.config.ts` that drops it silently unstyles core components.
