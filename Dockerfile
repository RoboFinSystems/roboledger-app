# syntax=docker/dockerfile:1

# --- Build Stage ---
FROM public.ecr.aws/docker/library/node:24.19.0-alpine3.24 AS builder
WORKDIR /app

# Install git for private repository access
RUN apk add --no-cache git

# Upgrade the bundled npm CLI to clear CVEs in npm's vendored deps
# (picomatch, brace-expansion, tar, minimatch) — build-time only
RUN npm install -g npm@latest

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

# Install only production dependencies. This is the authoritative runtime
# node_modules — we deliberately do NOT copy node_modules from the builder,
# so devDependencies (jsdom, vitest, eslint, ...) stay out of the scanned
# runtime image and don't drag in their CVEs (e.g. jsdom's transitive undici).
COPY package.json package-lock.json ./
# npm is needed only to install the runtime node_modules — remove it afterwards.
# The entrypoint starts `next` directly, and npm's vendored deps (brace-expansion,
# tar) carry known CVEs faster than npm ships fixes; deleting the CLI keeps them
# out of the scanned image entirely.
# Nested lockfiles shipped inside package tarballs (demo/playground dirs) are
# never read at runtime, but container scanners parse them as installed
# dependencies and flag phantom CVEs.
RUN npm ci --omit=dev && \
  rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx && \
  find node_modules -mindepth 2 -name package-lock.json -delete

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

