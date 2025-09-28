/**
 * Direct CDS Authentication Implementation
 * 
 * This implements CDS auth logic directly without importing CDS middleware,
 * supporting IAS and mock strategies based on CDS configuration.
 */

import { IdentityService, SecurityContext } from "@sap/xssec";

// CDS User interface (simplified)
interface CDSUser {
  id: string;
  attr?: Record<string, any>;
  roles?: string[];
  tenant?: string;
  authInfo?: any;
  is(role: string): boolean;
}

// Simple CDS User implementation
class User implements CDSUser {
  id: string;
  attr: Record<string, any> = {};
  roles: string[] = [];
  tenant?: string;
  authInfo?: any;

  constructor(data: { id: string; attr?: Record<string, any>; roles?: string[]; tenant?: string; authInfo?: any }) {
    this.id = data.id;
    this.attr = data.attr || {};
    this.roles = data.roles || [];
    this.tenant = data.tenant;
    this.authInfo = data.authInfo;
  }

  is(role: string): boolean {
    return this.roles.includes(role);
  }
}

// Privileged user for dummy auth
const privilegedUser = new User({
  id: 'anonymous',
  roles: ['any', 'authenticated'],
  attr: { name: 'Anonymous User' }
});

// Mock users configuration
const mockUsers: Record<string, any> = {
  'alice': { password: 'alice', roles: ['admin', 'user'], tenant: 'tenant-a' },
  'bob': { password: 'bob', roles: ['user'], tenant: 'tenant-b' },
  'admin': { password: 'admin', roles: ['admin', 'user', 'system'], tenant: 'default' },
  '*': true // Allow any user
};

export class CDSDirectAuth {
  private authService?: IdentityService;
  private authKind: string;
  private credentials?: any;

  constructor(authConfig: any = {}) {
    this.authKind = authConfig.kind || 'dummy';
    this.credentials = authConfig.credentials;

    // Initialize IAS service if credentials are provided
    if (this.credentials && (this.authKind === 'ias' || this.authKind === 'jwt')) {
      try {
        this.authService = new IdentityService(this.credentials);
        console.log('✅ IAS Auth Service initialized');
      } catch (error) {
        console.warn('⚠️  Failed to initialize IAS Auth Service:', error);
        this.authKind = 'dummy'; // Fallback to dummy
      }
    }
  }

  /**
   * Authenticate a token and return a CDS User
   */
  async authenticateToken(token: string): Promise<CDSUser | null> {
    if (!token) return null;

    switch (this.authKind) {
      case 'ias':
      case 'jwt':
        return await this.authenticateIAS(token);
      case 'basic':
      case 'mocked':
        return await this.authenticateMocked(token);
      case 'dummy':
      default:
        return this.authenticateDummy();
    }
  }

  /**
   * Authorize a user (always returns true for now)
   */
  async authorizeUser(user: CDSUser): Promise<boolean> {
    return user != null;
  }

  /**
   * IAS/JWT authentication implementation
   */
  private async authenticateIAS(token: string): Promise<CDSUser | null> {
    if (!this.authService) {
      console.warn('⚠️  IAS Auth Service not available, falling back to JWT parsing');
      return this.parseJWT(token);
    }

    try {
      const securityContext = await this.authService.createSecurityContext(token);
      return this.createUserFromSecurityContext(securityContext);
    } catch (error) {
      console.warn('⚠️  IAS authentication failed:', error);
      // Fallback to manual JWT parsing
      return this.parseJWT(token);
    }
  }

  /**
   * Create CDS User from Security Context (IAS)
   */
  private createUserFromSecurityContext(securityContext: SecurityContext<any, any>): CDSUser {
    const tokenInfo = securityContext.token;
    const payload = tokenInfo.getPayload();

    const roles: string[] = payload.scope ? Array.isArray(payload.scope) ? payload.scope : payload.scope.split(' ') : [];
    if (Array.isArray(payload.ias_apis)) {
      roles.push(...payload.ias_apis);
    }

    // Check if it's a client credentials token
    const clientid = tokenInfo.getClientId();
    if (clientid === this.credentials?.clientid) {
      roles.push('internal-user');
    }
    if (Array.isArray(payload.ias_apis)) {
      roles.push(...payload.ias_apis);
    }

    if (clientid === payload.sub) {
      // System user (client credentials or x509)
      roles.push('system-user');
    } 

    return new User({
      id: payload.sub || payload.user_name || payload.email || 'unknown',
      attr:{
        logonName: payload.user_name,
        givenName: payload.given_name,
        familyName: payload.family_name,
        ...payload
      },
      roles,
      tenant: (tokenInfo as any).getZoneId?.() || payload.zid || 'default',
      authInfo: securityContext
    });
  }

