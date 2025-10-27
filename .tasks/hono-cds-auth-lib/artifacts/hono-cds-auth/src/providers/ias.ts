/**
 * IAS (Identity Authentication Service) Provider
 * 
 * Authenticates using SAP IAS with JWT tokens.
 * Requires @sap/xssec for token validation.
 */
import type { HonoRequest } from 'hono';
import cds from '@sap/cds';
import type { AuthProvider } from '../types.js';
import { createSecurityContext, requests } from '@sap/xssec';

export class IASAuthProvider implements AuthProvider<cds.User> {
  wwwAuthenticate = 'Bearer realm="IAS"';
  private credentials: any;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    try {
      this.credentials = cds.env?.requires?.auth?.credentials;
      
      if (!this.credentials) {
        console.warn('🔐 IAS Auth - No credentials found in CDS configuration');
      } else {
        console.debug('🔐 IAS Auth - Credentials loaded');
      }
    } catch (error) {
      console.error('🔐 IAS Auth - Error loading credentials:', error);
    }
  }

  async authenticateToken(token: string, request: HonoRequest): Promise<cds.User | null> {
    if (!token || token === 'anonymous') {
      return null;
    }

    if (!this.credentials) {
      console.error('🔐 IAS Auth - Cannot authenticate: credentials not configured');
      return null;
    }

    try {
      // Create security context from JWT token
      const securityContext = await new Promise<any>((resolve, reject) => {
        createSecurityContext(this.credentials, token, (err: any, context: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(context);
          }
        });
      });

      if (!securityContext) {
        console.debug('🔐 IAS Auth - Invalid security context');
        return null;
      }

      // Extract user information from token
      const userId = securityContext.getLogonName() || securityContext.getSubdomain();
      const userAttributes = securityContext.getUserAttributes() || {};
      
      const user = new cds.User({
        id: userId,
        attr: {
          email: securityContext.getEmail?.() || userAttributes.email,
          name: securityContext.getGivenName?.() || userAttributes.given_name,
          familyName: securityContext.getFamilyName?.() || userAttributes.family_name,
          ...userAttributes,
        },
        tenant: securityContext.getSubdomain?.(),
      });

      console.debug(`🔐 IAS Auth - Authenticated user: ${userId}`);
      return user;
    } catch (error) {
      console.error('🔐 IAS Auth - Authentication error:', error);
      return null;
    }
  }

  async authorizeUser(user: cds.User, request: HonoRequest): Promise<boolean> {
    // For IAS, if the token was valid and user was authenticated, they are authorized
    return !!user?.id;
  }

  /**
   * Update credentials dynamically
   */
  updateCredentials(credentials: any) {
    this.credentials = credentials;
    console.debug('🔐 IAS Auth - Credentials updated');
  }
}

export default new IASAuthProvider();
