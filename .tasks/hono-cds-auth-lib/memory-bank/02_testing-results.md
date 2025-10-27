# Testing Results and Usage Examples

**Created**: 2025-10-27
**Last Updated**: 2025-10-27
**Category**: [TESTING]
**Timeline**: 02 of 02 - Final testing and validation

## Test Results

### Dummy Provider ✅
All tests passing:
- ✅ Public endpoint (no auth)
- ✅ Protected endpoint without auth (401)
- ✅ Valid Basic auth (alice)
- ✅ Valid Basic auth (bob)

### Mock Provider ✅
All tests passing:
- ✅ Public endpoint (no auth)
- ✅ Protected endpoint without auth (401)
- ✅ Mock user alice (admin with full attributes)
- ✅ Mock user bob (user)
- ✅ Unknown user rejected (401)

### IAS Provider ⚠️
Not tested with real tokens (requires IAS credentials):
- Requires `IAS_TOKEN` environment variable
- Instructions provided in test output
- Provider code is complete and ready

## Usage Examples

### Basic Usage with Middleware
```typescript
import { Hono } from 'hono';
import { createAuthMiddleware, getProvider } from 'hono-cds-auth';

const app = new Hono();

app.use('*', createAuthMiddleware({
  provider: getProvider('mock'),
  publicRoutes: ['/health'],
  debug: true,
}));

app.get('/api/me', (c) => {
  const user = c.get('user');
  return c.json({ user: user.id });
});
```

### Using Factory
```typescript
import { createAuthApp } from 'hono-cds-auth';

const app = createAuthApp({
  provider: 'mock',
  publicRoutes: ['/health'],
});

// Comes with /health and /api/me endpoints
// Add your own routes
app.get('/api/data', (c) => {
  const user = c.get('user');
  return c.json({ data: 'protected', user: user.id });
});
```

### Testing with curl

#### Dummy Provider
```bash
curl -u alice: http://localhost:3000/api/me
curl -u bob: http://localhost:3000/api/me
```

#### Mock Provider
```bash
curl -u alice: http://localhost:3000/api/me
curl -u bob: http://localhost:3000/api/me
```

#### IAS Provider
```bash
export TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/me
```

## Running the Example Server

```bash
# Dummy provider
npm run dev

# Mock provider  
AUTH_PROVIDER=mock npm run dev

# IAS provider
AUTH_PROVIDER=ias npm run dev
```

Server provides:
- `/health` - Public health check
- `/api/me` - Get current user info
- `/api/protected` - Protected endpoint example
- `/api/data` - POST endpoint example

## Package Distribution

Built with pkgroll:
```bash
npm run build
```

Creates:
- `dist/index.js` - Main entry point
- `dist/index.d.ts` - TypeScript definitions
- `dist/middleware/` - Middleware exports
- `dist/providers/` - Provider exports

## Known Limitations

1. **CDS Configuration Variance**: Mock provider handles missing IDs, but complex CDS configurations may need adjustment
2. **IAS Testing**: Requires real IAS credentials and tokens
3. **Error Messages**: Could be more detailed for debugging
4. **Rate Limiting**: Not included (should be added by consumer)
5. **Session Management**: Not included (stateless tokens only)

## Recommendations for Production

1. Add rate limiting middleware
2. Implement token refresh logic for IAS
3. Add comprehensive error logging
4. Set up monitoring/metrics
5. Add CORS configuration
6. Implement request validation
7. Add API documentation (OpenAPI/Swagger)
