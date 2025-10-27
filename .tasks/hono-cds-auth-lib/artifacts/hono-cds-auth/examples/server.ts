/**
 * Example Hono Server with CDS Auth
 * 
 * Demonstrates usage of hono-cds-auth middleware with different providers
 */
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createAuthMiddleware, getProvider } from '../src/index.js';

// Get provider type from environment or default to dummy
const providerType = (process.env.AUTH_PROVIDER || 'dummy') as 'dummy' | 'mock' | 'ias';

console.log(`🚀 Starting server with ${providerType} authentication provider`);

// Create Hono app
const app = new Hono();

// Public routes (no auth required)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    provider: providerType,
  });
});

// Apply authentication middleware
const authMiddleware = createAuthMiddleware({
  provider: getProvider(providerType),
  publicRoutes: ['/health'],
  debug: true,
});

app.use('*', authMiddleware);

// Protected routes
app.get('/api/me', (c) => {
  const user = c.get('user');
  return c.json({
    user: user.id,
    claims: user.attr || {},
    tenant: user.tenant,
    provider: providerType,
  });
});

app.get('/api/protected', (c) => {
  const user = c.get('user');
  return c.json({
    message: 'This is a protected endpoint',
    user: user.id,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/data', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  return c.json({
    message: 'Data received',
    user: user.id,
    data: body,
  });
});

// Start server
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`
┌─────────────────────────────────────────┐
│  Hono CDS Auth Example Server          │
├─────────────────────────────────────────┤
│  Provider: ${providerType.padEnd(28)} │
│  Port: ${String(port).padEnd(32)} │
├─────────────────────────────────────────┤
│  Endpoints:                             │
│  • GET  /health (public)                │
│  • GET  /api/me (protected)             │
│  • GET  /api/protected (protected)      │
│  • POST /api/data (protected)           │
└─────────────────────────────────────────┘

📝 Authentication Instructions:
${getAuthInstructions(providerType)}
`);

serve({
  fetch: app.fetch,
  port,
});

function getAuthInstructions(provider: string): string {
  switch (provider) {
    case 'dummy':
      return `
  For Dummy auth, use Basic authentication:
  
  curl -u alice: http://localhost:${port}/api/me
  curl -u bob: http://localhost:${port}/api/me
  
  Any username works (password can be empty).
      `.trim();
      
    case 'mock':
      return `
  For Mock auth, use Basic authentication with predefined users:
  
  curl -u alice: http://localhost:${port}/api/me
  curl -u bob: http://localhost:${port}/api/me
  
  Users: alice (admin), bob (user)
      `.trim();
      
    case 'ias':
      return `
  For IAS auth, use Bearer token:
  
  export TOKEN="your-jwt-token"
  curl -H "Authorization: Bearer $TOKEN" http://localhost:${port}/api/me
  
  Requires valid IAS configuration in CDS.
      `.trim();
      
    default:
      return 'Unknown provider';
  }
}
