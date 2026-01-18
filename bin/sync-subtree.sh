#!/bin/bash

# RoboSystems Common Components - Git Subtree Helper Script
# This script helps manage the common components across multiple apps

set -e

COMMON_REPO="https://github.com/RoboFinSystems/robosystems-core.git"
COMMON_PREFIX="src/lib/core"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo -e "${BLUE}RoboSystems Common Components - Git Subtree Manager${NC}"
    echo ""
    echo "Usage: $0 {pull|push|add} [options]"
    echo ""
    echo "Commands:"
    echo "  add   - Add robosystems-common as subtree (first time setup)"
    echo "  pull  - Pull latest changes from robosystems-common"
    echo "  push  - Push local changes to robosystems-common"
    echo ""
    echo "Options:"
    echo "  --repo URL    - Override repository URL"
    echo "  --prefix PATH - Override subtree prefix (default: src/lib/common)"
    echo "  --help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 add                    # First time setup"
    echo "  $0 pull                   # Get latest updates"
    echo "  $0 push                   # Push your changes"
    echo ""
}

# Parse arguments
COMMAND=""
while [[ $# -gt 0 ]]; do
    case $1 in
        add|pull|push)
            COMMAND="$1"
            shift
            ;;
        --repo)
            COMMON_REPO="$2"
            shift 2
            ;;
        --prefix)
            COMMON_PREFIX="$2"
            shift 2
            ;;
        --help|-h)
            print_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

if [[ -z "$COMMAND" ]]; then
    echo -e "${RED}Error: Command required${NC}"
    print_usage
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

case "$COMMAND" in
    "add")
        echo -e "${BLUE}➕ Adding robosystems-core as subtree...${NC}"
        echo -e "${YELLOW}Repository: $COMMON_REPO${NC}"
        echo -e "${YELLOW}Prefix: $COMMON_PREFIX${NC}"

        if [[ -d "$COMMON_PREFIX" ]]; then
            echo -e "${RED}Error: Directory $COMMON_PREFIX already exists${NC}"
            echo "Use 'pull' to update existing subtree or remove the directory first"
            exit 1
        fi

        git subtree add --prefix="$COMMON_PREFIX" "$COMMON_REPO" main --squash

        echo -e "${GREEN}✅ Subtree added successfully${NC}"
        echo "You can now import components from '@/lib/core'"
        ;;

    "pull")
        echo -e "${BLUE}🔄 Pulling latest changes from robosystems-core...${NC}"
        echo -e "${YELLOW}Repository: $COMMON_REPO${NC}"
        echo -e "${YELLOW}Prefix: $COMMON_PREFIX${NC}"

        if [[ ! -d "$COMMON_PREFIX" ]]; then
            echo -e "${RED}Error: Subtree directory $COMMON_PREFIX does not exist${NC}"
            echo "Use 'add' command first to set up the subtree"
            exit 1
        fi

        git subtree pull --prefix="$COMMON_PREFIX" "$COMMON_REPO" main --squash

        echo -e "${GREEN}✅ Latest changes pulled successfully${NC}"
        echo "Run your tests to ensure compatibility"
        ;;

    "push")
        echo -e "${BLUE}🚀 Pushing changes to robosystems-core...${NC}"
        echo -e "${YELLOW}Repository: $COMMON_REPO${NC}"
        echo -e "${YELLOW}Prefix: $COMMON_PREFIX${NC}"

        if [[ ! -d "$COMMON_PREFIX" ]]; then
            echo -e "${RED}Error: Subtree directory $COMMON_PREFIX does not exist${NC}"
            echo "Use 'add' command first to set up the subtree"
            exit 1
        fi

        # Check for uncommitted changes
        UNCOMMITTED_CHANGES=false
        if ! git diff --quiet HEAD -- "$COMMON_PREFIX"; then
            UNCOMMITTED_CHANGES=true
            echo -e "${YELLOW}⚠️  Uncommitted changes detected in $COMMON_PREFIX${NC}"
            echo "Please commit your changes first before pushing to subtree"
            exit 1
        fi

        # Find the last subtree merge commit for this prefix
        LAST_SUBTREE_COMMIT=$(git log --grep="git-subtree-dir: $COMMON_PREFIX" --format="%H" -1 2>/dev/null || echo "")

        # Check for committed changes since last subtree operation
        COMMITTED_CHANGES=false
        if [[ -n "$LAST_SUBTREE_COMMIT" ]]; then
            # Check if there are commits affecting the subtree since the last merge
            if git log --oneline "$LAST_SUBTREE_COMMIT..HEAD" -- "$COMMON_PREFIX" | grep -q .; then
                COMMITTED_CHANGES=true
                echo -e "${YELLOW}📝 Committed changes detected since last subtree sync:${NC}"
                git log --oneline "$LAST_SUBTREE_COMMIT..HEAD" -- "$COMMON_PREFIX" | sed 's/^/  /'
            fi
        else
            # No previous subtree commits found, check if there are any commits affecting the directory
            if git log --oneline -- "$COMMON_PREFIX" | grep -q .; then
                COMMITTED_CHANGES=true
                echo -e "${YELLOW}📝 Commits detected in $COMMON_PREFIX (no previous subtree sync found):${NC}"
                git log --oneline -5 -- "$COMMON_PREFIX" | sed 's/^/  /'
            fi
        fi

        if [[ "$COMMITTED_CHANGES" == true ]]; then
            echo -e "${BLUE}🚀 Pushing changes to subtree repository...${NC}"
            git subtree push --prefix="$COMMON_PREFIX" "$COMMON_REPO" main
            echo -e "${GREEN}✅ Changes pushed successfully${NC}"
        else
            echo -e "${GREEN}✅ No new changes to push${NC}"
            echo "The subtree is already up to date"
        fi
        ;;
esac

echo ""
echo -e "${BLUE}Next steps:${NC}"
case "$COMMAND" in
    "add"|"pull")
        echo "1. Run tests: npm run test"
        echo "2. Check types: npm run typecheck"
        echo "3. Test your app functionality"
        ;;
    "push")
        echo "1. Update other apps: cd ../other-app && ./scripts/sync-subtree.sh pull"
        echo "2. Test in other apps to ensure compatibility"
        ;;
esac
