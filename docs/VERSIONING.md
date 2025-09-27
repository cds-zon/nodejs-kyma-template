# Dynamic Release Versioning

This project supports dynamic release versioning based on Git branches and tags, allowing multiple deployments in the same Kubernetes namespace with different versions.

## How It Works

The `scripts/set-release-version.sh` script automatically sets the `name` field in `package.json` based on the current Git reference:

- **Tags** (`refs/tags/v1.2.3`) → `v1-2-3`
- **Release branches** (`refs/heads/release/v2.0`) → `release-v2-0`  
- **Feature branches** (`refs/heads/feature/auth-fix`) → `feature-auth-fix`
- **Main branch** (`refs/heads/main`) → `main`
- **Other branches** → sanitized branch name

## Version Naming Rules

- Converted to lowercase
- Dots (`.`) replaced with hyphens (`-`)
- Slashes (`/`) replaced with hyphens (`-`)
- Non-alphanumeric characters replaced with hyphens
- Truncated to 63 characters (Kubernetes limit)
- Trailing hyphens removed

## Usage

### Automatic (GitHub Actions)
The workflow automatically uses versioned deployment:
```yaml
- run: npm run deploy:versioned
```

### Manual Deployment
```bash
# Set version and deploy
npm run deploy:versioned
npm run deploy:helm:versioned

# Build with version
npm run build:versioned
npm run build:containers:versioned
npm run build:push:versioned

# Restore original version
npm run restore-version
```

### Manual Version Override
```bash
# Set specific version
./scripts/set-release-version.sh "refs/tags/v2.1.0"

# Deploy with that version
npm run build && npm run _deploy:helm:dynamic
```

## Deployment Architecture

### Shared Resources
- **PostgreSQL**: Uses `fullNameOverride: v1-postgres` to remain shared across all versions
- **Namespace**: All versions deploy to the same namespace

### Version-Specific Resources
- **Router hostname**: Prefixed with version name (e.g., `feature-auth-fix-router.kyma.local`)
- **Service names**: Prefixed with version name
- **Helm release name**: Uses the version name

## Examples

| Branch/Tag | Version Name | Router URL | Helm Release |
|------------|--------------|------------|--------------|
| `feature/ci-cd` | `feature-ci-cd` | `feature-ci-cd-router.kyma.local` | `feature-ci-cd` |
| `release/v2.0` | `release-v2-0` | `release-v2-0-router.kyma.local` | `release-v2-0` |
| `refs/tags/v1.2.3` | `v1-2-3` | `v1-2-3-router.kyma.local` | `v1-2-3` |
| `main` | `main` | `main-router.kyma.local` | `main` |

## Benefits

1. **Multiple environments**: Deploy different versions simultaneously
2. **Shared database**: All versions use the same PostgreSQL instance
3. **Easy cleanup**: Remove specific versions without affecting others
4. **Branch-based testing**: Each feature branch gets its own environment
5. **Release management**: Clear separation between release versions

## Cleanup

To remove a specific version deployment:
```bash
# List all releases
helm list

# Remove specific version
helm uninstall <version-name>
```
