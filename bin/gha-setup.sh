#!/bin/bash
# =============================================================================
# ROBOLEDGER APP GITHUB REPOSITORY SETUP SCRIPT
# =============================================================================
#
# This script configures GitHub repository variables used by CI/CD pipelines
# for the RoboLedger App frontend (App Runner + CloudFront deployment).
#
# Usage:
#   npm run setup:gha
#   or directly: ./bin/gha-setup.sh
#
# Prerequisites:
#   - GitHub CLI installed and authenticated
#   - Run ./bin/bootstrap.sh first (sets AWS_ROLE_ARN for OIDC)
#
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_error() { echo -e "${RED}❌ $1${NC}" >&2; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo "=== RoboLedger App GitHub Variables Setup ==="
echo ""

# =============================================================================
# PREREQUISITES
# =============================================================================

check_prerequisites() {
    print_info "Checking prerequisites..."

    if ! command -v gh >/dev/null 2>&1; then
        print_error "GitHub CLI not installed. Visit: https://cli.github.com/"
        exit 1
    fi

    if ! gh auth status >/dev/null 2>&1; then
        print_error "GitHub CLI not authenticated. Run: gh auth login"
        exit 1
    fi

    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi

    REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
    if [ -z "$REPO_NAME" ]; then
        print_error "Could not determine repository name"
        exit 1
    fi

    # Check if bootstrap was run (AWS_ROLE_ARN should exist)
    if ! gh variable get AWS_ROLE_ARN >/dev/null 2>&1; then
        print_warning "AWS_ROLE_ARN not set - run ./bin/bootstrap.sh first"
    fi

    print_success "Prerequisites check passed"
    print_info "Repository: $REPO_NAME"
    echo ""
}

# =============================================================================
# SETUP CONFIGURATION
# =============================================================================

setup_config() {
    echo "This sets GitHub variables for App Runner + CloudFront deployment."
    echo "Most variables have sensible defaults - only domain and AWS account are required."
    echo ""

    # Check for existing values
    EXISTING_ACCOUNT=$(gh variable get AWS_ACCOUNT_ID 2>/dev/null || echo "")
    EXISTING_DOMAIN=$(gh variable get DOMAIN_NAME_ROOT 2>/dev/null || echo "")

    echo "📋 Required Configuration:"
    echo ""

    # AWS Account ID
    if [ -n "$EXISTING_ACCOUNT" ]; then
        echo "  AWS Account ID: $EXISTING_ACCOUNT (existing)"
        read -p "  Press Enter to keep, or enter new value: " AWS_ACCOUNT_ID
        AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$EXISTING_ACCOUNT}
    else
        read -p "  AWS Account ID: " AWS_ACCOUNT_ID
    fi

    # Domain
    if [ -n "$EXISTING_DOMAIN" ]; then
        echo "  Domain: $EXISTING_DOMAIN (existing)"
        read -p "  Press Enter to keep, or enter new value: " DOMAIN_NAME
        DOMAIN_NAME=${DOMAIN_NAME:-$EXISTING_DOMAIN}
    else
        read -p "  Domain Name (e.g., roboledger.ai): " DOMAIN_NAME
    fi

    echo ""
    echo "🔧 Optional Configuration (press Enter for defaults):"
    echo ""

    read -p "  AWS Region [us-east-1]: " AWS_REGION
    AWS_REGION=${AWS_REGION:-"us-east-1"}

    read -p "  ECR Repository [roboledger-app]: " ECR_REPOSITORY
    ECR_REPOSITORY=${ECR_REPOSITORY:-"roboledger-app"}

    read -p "  Enable staging environment? (y/N): " -n 1 -r
    echo ""
    STAGING_ENABLED="false"
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        STAGING_ENABLED="true"
    fi

    echo ""
    echo "🌐 Related App URLs (for SSO navigation):"
    echo ""

    read -p "  RoboSystems API URL [https://api.robosystems.ai]: " API_URL
    API_URL=${API_URL:-"https://api.robosystems.ai"}

    read -p "  RoboSystems App URL [https://robosystems.ai]: " ROBOSYSTEMS_URL
    ROBOSYSTEMS_URL=${ROBOSYSTEMS_URL:-"https://robosystems.ai"}

    read -p "  RoboInvestor App URL [https://roboinvestor.ai]: " ROBOINVESTOR_URL
    ROBOINVESTOR_URL=${ROBOINVESTOR_URL:-"https://roboinvestor.ai"}

    echo ""
    echo "Setting variables..."
    echo ""

    # -------------------------------------------------------------------------
    # Core Infrastructure
    # -------------------------------------------------------------------------
    gh variable set AWS_ACCOUNT_ID --body "$AWS_ACCOUNT_ID"
    gh variable set AWS_REGION --body "$AWS_REGION"
    gh variable set ECR_REPOSITORY --body "$ECR_REPOSITORY"
    print_success "Core infrastructure variables set"

    # -------------------------------------------------------------------------
    # Environment Configuration
    # -------------------------------------------------------------------------
    gh variable set ENVIRONMENT_STAGING_ENABLED --body "$STAGING_ENABLED"
    print_success "Environment configuration set"

    # -------------------------------------------------------------------------
    # Domain Configuration
    # -------------------------------------------------------------------------
    gh variable set DOMAIN_NAME_ROOT --body "$DOMAIN_NAME"
    gh variable set DOMAIN_NAME_PROD --body "$DOMAIN_NAME"
    gh variable set DOMAIN_NAME_STAGING --body "staging.$DOMAIN_NAME"
    print_success "Domain configuration set"

    # -------------------------------------------------------------------------
    # App URLs (build-time environment variables)
    # -------------------------------------------------------------------------
    gh variable set ROBOSYSTEMS_API_URL_PROD --body "$API_URL"
    gh variable set ROBOSYSTEMS_API_URL_STAGING --body "https://staging.api.robosystems.ai"
    gh variable set ROBOSYSTEMS_APP_URL_PROD --body "$ROBOSYSTEMS_URL"
    gh variable set ROBOSYSTEMS_APP_URL_STAGING --body "https://staging.robosystems.ai"
    gh variable set ROBOLEDGER_APP_URL_PROD --body "https://$DOMAIN_NAME"
    gh variable set ROBOLEDGER_APP_URL_STAGING --body "https://staging.$DOMAIN_NAME"
    gh variable set ROBOINVESTOR_APP_URL_PROD --body "$ROBOINVESTOR_URL"
    gh variable set ROBOINVESTOR_APP_URL_STAGING --body "https://staging.roboinvestor.ai"
    print_success "App URLs set"

    # -------------------------------------------------------------------------
    # App Runner Configuration (sensible defaults)
    # -------------------------------------------------------------------------
    # CPU/Memory: App Runner format - "0.25 vCPU", "0.5 GB", etc.
    gh variable set CPU_PROD --body "0.25 vCPU"
    gh variable set CPU_STAGING --body "0.25 vCPU"
    gh variable set MEMORY_PROD --body "0.5 GB"
    gh variable set MEMORY_STAGING --body "0.5 GB"

    # Auto-scaling
    gh variable set CAPACITY_MIN_PROD --body "1"
    gh variable set CAPACITY_MIN_STAGING --body "1"
    gh variable set CAPACITY_MAX_PROD --body "10"
    gh variable set CAPACITY_MAX_STAGING --body "2"
    gh variable set MAX_CONCURRENCY_PROD --body "100"
    gh variable set MAX_CONCURRENCY_STAGING --body "100"
    print_success "App Runner configuration set"

    # -------------------------------------------------------------------------
    # Access Mode (always public for frontend apps)
    # -------------------------------------------------------------------------
    gh variable set APP_ACCESS_MODE_PROD --body "public"
    gh variable set APP_ACCESS_MODE_STAGING --body "public"
    print_success "Access mode set"

    # -------------------------------------------------------------------------
    # Feature Flags
    # -------------------------------------------------------------------------
    gh variable set MAINTENANCE_MODE_PROD --body "false"
    gh variable set MAINTENANCE_MODE_STAGING --body "false"
    print_success "Feature flags set"

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""
    print_success "Configuration complete!"
    echo ""
    echo "📋 Summary:"
    echo "  🌐 Domain: $DOMAIN_NAME"
    echo "  🔑 AWS Account: $AWS_ACCOUNT_ID"
    echo "  📍 Region: $AWS_REGION"
    echo "  🐳 ECR: $ECR_REPOSITORY"
    echo "  🔧 Staging: $STAGING_ENABLED"
    echo ""
    echo "📋 Optional secrets (not required for deployment):"
    echo "  gh secret set ACTIONS_TOKEN      # Protected branches, releases"
    echo "  gh secret set ANTHROPIC_API_KEY  # AI-powered release notes"
    echo ""
    echo "📋 Optional variables:"
    echo "  gh variable set TURNSTILE_SITE_KEY --body \"your_key\"  # CAPTCHA"
    echo "  gh variable set AWS_SNS_ALERT_EMAIL --body \"email\"    # Alerts"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Verify: gh variable list"
    echo "  2. Deploy: gh workflow run prod.yml"
    echo ""
}

