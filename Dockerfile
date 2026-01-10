# syntax=docker/dockerfile:1

# --- Build Stage ---
FROM public.ecr.aws/docker/library/node:22.21.1-alpine AS builder
WORKDIR /app

# Install git for private repository access
RUN apk add --no-cache git

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
FROM public.ecr.aws/docker/library/node:22.21.1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install git for private repository access
RUN apk add --no-cache git

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/.flowbite-react ./.flowbite-react
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Use non-root user for security
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
RUN mkdir -p /app/.next/cache/images
RUN chown -R appuser:appgroup /app/.next
RUN chown -R appuser:appgroup /app/.flowbite-react
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
