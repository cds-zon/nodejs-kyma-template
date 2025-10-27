/**
 * Hono App Factory with CDS Auth
 * 
 * Creates a Hono application with authentication configured.
 */
import { Hono } from 'hono';
import type { AuthProvider, AuthMiddlewareConfig } from './types.js';
import { createAuthMiddleware } from './middleware/index.js';
import dummyProvider from './providers/dummy.js';
import mockProvider from './providers/mock.js';
import iasProvider from './providers/ias.js';

export interface CreateAuthAppOptions extends Omit<AuthMiddlewareConfig, 'provider'> {
  /**
   * Provider type or custom provider instance
   */
  provider?: 'dummy' | 'mock' | 'ias' | AuthProvider;
}

/**
 * Create a Hono app with authentication middleware
 * 
 * @param options - App configuration options
 * @returns Configured Hono app
 */
export function createAuthApp(options: CreateAuthAppOptions = {}) {
  const app = new Hono();

  // Resolve provider
  let provider: AuthProvider;
  if (!options.provider || typeof options.provider === 'string') {
    const providerType = options.provider || 'dummy';
    
    switch (providerType) {
      case 'dummy':
        provider = dummyProvider;
        break;
      case 'mock':
        provider = mockProvider;
        break;
      case 'ias':
        provider = iasProvider;
        break;
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  } else {
    provider = options.provider;
  }

  // Apply authentication middleware globally
  app.use('*', createAuthMiddleware({
    ...options,
    provider,
  }));

  // Health check endpoint (public)
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // User info endpoint
  app.get('/api/me', (c) => {
    const user = c.get('user');
    return c.json({
      user: user.id,
      claims: user.attr || {},
      tenant: user.tenant,
    });
  });

  return app;
}

/**
 * Get provider instance by type
 */
export function getProvider(type: 'dummy' | 'mock' | 'ias'): AuthProvider {
  switch (type) {
    case 'dummy':
      return dummyProvider;
    case 'mock':
      return mockProvider;
    case 'ias':
      return iasProvider;
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
