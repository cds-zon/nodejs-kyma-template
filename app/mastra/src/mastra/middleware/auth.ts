import { createMiddleware } from "hono/factory";
import { IdentityService, SecurityContext } from "@sap/xssec";
import cds from "@sap/cds";

// Type definitions for Hono context
type Env = {
  Variables: {
    securityContext: SecurityContext<any, any>;
    user: any;
  };
};

// Initialize auth service based on CDS environment
let authService: IdentityService | null = initializeAuthService();

function initializeAuthService() {
  const authConfig = cds.env.requires.auth;

  if (authConfig && authConfig.credentials) {
    console.log("🔐 Initializing XSSEC Auth Service...");
    return new IdentityService(authConfig.credentials);
  } else {
    console.log("⚠️  No auth credentials found, using mock auth");
    throw new Error("No auth credentials found");
  }
}

// Create security context from request
async function createSecurityContext(
  identityService: IdentityService,
  request: any
): Promise<SecurityContext<any, any> | null> {
  try {
    // Extract JWT token from Authorization header
    const authHeader =
      request.headers?.authorization || request.headers?.Authorization;

    if (!authHeader) {
      console.log("No authorization header found");
      return null;
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      console.log("No token found in authorization header");
      return null;
    }

    // Create security context using XSSEC
    const securityContext = await identityService.createSecurityContext(token);
    console.log(
      "✅ Security context created for user:",
      securityContext.getLogonName()
    );

    return securityContext;
  } catch (error) {
    console.error("❌ Failed to create security context:", error);
    return null;
  }
}

// Auth middleware implementation
const authMiddleware = createMiddleware<Env>(async (c, next) => {
  console.log("🔍 Processing auth middleware for:", c.req.method, c.req.url);

  try {
    // Try to create security context from request
    const securityContext = await createSecurityContext(authService, {
      headers: Object.fromEntries(c.req.raw.headers),
    });

    console.log("securityContext", securityContext);

    if (securityContext) {
      c.set("securityContext", securityContext);

      // Extract user information from security context
      const user = {
        id: securityContext.getLogonName(),
        name:
          securityContext.getGivenName() +
          " " +
          securityContext.getFamilyName(),
        email: securityContext.getEmail(),
        //   roles: securityContext.getRoleCollections(),
        //   tenant: securityContext.getZoneId(),
        //   attributes: {
        //     name: securityContext.getGivenName() + ' ' + securityContext.getFamilyName(),
        //     email: securityContext.getEmail(),
        //     logonName: securityContext.getLogonName(),
        //     zoneId: securityContext.getZoneId()
        //   }
      };
      c.set("user", user);
      c.res.headers.set("X-User-Id", user.id);

      console.log("✅ Authenticated user:", user.id);
    }
  } catch (error) {
    console.warn(
      "⚠️  Auth failed:",
      error instanceof Error ? error.message : String(error)
    );
    return c.json(
      { error: "Unauthorized", message: "Authentication required" },
      401
    );
  }

  await next();
});

export default authMiddleware;
