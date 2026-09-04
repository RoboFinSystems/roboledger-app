# syntax=docker/dockerfile:1

# Multi-arch note: the Docker Hub image is built for linux/amd64 and linux/arm64
# on one x86 runner. Every stage that runs Node is pinned to the build platform
# (--platform=$BUILDPLATFORM) so nothing executes under QEMU emulation: an
# emulated `npm ci` crashed intermittently with SIGILL and then hung the build
# for the full retry window. Only the runtime stage is the target platform, and
# it never runs Node at build time.

# --- Build Stage ---
FROM --platform=$BUILDPLATFORM public.ecr.aws/docker/library/node:24.19.0-alpine3.24 AS builder
WORKDIR /app

# Install git for private repository access
RUN apk add --no-cache git

# Upgrade the bundled npm CLI to clear CVEs in npm's vendored deps
# (picomatch, brace-expansion, tar, minimatch) — build-time only
# Pinned: the node image bundles npm 11.17.0 but `npm@latest` silently crossed into
# npm 12 on 2026-07-08, so image builds have been changing major versions unattended.
RUN npm install -g npm@12.0.2

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the app
COPY . .

# If we have a pre-built .next directory from the workflow, use it
# Otherwise, build it in the container (for local development)
RUN if [ -f next-build.tar.gz ]; then \
  tar -xzf next-build.tar.gz; \
  else \
  npm run build; \
  fi

# --- Runtime Dependencies Stage ---
# Production node_modules for the TARGET platform, resolved on the build
# platform: npm's cpu/os/libc flags select the target's optional native packages
# (@next/swc-*, @img/sharp-*, ...) without executing any of them. Nothing in
# this lockfile has an install script that runs on Linux (only fsevents, which is
# macOS-only), so the cross-install is exact.
# This is the authoritative runtime node_modules — we deliberately do NOT copy
# node_modules from the builder, so devDependencies (jsdom, vitest, eslint, ...)
# stay out of the scanned runtime image and don't drag in their CVEs.
# Nested lockfiles shipped inside package tarballs (demo/playground dirs) are
# never read at runtime, but container scanners parse them as installed
# dependencies and flag phantom CVEs.
FROM --platform=$BUILDPLATFORM public.ecr.aws/docker/library/node:24.19.0-alpine3.24 AS deps
ARG TARGETARCH
WORKDIR /app
RUN npm install -g npm@12.0.2
COPY package.json package-lock.json ./
RUN case "$TARGETARCH" in \
    amd64) NPM_CPU=x64 ;; \
    arm64) NPM_CPU=arm64 ;; \
    *) echo "unsupported TARGETARCH: $TARGETARCH" && exit 1 ;; \
  esac && \
  npm ci --omit=dev --cpu="$NPM_CPU" --os=linux --libc=musl && \
  find node_modules -mindepth 2 -name package-lock.json -delete

# --- Production Stage ---
FROM public.ecr.aws/docker/library/node:24.19.0-alpine3.24 AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install git and upgrade system packages for security patches.
# CACHE_DATE (set per-build in build.yml) busts this layer so the upgrade
# re-runs despite GHA layer caching — a cached layer keeps stale OS packages.
ARG CACHE_DATE
RUN echo "os-refresh ${CACHE_DATE}" && apk upgrade --no-cache && apk add --no-cache git

# Create non-root user before copying files (enables --chown)
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

# npm never runs in this stage: the runtime node_modules are copied in from the
# deps stage below. The entrypoint starts `next` directly, and npm's vendored
# deps (brace-expansion, tar) carry known CVEs faster than npm ships fixes;
# deleting the CLI keeps them out of the scanned image entirely.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Production node_modules for this platform (see the deps stage). The lockfile
# rides along so container scanners keep resolving the same dependency set.
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/node_modules ./node_modules

# Copy built app from builder with proper ownership
COPY --from=builder --chown=appuser:appgroup /app/.next ./.next
COPY --from=builder --chown=appuser:appgroup /app/.flowbite-react ./.flowbite-react
COPY --from=builder --chown=appuser:appgroup /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/next.config.js ./next.config.js
COPY --from=builder /app/package.json ./package.json

# Copy entrypoint script and set permissions
COPY --chown=appuser:appgroup bin/entrypoint.sh /app/bin/entrypoint.sh
RUN chmod +x /app/bin/entrypoint.sh

# Create cache directory with proper ownership
RUN mkdir -p /app/.next/cache/images && chown -R appuser:appgroup /app/.next/cache

USER appuser

EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["/app/bin/entrypoint.sh"]

