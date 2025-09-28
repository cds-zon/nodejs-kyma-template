/**
 * Direct CDS Authentication Implementation
 * 
 * This implements CDS auth logic directly without importing CDS middleware,
 * supporting IAS and mock strategies based on CDS configuration.
 */

import cds from "@sap/cds";
import { IdentityService, SecurityContext } from "@sap/xssec";
import { IdentityServiceCredentials, ServiceCredentials } from "@sap/xssec/types/service/IdentityService";
import { CDSUser } from "./interfaces";
// CDS User interface (simplified)


export class CDSDirectAuth {
  private authService?: IdentityService;
  private credentials?: any;

  constructor(authConfig: typeof cds.requires.auth = cds.requires.auth) {
    this.credentials = authConfig.credentials;
        this.authService = new IdentityService(this.credentials);
        console.log('✅ IAS Auth Service initialized');
   
  }

  /**
   * Authenticate a token and return a CDS User
   */
  public async authenticateToken(token: string): Promise<CDSUser | null> {
    const securityContext = await this.authService!.createSecurityContext(token);
    const tokenInfo = securityContext.token;
    const payload = tokenInfo.getPayload();

    const roles: string[] = getRoles(securityContext, this.credentials); 

    return new User({
      id: payload.sub || 'unknown',
      attr:payload,
      roles,
      tenant: securityContext.token.appTid
      authInfo: securityContext
    }); 

  }

  /**
   * Authorize a user (always returns true for now)
   */
  public async authorizeUser(user: CDSUser): Promise<boolean> {
    return user != null;
  }
  
 
 
}

export const iasAuth=new CDSDirectAuth();

export default iasAuth;
 
function getRoles({token}:SecurityContext<any, any>, credentials:ServiceCredentials) {
  const payload = token.getPayload();
  const roles: string[] = payload.scope ? Array.isArray(payload.scope) ? payload.scope : payload.scope.split(' ') : [];
  if (Array.isArray(payload.ias_apis)) {
    roles.push(...payload.ias_apis);
  } 
  // Check if it's a client credentials token
  const clientid = token.getClientId();
  if (clientid === credentials?.clientid) {
    roles.push('internal-user');
  }
  if (Array.isArray(payload.ias_apis)) {
    roles.push(...payload.ias_apis);
  }

  if (clientid === payload.sub) {
    // System user (client credentials or x509)
    roles.push('system-user');
  }
  return roles;
}