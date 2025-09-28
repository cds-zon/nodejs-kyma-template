/**
 * JWT Authentication Provider
 * 
 * Handles standard JWT token authentication and validation
 */

import { MastraAuthProvider, CDSUser, User } from "./interfaces";

interface JWTConfig {
  secret?: string;
  algorithm?: string;
  issuer?: string;
  audience?: string;
}

interface JWTPayload {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  roles?: string[];
  scope?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export class JWTProvider implements MastraAuthProvider {
  private config: JWTConfig;

  constructor(config: JWTConfig = {}) {
    this.config = {
      secret: config.secret || process.env.JWT_SECRET || 'default-secret',
      algorithm: config.algorithm || 'HS256',
      issuer: config.issuer,
      audience: config.audience,
      ...config
    };
  }

  async authenticateToken(token: string): Promise<CDSUser | null> {
    if (!token) {
      return null;
    }

    try {
      console.log('🔐 JWT Provider - Authenticating token');
      
      // Basic JWT validation (without external dependencies)
      const payload = this.decodeJWT(token);
      
      if (!payload) {
        console.warn('🔐 JWT Provider - Invalid JWT token');
        return null;
      }

      // Validate expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        console.warn('🔐 JWT Provider - Token expired');
        return null;
      }

      // Validate issuer if configured
      if (this.config.issuer && payload.iss !== this.config.issuer) {
        console.warn('🔐 JWT Provider - Invalid issuer');
        return null;
      }

      // Validate audience if configured
      if (this.config.audience && payload.aud !== this.config.audience) {
        console.warn('🔐 JWT Provider - Invalid audience');
        return null;
      }

      // Extract user information
      const userId = payload.sub || payload.email || 'unknown';
      const roles = payload.roles || 
                   (payload.scope ? payload.scope.split(' ') : []) || 
                   ['authenticated'];

      const user = new User({
        id: userId,
        roles,
        tenant: payload.tenant || 'default',
        attr: {
          name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          email: payload.email,
          given_name: payload.given_name,
          family_name: payload.family_name,
          ...payload.custom_attrs
        },
        authInfo: {
          provider: 'jwt',
          payload,
          issuer: payload.iss,
          audience: payload.aud
        }
      });

      console.log('🔐 JWT Provider - User authenticated:', user.id);
      return user;

    } catch (error) {
      console.warn('🔐 JWT Provider - Authentication failed:', error.message);
      return null;
    }
  }

  async authorizeUser(user: CDSUser): Promise<boolean> {
    // Simple authorization - if user exists and has authenticated role
    const authorized = user != null && user.roles?.includes('authenticated');
    console.log('🔐 JWT Provider - User authorized:', user?.id, authorized);
    return authorized;
  }

  /**
   * Basic JWT decode (without signature verification for simplicity)
   * In production, use a proper JWT library like jsonwebtoken
   */
  private decodeJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
      return JSON.parse(decoded) as JWTPayload;
    } catch (error) {
      console.warn('🔐 JWT Provider - Failed to decode token:', error.message);
      return null;
    }
  }

  /**
   * Helper method to create a simple JWT token for testing
   * Note: This is for testing only, use proper JWT libraries in production
   */
  static createTestToken(payload: Partial<JWTPayload>, secret: string = 'default-secret'): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      iat: now,
      exp: now + 3600, // 1 hour
      ...payload
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    
    // Simple signature (in production, use proper HMAC)
    const signature = Buffer.from(`${encodedHeader}.${encodedPayload}.${secret}`).toString('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
}

const jwtProvider = new JWTProvider();

export default jwtProvider;