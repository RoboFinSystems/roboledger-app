#!/bin/sh
set -eu

# ============================================================================
# Next.js Runtime Environment Configuration
# ============================================================================
# This entrypoint handles runtime injection of NEXT_PUBLIC_* environment
# variables into the pre-built Next.js application.
#
# Next.js bakes NEXT_PUBLIC_* variables into the JavaScript bundle at build
# time. To create a portable Docker image that can be configured at runtime,
# we build with placeholder values and replace them when the container starts.
#
# There are two types of builds:
# 1. ECR builds (production/staging): Built with actual URLs baked in.
#    The entrypoint just starts the server.
# 2. Docker Hub builds: Built with placeholder values that get replaced
#    at runtime based on environment variables.
# ============================================================================

echo "RoboLedger App - Starting..."

# ----------------------------------------------------------------------------
# Detect Build Type
# ----------------------------------------------------------------------------
# Check if this is a placeholder-based build by looking for placeholder
# strings in the built JavaScript files.
# ----------------------------------------------------------------------------
is_placeholder_build() {
    # Check if any JS file contains our placeholder pattern
    if grep -r "__PLACEHOLDER_ROBOSYSTEMS_API_URL__" /app/.next >/dev/null 2>&1; then
        return 0  # true - this is a placeholder build
    else
        return 1  # false - values are baked in
    fi
}

# ----------------------------------------------------------------------------
# Environment Variable Validation (only for placeholder builds)
# ----------------------------------------------------------------------------
validate_env_vars() {
    missing_vars=""

    # Required environment variables
    if [ -z "${NEXT_PUBLIC_ROBOSYSTEMS_API_URL:-}" ]; then
        missing_vars="$missing_vars NEXT_PUBLIC_ROBOSYSTEMS_API_URL"
    fi
    if [ -z "${NEXT_PUBLIC_ROBOSYSTEMS_APP_URL:-}" ]; then
        missing_vars="$missing_vars NEXT_PUBLIC_ROBOSYSTEMS_APP_URL"
    fi
    if [ -z "${NEXT_PUBLIC_ROBOLEDGER_APP_URL:-}" ]; then
        missing_vars="$missing_vars NEXT_PUBLIC_ROBOLEDGER_APP_URL"
    fi
    if [ -z "${NEXT_PUBLIC_ROBOINVESTOR_APP_URL:-}" ]; then
        missing_vars="$missing_vars NEXT_PUBLIC_ROBOINVESTOR_APP_URL"
    fi

    if [ -n "$missing_vars" ]; then
        echo "Error: Missing required environment variables:$missing_vars"
        echo ""
        echo "This Docker image requires runtime configuration."
        echo "Please set the following environment variables:"
        echo "  NEXT_PUBLIC_ROBOSYSTEMS_API_URL   - RoboSystems API endpoint"
        echo "  NEXT_PUBLIC_ROBOSYSTEMS_APP_URL   - RoboSystems App URL"
        echo "  NEXT_PUBLIC_ROBOLEDGER_APP_URL    - RoboLedger App URL"
        echo "  NEXT_PUBLIC_ROBOINVESTOR_APP_URL  - RoboInvestor App URL"
        echo ""
        echo "Optional variables:"
        echo "  NEXT_PUBLIC_MAINTENANCE_MODE      - Enable maintenance mode (default: false)"
        echo "  NEXT_PUBLIC_TURNSTILE_SITE_KEY    - Cloudflare Turnstile site key"
        echo "  NEXT_PUBLIC_S3_ENDPOINT_URL       - S3 endpoint URL (for LocalStack)"
        echo ""
        echo "Example:"
        echo "  docker run -e NEXT_PUBLIC_ROBOSYSTEMS_API_URL=http://localhost:8000 \\"
        echo "             -e NEXT_PUBLIC_ROBOSYSTEMS_APP_URL=http://localhost:3000 \\"
        echo "             -e NEXT_PUBLIC_ROBOLEDGER_APP_URL=http://localhost:3001 \\"
        echo "             -e NEXT_PUBLIC_ROBOINVESTOR_APP_URL=http://localhost:3002 \\"
        echo "             robofinsystems/roboledger-app"
        exit 1
    fi
}

# ----------------------------------------------------------------------------
# Runtime Environment Injection
# ----------------------------------------------------------------------------
# Replace placeholder values in the built JavaScript files with actual
# environment variable values.
# ----------------------------------------------------------------------------
inject_runtime_env() {
    echo "Injecting runtime environment configuration..."

    # Find all JS files in .next and replace placeholders
    # Using find + sed for POSIX compatibility (Alpine doesn't have GNU tools by default)
    if ! find /app/.next -type f \( -name "*.js" -o -name "*.json" \) -exec sed -i \
        -e "s|__PLACEHOLDER_ROBOSYSTEMS_API_URL__|${NEXT_PUBLIC_ROBOSYSTEMS_API_URL}|g" \
        -e "s|__PLACEHOLDER_ROBOSYSTEMS_APP_URL__|${NEXT_PUBLIC_ROBOSYSTEMS_APP_URL}|g" \
        -e "s|__PLACEHOLDER_ROBOLEDGER_APP_URL__|${NEXT_PUBLIC_ROBOLEDGER_APP_URL}|g" \
        -e "s|__PLACEHOLDER_ROBOINVESTOR_APP_URL__|${NEXT_PUBLIC_ROBOINVESTOR_APP_URL}|g" \
        -e "s|__PLACEHOLDER_MAINTENANCE_MODE__|${NEXT_PUBLIC_MAINTENANCE_MODE:-false}|g" \
        -e "s|__PLACEHOLDER_TURNSTILE_SITE_KEY__|${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}|g" \
        -e "s|__PLACEHOLDER_S3_ENDPOINT_URL__|${NEXT_PUBLIC_S3_ENDPOINT_URL:-}|g" \
        {} \; ; then
        echo "Error: Failed to inject runtime configuration"
        exit 1
    fi

    # Verify at least one placeholder was replaced (sanity check)
    if grep -r "__PLACEHOLDER_ROBOSYSTEMS_API_URL__" /app/.next >/dev/null 2>&1; then
        echo "Error: Placeholder replacement failed - API URL placeholder still present"
        exit 1
    fi

    echo "Runtime environment configuration complete."
}

# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
if is_placeholder_build; then
    echo "Detected placeholder-based build (Docker Hub image)"
    validate_env_vars
    inject_runtime_env
else
    echo "Detected pre-configured build (ECR image)"
    echo "Environment values are baked into the build."
fi

echo "Starting Next.js server on port ${PORT:-3000}..."
exec npm start
