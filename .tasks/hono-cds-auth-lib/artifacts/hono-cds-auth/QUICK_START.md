# Quick Start Guide

## Installation

```bash
npm install hono-cds-auth
```

## Basic Usage

### 1. With Middleware (Recommended)

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

// Protected routes
app.get('/api/me', (c) => {
  const user = c.get('user');
  return c.json({ 
    id: user.id,
    email: user.attr?.email 
  });
});

export default app;
```

### 2. With App Factory

```typescript
import { createAuthApp } from 'hono-cds-auth';

const app = createAuthApp({
  provider: 'mock',  // 'dummy', 'mock', or 'ias'
  publicRoutes: ['/health'],
  debug: true,
});

// Automatically includes /health and /api/me
// Add your custom routes
app.get('/api/data', (c) => {
  const user = c.get('user');
  return c.json({ message: 'Protected data', user: user.id });
});

export default app;
```

## Provider Selection

### Dummy Provider (Development)
Accepts any credentials - great for quick prototyping.

```typescript
provider: getProvider('dummy')
```

**Test with:**
```bash
curl -u alice: http://localhost:3000/api/me
curl -u anyone: http://localhost:3000/api/me
```

### Mock Provider (Testing)
Uses predefined users (alice, bob) with attributes.

```typescript
provider: getProvider('mock')
```

**Test with:**
```bash
curl -u alice: http://localhost:3000/api/me
curl -u bob: http://localhost:3000/api/me
```

**Predefined users:**
- `alice` - Admin with email, phone, address
- `bob` - Regular user with email

### IAS Provider (Production)
SAP Identity Authentication Service with JWT tokens.

```typescript
provider: getProvider('ias')
```

**Test with:**
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:3000/api/me
```

## Custom Provider

```typescript
import { AuthProvider } from 'hono-cds-auth';
import cds from '@sap/cds';

class MyAuthProvider implements AuthProvider<cds.User> {
  wwwAuthenticate = 'Bearer realm="API"';

  async authenticateToken(token: string, request: HonoRequest): Promise<cds.User | null> {
    // Your authentication logic
    return new cds.User({ id: 'user123' });
  }

  async authorizeUser(user: cds.User, request: HonoRequest): Promise<boolean> {
    // Your authorization logic
    return true;
  }
}

app.use('*', createAuthMiddleware({ 
  provider: new MyAuthProvider() 
}));
```

## Configuration Options

```typescript
createAuthMiddleware({
  provider: getProvider('mock'),      // Required: auth provider
  publicRoutes: ['/health', '/docs'], // Optional: routes without auth
  debug: true,                        // Optional: enable debug logging
})
```

## Accessing User in Routes

```typescript
app.get('/api/profile', (c) => {
  const user = c.get('user');
  
  return c.json({
    id: user.id,
    email: user.attr?.email,
    name: user.attr?.name,
    roles: user.roles,
    tenant: user.tenant,
  });
});
```

## Running Examples

See `examples/server.ts` for a complete working example:

```bash
# Install dependencies
npm install

# Run with different providers
npm run dev                    # Dummy (default)
AUTH_PROVIDER=mock npm run dev # Mock
AUTH_PROVIDER=ias npm run dev  # IAS
```

## Testing

```bash
npm test           # Run all tests
npm run test:dummy # Test dummy provider
npm run test:mock  # Test mock provider
npm run test:ias   # Test IAS provider (needs token)
```

## Next Steps

1. Check the [README](./README.md) for detailed documentation
2. Explore the [examples](./examples/) directory
3. Review the [tests](./tests/) for usage patterns
4. Customize providers for your needs
