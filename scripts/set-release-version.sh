#!/bin/bash
set -e

# Get current git reference (branch, tag, or commit)
if [ -n "$GITHUB_REF" ]; then
    # Running in GitHub Actions
    REF="$GITHUB_REF"
elif [ -n "$1" ]; then
    # Manual override passed as argument
    REF="$1"
else
    # Local development - get current branch
    REF="refs/heads/$(git rev-parse --abbrev-ref HEAD)"
fi

echo "Git reference: $REF"

# Determine version based on ref type
if [[ "$REF" == refs/tags/* ]]; then
    # Tag: use tag name as version (e.g., refs/tags/v1.2.3 -> v1-2-3)
    VERSION=$(echo "$REF" | sed 's|refs/tags/||' | sed 's/\./-/g')
    echo "Tag detected: $VERSION"
elif [[ "$REF" == refs/heads/release/* ]]; then
    # Release branch: use branch name (e.g., refs/heads/release/v1.2 -> release-v1-2)
    VERSION=$(echo "$REF" | sed 's|refs/heads/||' | sed 's|/|-|g' | sed 's/\./-/g')
    echo "Release branch detected: $VERSION"
elif [[ "$REF" == refs/heads/feature/* ]]; then
    # Feature branch: use feature name (e.g., refs/heads/feature/auth-fix -> feature-auth-fix)
    VERSION=$(echo "$REF" | sed 's|refs/heads/||' | sed 's|/|-|g' | sed 's/\./-/g')
    echo "Feature branch detected: $VERSION"
elif [[ "$REF" == refs/heads/main ]] || [[ "$REF" == refs/heads/master ]]; then
    # Main/master branch: use 'main' as version
    VERSION="main"
    echo "Main branch detected: $VERSION"
else
    # Other refs: sanitize and use as version
    VERSION=$(echo "$REF" | sed 's|refs/heads/||' | sed 's|/|-|g' | sed 's/\./-/g')
    echo "Other ref detected: $VERSION"
fi

# Sanitize version name for Kubernetes (lowercase, alphanumeric and hyphens only)
VERSION=$(echo "$VERSION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')

# Ensure version doesn't exceed Kubernetes name limits (63 characters)
if [ ${#VERSION} -gt 63 ]; then
    VERSION="${VERSION:0:63}"
    VERSION=$(echo "$VERSION" | sed 's/-$//g')  # Remove trailing hyphen if cut off
fi

echo "Final sanitized version: $VERSION"

# Update package.json name field
if [ -f "package.json" ]; then
    # Create backup
    cp package.json package.json.backup
    
    # Update the name field using jq if available, otherwise use sed
    if command -v jq >/dev/null 2>&1; then
        jq --arg version "$VERSION" '.name = $version' package.json > package.json.tmp && mv package.json.tmp package.json
        echo "Updated package.json name to: $VERSION (using jq)"
    else
        # Fallback to sed for environments without jq
        sed -i.bak "s/\"name\": \".*\"/\"name\": \"$VERSION\"/" package.json
        rm -f package.json.bak
        echo "Updated package.json name to: $VERSION (using sed)"
    fi
    
    # Verify the change
    if command -v jq >/dev/null 2>&1; then
        UPDATED_NAME=$(jq -r '.name' package.json)
        echo "Verified package.json name is now: $UPDATED_NAME"
    else
        echo "Package.json updated. Please verify manually."
    fi
else
    echo "Error: package.json not found!"
    exit 1
fi

echo "Release version set successfully: $VERSION"
