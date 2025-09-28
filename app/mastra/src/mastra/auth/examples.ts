/**
 * Authentication Provider Usage Examples
 * 
 * Shows how to use each of the 4 authentication providers
 */

import { AuthProviderFactory, createMastraAuthProvider } from './index';

// Example 1: Using IAS Provider
export function createIASProvider() {
  return AuthProviderFactory.createProvider('ias', {
    // IAS configuration would come from service bindings in real deployment
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    domain: 'your-ias-domain.ondemand.com'
  });
}

// Example 2: Using Dummy Provider (always returns privileged user)
export function createDummyProvider() {
  return AuthProviderFactory.createProvider('dummy');
}

// Example 3: Using Mock Provider with custom users
export function createMockProvider() {
  return AuthProviderFactory.createProvider('mock', {
    mockUsers: {
      'testuser': {
        id: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['authenticated', 'tester'],
        tenant: 'test-tenant'
      },
      'admin': {
        id: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        roles: ['authenticated', 'admin', 'system'],
        tenant: 'default'
      }
    }
  });
}

// Example 4: Using JWT Provider
export function createJWTProvider() {
  return AuthProviderFactory.createProvider('jwt', {
    secret: 'your-jwt-secret',
    issuer: 'your-app',
    audience: 'your-api'
  });
}

// Example 5: Using with Mastra (CDS configuration)
export function createMastraAuthFromCDS() {
  // This will read from cds.requires.auth configuration
  return createMastraAuthProvider();
}

// Example 6: Using with Mastra (Environment configuration)
export function createMastraAuthFromEnv() {
  // Set AUTH_TYPE=ias|jwt|mock|dummy in environment
  // Set corresponding config vars like JWT_SECRET, IAS_CLIENT_ID, etc.
  return createMastraAuthProvider();
}

// Example usage in tests
export async function exampleUsage() {
  const provider = createMockProvider();
  
  // Test authentication with mock token
  const user = await provider.authenticateToken('alice');
  console.log('Authenticated user:', user?.id);
  
  // Test authorization
  if (user) {
    const authorized = await provider.authorizeUser(user);
    console.log('User authorized:', authorized);
  }
}
