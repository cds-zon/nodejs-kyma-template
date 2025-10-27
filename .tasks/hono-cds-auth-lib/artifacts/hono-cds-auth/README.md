# Hono CDS Auth

Authentication middleware for Hono with SAP CDS providers (dummy, mock, and IAS).

## Features

- 🔐 **Multiple Auth Providers**: Supports dummy, mock, and IAS authentication
- 🚀 **Easy Integration**: Simple middleware setup for Hono applications
- 🏭 **Factory Pattern**: Create pre-configured Hono apps with auth
- 🧪 **Fully Tested**: Comprehensive test suite for all providers
- 📦 **TypeScript**: Full TypeScript support with type definitions
- 🔧 **Extensible**: Easy to add custom authentication providers

## Installation

```bash
npm install hono-cds-auth
```

## Quick Start

### Using the Middleware

```typescript
import { Hono } from 'hono';
import { createAuthMiddleware, getProvider } from 'hono-cds-auth';

const app = new Hono();

// Apply authentication middleware
app.use('*', createAuthMiddleware({
  provider: getProvider('mock'),
  publicRoutes: ['/health'],
  debug: true,
}));

// Your routes
app.get('/api/me', (c) => {
  const user = c.get('user');
  return c.json({ user: user.id });
});
```

### Using the Factory

```typescript
import { createAuthApp } from 'hono-cds-auth';

const app = createAuthApp({
  provider: 'mock',
  publicRoutes: ['/health'],
  debug: true,
});

// Add your routes
app.get('/api/custom', (c) => {
  return c.json({ message: 'Custom route' });
});
```

## Authentication Providers

### Dummy Provider

Simple authentication that accepts any credentials (for development).

```typescript
import { dummyProvider, createAuthMiddleware } from 'hono-cds-auth';

app.use('*', createAuthMiddleware({ provider: dummyProvider }));
```

**Usage:**
```bash
curl -u alice: http://localhost:3000/api/me
```

### Mock Provider

Uses predefined mock users from CDS configuration.

```typescript
import { mockProvider, createAuthMiddleware } from 'hono-cds-auth';

app.use('*', createAuthMiddleware({ provider: mockProvider }));
```

**Default Users:**
- `alice` (admin) - alice@example.com
- `bob` (user) - bob@example.com

**Usage:**
```bash
curl -u alice: http://localhost:3000/api/me
```

### IAS Provider

SAP Identity Authentication Service with JWT tokens.

```typescript
import { iasProvider, createAuthMiddleware } from 'hono-cds-auth';

app.use('*', createAuthMiddleware({ provider: iasProvider }));
```

**Usage:**
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/me
```

## API Reference

### `createAuthMiddleware(config)`

Creates authentication middleware.

**Options:**
- `provider`: Authentication provider instance (required)
- `publicRoutes`: Array of routes that don't require auth (default: `['/health']`)
- `debug`: Enable debug logging (default: `false`)

### `createAuthApp(options)`

Creates a Hono app with authentication configured.

**Options:**
- `provider`: Provider type (`'dummy'` | `'mock'` | `'ias'`) or custom provider
- `publicRoutes`: Array of routes that don't require auth
- `debug`: Enable debug logging

### `getProvider(type)`

Get a provider instance by type.

**Types:**
- `'dummy'`: Dummy authentication
- `'mock'`: Mock user authentication
- `'ias'`: IAS JWT authentication

### `getUser(context)`

Get the authenticated user from Hono context.

```typescript
import { getUser } from 'hono-cds-auth';

app.get('/api/profile', (c) => {
  const user = getUser(c);
  return c.json({ id: user.id });
});
```

## Custom Providers

Create custom authentication providers by implementing the `AuthProvider` interface:

```typescript
import type { AuthProvider } from 'hono-cds-auth';
import type cds from '@sap/cds';

class CustomProvider implements AuthProvider<cds.User> {
  wwwAuthenticate = 'Custom realm="API"';

  async authenticateToken(token: string, request: HonoRequest): Promise<cds.User | null> {
    // Your authentication logic
    return user;
  }

  async authorizeUser(user: cds.User, request: HonoRequest): Promise<boolean> {
    // Your authorization logic
    return true;
  }
}

const customProvider = new CustomProvider();
app.use('*', createAuthMiddleware({ provider: customProvider }));
```

## Examples

See the `examples/` directory for complete examples:

- `server.ts`: Full-featured server with all three providers

Run the example:

```bash
# Dummy provider
npm run dev

# Mock provider
AUTH_PROVIDER=mock npm run dev

# IAS provider
AUTH_PROVIDER=ias npm run dev
```

## Testing

Run tests for all providers:

```bash
npm test
```

Run individual provider tests:

```bash
npm run test:dummy
npm run test:mock
npm run test:ias
```

For IAS testing with a real token:

```bash
IAS_TOKEN="your-jwt-token" npm run test:ias
```

## Building

Build the library:

```bash
npm run build
```

This will create the distributable files in the `dist/` directory using pkgroll.

## License

MIT
