// import type { HonoRequest } from 'hono'; // Using any for compatibility
import { MastraAuthProvider } from '@mastra/core/server';
import type { MastraAuthProviderOptions } from '@mastra/core/server';
import { IdentityService, SecurityContext } from '@sap/xssec';
import cds from '@sap/cds';
import type { HonoRequest } from 'hono';

// CDS User type based on security context
export interface CdsUser {
  id: string;
  name: string;
  email?: string;
  logonName: string;
  givenName?: string;
  familyName?: string;
  roles?: string[];
  tenant?: string;
  attributes?: Record<string, any>;
}

interface MastraAuthCdsOptions extends MastraAuthProviderOptions<CdsUser> {
  // No additional options needed for CDS auth
}

export class MastraAuthCds extends MastraAuthProvider<CdsUser> {
  private authService: IdentityService;

  constructor(options?: MastraAuthCdsOptions) {
    super({name:  'cds', ...options ||{} });

    // Initialize XSSEC auth service
    const authConfig = cds.env.requires.auth;
    
    if (!authConfig?.credentials) {
      throw new Error(
        'CDS auth credentials not found. Make sure your application is bound to XSUAA service or auth credentials are properly configured.'
      );
    }

    this.authService = new IdentityService(authConfig.credentials);
    console.log('🔐 MastraAuthCds initialized with XSSEC');

    this.registerOptions(options);
  }

  public async authenticateToken(token: string, request: HonoRequest): Promise<CdsUser | null> {
    console.log('🔐 MastraAuthCds authenticateToken');

    try {
      // Create security context using XSSEC
      const securityContext = await this.authService.createSecurityContext(token);
      
      if (!securityContext) {
        console.log('❌ Failed to create security context');
        return null;
      }

      // Extract user information from security context
      const user: CdsUser = {
        id: securityContext.getLogonName(),
        name: `${securityContext.getGivenName() || ''} ${securityContext.getFamilyName() || ''}`.trim(),
        email: securityContext.getEmail(),
        logonName: securityContext.getLogonName(),
        givenName: securityContext.getGivenName(),
        familyName: securityContext.getFamilyName(),
        // roles: securityContext.getRoleCollections?.(), // Uncomment if needed
        // tenant: securityContext.getZoneId?.(), // Uncomment if needed
        attributes: {
          logonName: securityContext.getLogonName(),
          // zoneId: securityContext.getZoneId?.(), // Method may not exist in all versions
          email: securityContext.getEmail(),
        }
      };

      // Try to enrich user data from CDS context if available
      const cdsUser = MastraAuthCds.getCurrentCdsUser();
      if (cdsUser) {
        console.log('🔄 Enriching user data from CDS context');
        // Merge CDS context data with XSSEC data
        user.attributes = {
          ...user.attributes,
          ...cdsUser.attributes,
          cdsContext: true
        };
      }

      console.log('✅ CDS user authenticated:', user.id);
      return user;
    } catch (error) {
      console.error('❌ CDS token authentication failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  public async authorizeUser(user: CdsUser, request: HonoRequest): Promise<boolean> {
    console.log('🔐 MastraAuthCds authorizeUser');
    if (!user) {
      return false;
    }

    // Basic authorization - user must have a valid logonName
    if (!user.logonName || !user.id) {
      console.log('❌ User missing required fields for authorization');
      return false;
    }

    // You can add custom authorization logic here based on:
    // - user.roles (if available)
    // - user.tenant
    // - request path/method
    // - custom business logic

    console.log('✅ CDS user authorized:', user.id);
    return true;
  }

  // Helper method to get current user from CDS context (if available)
  static getCurrentCdsUser(): CdsUser | null {
    try {
      // Try to get user from CDS context
      const context = cds.context as any;
      if (context?.user) {
        return {
          id: context.user.id || 'unknown',
          name: context.user.name || 'Unknown User',
          email: context.user.email,
          logonName: context.user.id || 'unknown',
          attributes: context.user.attr || {}
        };
      }
      return null;
    } catch (error) {
      console.warn('Could not get current CDS user:', error);
      return null;
    }
  }
}

export const cdsAuthProvider = new MastraAuthCds();