  /**
   * Fallback JWT parsing (when IAS service is not available)
   */
  private parseJWT(token: string): CDSUser | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));

      // Extract roles from scopes
      const roles = [];
      if (payload.scope) {
        const scopes = Array.isArray(payload.scope) ? payload.scope : payload.scope.split(' ');
        roles.push(...scopes);
      }

      return new User({
        id: payload.sub || payload.user_name || payload.email || 'unknown',
        attr: payload, // Keep all attributes
        roles,
        tenant: payload.zid || payload.tenant || 'default'
      });
    } catch (error) {
      console.warn('Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * Mock/Basic authentication (for development)
   */
  private async authenticateMocked(credentials: string): Promise<CDSUser | null> {
    try {
      // Decode basic auth
      const decoded = atob(credentials.replace(/^Basic\s+/i, ''));
      const [username, password] = decoded.split(':');

      const userConfig = mockUsers[username] || mockUsers['*'];
      if (!userConfig) {
        return null;
      }

      // Check password if configured
      if (typeof userConfig === 'object' && userConfig.password && password !== userConfig.password) {
        return null;
      }

      // Create user
      const userData = typeof userConfig === 'object' ? userConfig : { roles: ['user'] };
      
      return new User({
        id: username,
        roles: userData.roles || ['user'],
        tenant: userData.tenant || 'default',
        attr: {
          name: userData.name || username,
          email: userData.email || `${username}@example.com`,
          ...userData.attr
        }
      });
    } catch (error) {
      console.warn('Mock authentication failed:', error);
      return null;
    }
  }

  /**
   * Dummy authentication (always returns privileged user)
   */
  private authenticateDummy(): CDSUser {
    return privilegedUser;
  }
}

// Export auth provider instance
export const cdsDirectAuthProvider = {
  async authenticateToken(token: string): Promise<any> {
    // Get auth config from environment or use dummy
    const authConfig = this.getAuthConfig();
    const auth = new CDSDirectAuth(authConfig);
    
    const cleanToken = token?.replace(/^Bearer\s+/i, '') || '';
    const user = await auth.authenticateToken(cleanToken);
    
    console.log('🔐 CDS Direct Auth - Token authenticated:', user?.id);
    return user;
  },

  async authorizeUser(user: any): Promise<boolean> {
    const authorized = user != null;
    console.log('🔐 CDS Direct Auth - User authorized:', user?.id, authorized);
    return authorized;
  },

  getAuthConfig(): any {
    // Try to get auth config from environment
    try {
      // Check for VCAP_SERVICES
      const vcapServices = process.env.VCAP_SERVICES ? JSON.parse(process.env.VCAP_SERVICES) : {};
      
      // Look for IAS service
      const iasService = vcapServices.identity?.[0] || vcapServices.ias?.[0];
      if (iasService) {
        return {
          kind: 'ias',
          credentials: iasService.credentials
        };
      }

      // Look for XSUAA service (treat as IAS for compatibility)
      const xsuaaService = vcapServices.xsuaa?.[0];
      if (xsuaaService) {
        return {
          kind: 'jwt',
          credentials: xsuaaService.credentials
        };
      }

      // Check for explicit auth configuration
      const cdsConfig = process.env.CDS_CONFIG ? JSON.parse(process.env.CDS_CONFIG) : {};
      if (cdsConfig.requires?.auth) {
        return cdsConfig.requires.auth;
      }

    } catch (error) {
      console.warn('Failed to parse auth config from environment:', error);
    }

    // Default to dummy auth for development
    return { kind: 'dummy' };
  }
};
