# Workspace Integration

**Package**: `@cds-zon/hono-auth`  
**Location**: `packages/hono-cds-auth/`  
**Workspace**: pnpm workspace  
**Status**: ✅ Integrated and tested

## Workspace Setup

This package is part of the pnpm workspace configured in the root `pnpm-workspace.yaml`:

```yaml
packages:
  - app/*
  - packages/*
```

## Using in Other Workspace Packages

To use this package in other workspace projects:

### 1. Add as Dependency

In your workspace package's `package.json`:

```json
{
  "dependencies": {
    "@cds-zon/hono-auth": "workspace:*"
  }
}
```

### 2. Install Dependencies

```bash
cd /workspace
pnpm install
```

### 3. Import in Code

```typescript
import { createAuthMiddleware, getProvider } from '@cds-zon/hono-auth';

// Use in your Hono app
app.use('*', createAuthMiddleware({
  provider: getProvider('mock'),
  publicRoutes: ['/health'],
}));
```

## Example: Using in app/mastra

To integrate in the mastra package:

```bash
# From workspace root
pnpm --filter @mastra/core add @cds-zon/hono-auth --workspace
```

Or manually add to `app/mastra/package.json`:

```json
{
  "dependencies": {
    "@cds-zon/hono-auth": "workspace:*"
  }
}
```

Then in your code:

```typescript
// app/mastra/src/mastra/middleware/auth.ts
import { createAuthMiddleware, getProvider } from '@cds-zon/hono-auth';
import cds from '@sap/cds';

// Determine provider from CDS config
const providerType = cds.requires.auth.kind as 'dummy' | 'mock' | 'ias';

export const authMiddleware = createAuthMiddleware({
  provider: getProvider(providerType),
  publicRoutes: ['/health'],
  debug: process.env.NODE_ENV !== 'production',
});
```

## Development Workflow

### Building the Package

```bash
cd packages/hono-cds-auth
pnpm run build
```

### Testing the Package

```bash
cd packages/hono-cds-auth
pnpm test
```

### Running Example Server

```bash
cd packages/hono-cds-auth
pnpm run dev

# With different providers
AUTH_PROVIDER=mock pnpm run dev
AUTH_PROVIDER=ias pnpm run dev
```

## Workspace Commands

From the root directory:

```bash
# Install all workspace dependencies
pnpm install

# Build all packages
pnpm -r run build

# Run tests for this package only
pnpm --filter @cds-zon/hono-auth test

# Run dev server for this package
pnpm --filter @cds-zon/hono-auth dev

# Add dependency to this package
pnpm --filter @cds-zon/hono-auth add <package-name>
```

## Benefits of Workspace Integration

1. **Local Development**: Changes are immediately available to other packages
2. **Version Consistency**: All packages use the same dependencies
3. **Simplified Dependencies**: Use `workspace:*` protocol
4. **Fast Iteration**: No need to publish to test in other packages
5. **Monorepo Benefits**: Shared tooling, scripts, and configuration

## Publishing

When ready to publish externally:

```bash
cd packages/hono-cds-auth

# Login to npm
npm login

# Publish (scoped packages need --access public)
npm publish --access public
```

After publishing, other projects outside this workspace can install:

```bash
npm install @cds-zon/hono-auth
# or
pnpm add @cds-zon/hono-auth
```

## CI/CD Considerations

In CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build workspace packages
  run: pnpm -r run build

- name: Test auth library
  run: pnpm --filter @cds-zon/hono-auth test
```

## Troubleshooting

### Package Not Found

If other workspace packages can't find `@cds-zon/hono-auth`:

```bash
# From workspace root
pnpm install

# Verify workspace structure
pnpm list --depth 0
```

### Build Issues

Ensure the package is built before using:

```bash
cd packages/hono-cds-auth
pnpm run build
```

### Hot Reload

When developing, changes to this package require rebuilding:

```bash
cd packages/hono-cds-auth
pnpm run build

# Or use watch mode (if configured)
pnpm run build:watch
```

## Related Documentation

- [README.md](./README.md) - Package documentation
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [SUMMARY.md](./SUMMARY.md) - Package summary
- Root [pnpm-workspace.yaml](../../pnpm-workspace.yaml) - Workspace configuration
