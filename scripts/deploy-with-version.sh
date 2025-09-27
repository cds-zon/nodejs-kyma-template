#!/bin/bash
set -e

# Get version from package.json
VERSION=$(jq -r '.name' package.json)
echo "Deploying with version: $VERSION"

# Export version for use in Helm templates
export VERSION

# Update values.yaml with the current version
if command -v yq >/dev/null 2>&1; then
    yq eval ".version = \"$VERSION\"" -i ./gen/chart/values.yaml
    echo "Updated values.yaml with version: $VERSION"
else
    # Fallback using sed
    sed -i.bak "s/^version: .*/version: \"$VERSION\"/" ./gen/chart/values.yaml
    rm -f ./gen/chart/values.yaml.bak
    echo "Updated values.yaml with version: $VERSION (using sed)"
fi

# Run CDS deployment with version override
npx cds up -2 k8s --set version="$VERSION"
