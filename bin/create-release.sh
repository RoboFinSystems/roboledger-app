#!/bin/bash
set -e

# Create release script using GitHub Actions
# Creates a new release branch via GHA workflow and checks it out locally
# Usage: ./bin/create-release.sh [major|minor|patch] [staging|prod|none]

# Default to patch if no argument provided
VERSION_TYPE=${1:-patch}
DEPLOY_TO=${2:-staging}

# Validate the version type
if [[ "$VERSION_TYPE" != "major" && "$VERSION_TYPE" != "minor" && "$VERSION_TYPE" != "patch" ]]; then
  echo "Invalid version type: $VERSION_TYPE. Use major, minor, or patch."
  exit 1
fi

# Validate the deployment target
if [[ "$DEPLOY_TO" != "staging" && "$DEPLOY_TO" != "prod" && "$DEPLOY_TO" != "all" && "$DEPLOY_TO" != "none" ]]; then
  echo "Invalid deployment target: $DEPLOY_TO. Use staging, prod, all, or none."
  exit 1
fi

echo "🚀 Triggering GitHub Actions workflow to create release..."
echo "   Version type: $VERSION_TYPE"
echo "   Deploy to: $DEPLOY_TO"

gh workflow run create-release.yml \
  --field version_type=$VERSION_TYPE \
  --field deploy_to=$DEPLOY_TO

echo "⏳ Waiting for workflow to create the release branch..."

# Get current version to calculate new branch name
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Calculate new version based on type
if [ "$VERSION_TYPE" = "major" ]; then
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
elif [ "$VERSION_TYPE" = "minor" ]; then
    MINOR=$((MINOR + 1))
    PATCH=0
else # patch
    PATCH=$((PATCH + 1))
fi

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
BRANCH_NAME="release/$NEW_VERSION"

echo "Expected new branch: $BRANCH_NAME"

# Wait for the branch to be created (check every 10 seconds for up to 3 minutes)
MAX_ATTEMPTS=18
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: Checking if branch exists..."
    
    # Fetch latest changes from remote
    git fetch origin
    
    # Check if the branch exists on remote
    if git show-ref --verify --quiet refs/remotes/origin/$BRANCH_NAME; then
        echo "✅ Branch $BRANCH_NAME found! Checking it out..."
        git checkout $BRANCH_NAME
        git pull origin $BRANCH_NAME
        echo "📦 Installing dependencies..."
        npm install
        echo "🎉 Successfully checked out $BRANCH_NAME"
        
        if [ "$DEPLOY_TO" != "none" ]; then
            echo "📦 Deployment to $DEPLOY_TO has been triggered"
        fi
        
        exit 0
    fi
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo "❌ Timeout: Branch $BRANCH_NAME was not created after 3 minutes"
        echo "Check the GitHub Actions workflow status: gh run list --workflow=create-release.yml"
        exit 1
    fi
    
    echo "Branch not yet available, waiting 10 seconds..."
    sleep 10
    ATTEMPT=$((ATTEMPT + 1))
done