# =============================================================================
# CLEANUP LEGACY VARIABLES
# =============================================================================

cleanup_legacy() {
    echo ""
    print_info "Checking for legacy ECS variables..."

    LEGACY_VARS=(
        "FARGATE_SPOT_WEIGHT_PROD"
        "FARGATE_SPOT_WEIGHT_STAGING"
        "FARGATE_WEIGHT_PROD"
        "FARGATE_WEIGHT_STAGING"
        "FARGATE_BASE_PROD"
        "FARGATE_BASE_STAGING"
        "SCALE_UP_CPU_THRESHOLD_PROD"
        "SCALE_UP_CPU_THRESHOLD_STAGING"
        "SCALE_DOWN_CPU_THRESHOLD_PROD"
        "SCALE_DOWN_CPU_THRESHOLD_STAGING"
        "SCALE_UP_MEMORY_THRESHOLD_PROD"
        "SCALE_UP_MEMORY_THRESHOLD_STAGING"
        "SCALE_DOWN_MEMORY_THRESHOLD_PROD"
        "SCALE_DOWN_MEMORY_THRESHOLD_STAGING"
        "RELEASE_NAME"
        "RELEASE_EMAIL"
        "REPOSITORY_NAME"
    )

    found_legacy=false
    for var in "${LEGACY_VARS[@]}"; do
        if gh variable get "$var" >/dev/null 2>&1; then
            if ! $found_legacy; then
                echo ""
                print_warning "Found legacy ECS variables (no longer used with App Runner):"
                found_legacy=true
            fi
            echo "  - $var"
        fi
    done

    if $found_legacy; then
        echo ""
        read -p "Delete legacy variables? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for var in "${LEGACY_VARS[@]}"; do
                if gh variable delete "$var" 2>/dev/null; then
                    print_success "Deleted $var"
                fi
            done
        else
            print_info "Keeping legacy variables (they won't affect deployment)"
        fi
    else
        print_success "No legacy variables found"
    fi
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    check_prerequisites
    setup_config
    cleanup_legacy
}

main "$@"
