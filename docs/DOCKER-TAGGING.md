# Dynamic Docker Image Tagging

This project uses dynamic Docker image tagging based on the Git branch/tag to enable multiple deployments with version-specific images.

## How It Works

### 1. **Version Source**
- Version is derived from `package.json` `name` field
- The `name` field is automatically set by `scripts/set-release-version.sh` based on:
  - **Tags**: `refs/tags/v1.2.3` → `v1-2-3`
  - **Release branches**: `refs/heads/release/v2.0` → `release-v2-0`
  - **Feature branches**: `refs/heads/feature/auth-fix` → `feature-auth-fix`
  - **Main branch**: `refs/heads/main` → `main`

### 2. **Docker Image Tagging**

#### **containerize.yaml**
```yaml
# Dynamic tag from package.json
tag: "$(jq -r '.name' package.json)"

modules:
  - name: router/api
    build-parameters:
      commands:
        - export VERSION=$(jq -r '.name' package.json)
        - docker buildx build --platform linux/amd64 -t router/api:$VERSION -f Dockerfile . --load

  - name: agents/mastra
    build-parameters:
      commands:
        - export VERSION=$(jq -r '.name' package.json)
        - docker buildx build --platform linux/amd64 -t agents/mastra:$VERSION -f app/mastra/Dockerfile --target dev . --load
```

#### **values.yaml**
```yaml
# Version passed from deployment scripts
version: "v1"

global:
  image:
    tag: "{{ .Values.version | default \"v1\" }}"

mastra:
  image:
    tag: "{{ .Values.version | default \"v1\" }}"
```

### 3. **Deployment Integration**

#### **Package.json Scripts**
```json
{
  "scripts": {
    "set-version": "./scripts/set-release-version.sh",
    "build:containers:versioned": "npm run set-version && npm run build:containers",
    "deploy:versioned": "npm run set-version && ./scripts/deploy-with-version.sh",
    "deploy:helm:versioned": "npm run build:versioned && npm run _deploy:helm:dynamic",
    "_deploy:helm:dynamic": "helm upgrade $(jq -r '.name' package.json) ./gen/chart --install --create-namespace --set version=$(jq -r '.name' package.json)"
  }
}
```

#### **Deploy Script**
The `scripts/deploy-with-version.sh` script:
1. Reads version from `package.json`
2. Updates `values.yaml` with the version
3. Deploys with version-specific Helm release name and image tags

## Usage Examples

### **Feature Branch Development**
```bash
# On feature/new-auth branch
npm run set-version                    # Sets name to "feature-new-auth"
npm run build:containers:versioned     # Builds: router/api:feature-new-auth, agents/mastra:feature-new-auth
npm run deploy:versioned               # Deploys with feature-new-auth images
```

### **Release Deployment**
```bash
# On release/v2.1 branch
npm run deploy:versioned               # Deploys: release-v2-1 images and Helm release
```

### **Production Tag**
```bash
# On tag v2.1.0
npm run deploy:versioned               # Deploys: v2-1-0 images and Helm release
```

## Image Registry Structure

```
scai-dev.common.repositories.cloud.sap/
├── router/
│   └── api:feature-ci-rc              # Router API image
│   └── api:main                       # Main branch image
│   └── api:v2-1-0                     # Tagged release image
└── agents/
    └── mastra:feature-ci-rc           # Mastra agent image
    └── mastra:main                    # Main branch image
    └── mastra:v2-1-0                  # Tagged release image
```

## Benefits

1. **Version Isolation**: Each branch/tag gets its own Docker images
2. **Easy Rollback**: Can easily switch between different image versions
3. **Development Safety**: Feature branches don't interfere with production images
4. **Automated CI/CD**: GitHub Actions automatically builds version-specific images
5. **Consistent Naming**: Same version used across all components (Helm release, Docker images, hostnames)

## GitHub Actions Integration

The CI workflow automatically:
1. Sets the version based on the Git reference
2. Builds Docker images with version-specific tags
3. Pushes to the registry with proper tags
4. Deploys using the versioned Helm release

## Troubleshooting

### **Version Mismatch**
If deployed images don't match expectations:
```bash
# Check current version
jq -r '.name' package.json

# Manually set version
npm run set-version

# Verify values.yaml
grep "version:" ./gen/chart/values.yaml
```

### **Image Not Found**
Ensure the image was built and pushed:
```bash
# Build and push versioned containers
npm run build:push:versioned
```
