#!/bin/bash
set -e

# Restore package.json from backup if it exists
if [ -f "package.json.backup" ]; then
    cp package.json.backup package.json
    echo "Restored package.json from backup"
    
    # Verify the restoration
    if command -v jq >/dev/null 2>&1; then
        RESTORED_NAME=$(jq -r '.name' package.json)
        echo "Package.json name restored to: $RESTORED_NAME"
    fi
else
    echo "No backup found (package.json.backup)"
    exit 1
fi
