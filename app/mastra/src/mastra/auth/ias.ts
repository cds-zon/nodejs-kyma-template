/**
 * Direct CDS Authentication Implementation
 *
 * This implements CDS auth logic directly without importing CDS middleware,
 * supporting IAS and mock strategies based on CDS configuration.
 */

import cds from "@sap/cds";
import { IdentityService, SecurityContext } from "@sap/xssec";
import {
  IdentityServiceCredentials,
  ServiceCredentials,
} from "@sap/xssec/types/service/IdentityService";
import { CDSUser } from "./interfaces";
// CDS User interface (simplified)
import { bearerAuth } from "hono/bearer-auth";

export class CDSDirectAuth {
  private authService?: IdentityService;
  private credentials?: any;

  constructor(authConfig: typeof cds.requires.auth = cds.requires.auth) {
    this.credentials = authConfig.credentials;
    this.authService = new IdentityService(this.credentials);
    console.log("✅ IAS Auth Service initialized");
  }

  /**
   * Authenticate a token and return a CDS User
   */
  public async authenticateToken(token: string): Promise<CDSUser | null> {
    const securityContext = await this.authService!.createSecurityContext(
      token
    );
    const { aud, sub, ...attr } = securityContext.token.getPayload();

    const roles: string[] = getRoles(securityContext, this.credentials);

    console.log(
      "🔐 IAS Auth Service - Authenticate Token:",
      sub,
      aud,
      roles,
      attr
    );

    return new CDSUser({
      id: sub || "unknown",
      attr: omitUndefined({
        ...attr,
        aud: Array.isArray(aud) ? aud.join(",") : aud,
      }),
      roles,
      tenant: securityContext.token.appTid,
      authInfo: securityContext,
    });
  }

  /**
   * Authorize a user (always returns true for now)
   */
  public async authorizeUser(user: CDSUser): Promise<boolean> {
    console.log("🔐 IAS Auth Service - Authorize User:", user);
    return user != null;
  }
}

export const iasAuth = new CDSDirectAuth();

export const middleware = bearerAuth({
  verifyToken: async (token, c) => {
    const user = iasAuth.authenticateToken(token);
    if (user) {
      c.set("user", user);
      c.get("runtimeContext")?.set("user", user);
    }
    return !!user;
  },
});

export default iasAuth;

function getRoles(
  { token }: SecurityContext<any, any>,
  credentials: ServiceCredentials
) {
  const payload = token.getPayload();
  const roles: string[] = payload.scope
    ? Array.isArray(payload.scope)
      ? payload.scope
      : payload.scope.split(" ")
    : [];
  if (Array.isArray(payload.ias_apis)) {
    roles.push(...payload.ias_apis);
  }
  // Check if it's a client credentials token
  const clientid = token.getClientId();
  if (clientid === credentials?.clientid) {
    roles.push("internal-user");
  }
  if (Array.isArray(payload.ias_apis)) {
    roles.push(...payload.ias_apis);
  }

  if (clientid === payload.sub) {
    // System user (client credentials or x509)
    roles.push("system-user");
  }
  return roles;
}

function omitUndefined(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
}
