/**
 * Hono CDS Auth
 * 
 * Authentication middleware for Hono with SAP CDS providers
 */

// Core middleware
export { createAuthMiddleware, getUser } from './middleware/index.js';

// Factory
export { createAuthApp, getProvider } from './factory.js';

// Providers
export { DummyAuthProvider } from './providers/dummy.js';
export { MockAuthProvider } from './providers/mock.js';
export { IASAuthProvider } from './providers/ias.js';

// Types
export type {
  AuthProvider,
  AuthMiddlewareConfig,
  ProviderConfig,
  ProviderType,
  AuthUser,
} from './types.js';

// Default provider instances
export { default as dummyProvider } from './providers/dummy.js';
export { default as mockProvider } from './providers/mock.js';
export { default as iasProvider } from './providers/ias.js';
