/**
 * Authentication providers for the assistant app
 * Based on the mastra auth implementation
 */

import { AuthProvider, AuthUser } from './types';
import { config } from '../config';

/**
 * Dummy Authentication Provider
 * Always returns a privileged user for development/testing
 */
export class DummyAuthProvider implements AuthProvider {
  private dummyUser: AuthUser;

  constructor() {
    this.dummyUser = {
      id: 'anonymous',
      name: 'Anonymous User',
      email: 'anonymous@example.com',
      roles: ['any', 'authenticated', 'admin'],
      tenant: 'default',
      attr: {
        given_name: 'Anonymous',
        family_name: 'User'
      }
    };
  }

  async authenticateToken(token: string): Promise<AuthUser | null> {
    console.log('🔐 Dummy Provider - Always returning privileged user');
    
    // For dummy provider, we can accept any token or generate a new one
    if (token && token !== 'dummy') {
      // If a specific token is provided, validate it
      const payload = JWTAuthProvider.parseJWTPayload(token);
      if (payload) {
        return {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          roles: payload.roles || ['authenticated', 'admin'],
          tenant: payload.tenant,
          attr: payload
        } as AuthUser;
      }
    }
    
    return this.dummyUser;
  }

  async authorizeUser(user: AuthUser): Promise<boolean> {
    console.log('🔐 Dummy Provider - User always authorized:', user?.id);
    return true;
  }
}

/**
 * Mock Authentication Provider
 * Uses configured mock users for testing
 */
export class MockAuthProvider implements AuthProvider {
  private users: Record<string, AuthUser>;

  constructor() {
    this.users = {
      'alice': {
        id: 'alice',
        name: 'Alice',
        email: 'alice@example.com',
        roles: ['authenticated-user', 'admin'],
        tenant: 't1',
        attr: {
          phone: '1234567890',
          address: '123 Main St, Anytown, USA'
        }
      },
      'bob': {
        id: 'bob',
        name: 'Bob',
        email: 'bob@example.com',
        roles: ['authenticated-user'],
        tenant: 't2'
      }
    };
  }

  async authenticateToken(token: string): Promise<AuthUser | null> {
    if (!token) {
      return null;
    }

    try {
      console.log('🔐 Mock Provider - Authenticating token');
      
      // First try to validate as JWT token
      const jwtPayload = JWTAuthProvider.parseJWTPayload(token);
      if (jwtPayload) {
        const user = this.users[jwtPayload.sub];
        if (user) {
          console.log('🔐 Mock Provider - JWT user authenticated:', user.id);
          return user;
        }
      }
      
      // Fallback to mock token format
      const username = token.startsWith('mock:') ? token.substring(5) : token;
      const user = this.users[username];
      if (!user) {
        console.warn('🔐 Mock Provider - User not found:', username);
        return null;
      }

      console.log('🔐 Mock Provider - User authenticated:', user.id);
      return user;

    } catch (error: any) {
      console.warn('🔐 Mock Provider - Authentication failed:', error?.message || error);
      return null;
    }
  }

  async authorizeUser(user: AuthUser): Promise<boolean> {
    const authorized = user != null;
    console.log('🔐 Mock Provider - User authorized:', user?.id, authorized);
    return authorized;
  }
}

/**
 * JWT Authentication Provider
 * Validates JWT tokens
 */
export class JWTAuthProvider implements AuthProvider {
  private secret: string;
  private issuer?: string;
  private audience?: string;

  constructor(config: { secret: string; issuer?: string; audience?: string }) {
    this.secret = config.secret;
    this.issuer = config.issuer;
    this.audience = config.audience;
  }

  async authenticateToken(token: string): Promise<AuthUser | null> {
    try {
      // In a real implementation, you would validate the JWT here
      // For now, we'll just parse the payload
      const payload = this.parseJWTPayload(token);
      
      if (!payload) {
        return null;
      }

      // Validate issuer and audience if configured
      if (this.issuer && payload.iss !== this.issuer) {
        console.warn('🔐 JWT Provider - Invalid issuer:', payload.iss);
        return null;
      }

      if (this.audience && payload.aud !== this.audience) {
        console.warn('🔐 JWT Provider - Invalid audience:', payload.aud);
        return null;
      }

      const user: AuthUser = {
        id: payload.sub || 'unknown',
        name: payload.name,
        email: payload.email,
        roles: payload.roles || ['authenticated'],
        tenant: payload.tenant,
        attr: {
          ...payload,
          aud: Array.isArray(payload.aud) ? payload.aud.join(',') : payload.aud,
        }
      };

      console.log('🔐 JWT Provider - User authenticated:', user.id);
      return user;

    } catch (error: any) {
      console.warn('🔐 JWT Provider - Authentication failed:', error?.message || error);
      return null;
    }
  }

  async authorizeUser(user: AuthUser): Promise<boolean> {
    console.log('🔐 JWT Provider - User authorized:', user?.id);
    return user != null;
  }

  public static parseJWTPayload(token: string): any {
    try {
      // Simple JWT parsing - in production, use a proper JWT library
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Factory function to create auth providers
 */
export function createAuthProvider(type: 'dummy' | 'mock' | 'jwt', providerConfig?: any): AuthProvider {
  switch (type) {
    case 'dummy':
      return new DummyAuthProvider();
    case 'mock':
      return new MockAuthProvider();
    case 'jwt':
      return new JWTAuthProvider(providerConfig || config.auth.jwt);
    default:
      throw new Error(`Unknown auth provider type: ${type}`);
  }
}
