import { createMiddleware } from "hono/factory";
import { FetchServerResponse, toReqRes } from "fetch-to-node";
import cds from "@sap/cds";
import type 
// CDS middleware for Mastra integration
// const {context, auth} = require("@sap/cds/lib/srv/middlewares/index.js");
const auth = require("@sap/cds/lib/srv/middlewares/auth/index.js");


export const cdsContextMiddleware = createMiddleware(async (c, next) => {
  console.log("🔄 CDS Context Middleware - Processing:", c.req.method, c.req.url);
  
  try {
    const corr_id = 'x-correlation-id';
    const crippled_corr_id = 'x-correlationid';
    const req_id = 'x-request-id';
    const vr_id = 'x-vcap-request-id';
    const { uuid } = cds.utils;
    
    const id = c.req.header(corr_id) || c.req.header(crippled_corr_id) || c.req.header(req_id) || c.req.header(vr_id) || uuid();
    
    // Set correlation ID header
    c.res.headers.set('X-Correlation-ID', id);
    
    // Create CDS context
    const ctx = new cds.EventContext({
      event: 'http',
      data: {},
      headers: Object.fromEntries(c.req.raw.headers),
    });
    
    c.set("cds-context", ctx);
    c.set("correlation-id", id);

    await new Promise<void>((resolve) => {
      // @ts-ignore - CDS internal API
      cds._with(ctx, resolve);
    });
  } catch (error) {
    console.warn("⚠️  CDS Context creation failed:", error);
  }
  
  await next();
}); 


// Import CDS middlewares using the exposed paths from .pnpmfile.cjs
console.log("🔄 Simple CDS Middleware - Auth Factory:", cds.requires.auth.credentials?.clientid, cds.requires.auth.credentials?.xsappname, cds.requires.auth.credentials?.url);
const authMiddleware = auth(cds.requires.auth);
// Simple CDS integration middleware that uses existing CDS middleware pipeline
export const simpleCDSMiddleware = createMiddleware(async (c, next) => {
  console.log("🔄 Simple CDS Middleware - Processing:", c.req.method, c.req.url);

  try {
    // Convert Hono request to Node.js request/response
    const { req, res } = toReqRes(c.req.raw);
   
    // Don't overwrite cds.context, let CDS manage it
    await new Promise<void>((resolve, reject) => {
      //@ts-ignore
      cds.context - cds.context ||{};
      authMiddleware(req, res, (error?: any) => {
        if (error) {
          console.error("❌ CDS Auth error:", error);
          reject(error);
        } else {
          console.log("✅ CDS Auth processed for user:", cds.context?.user?.id);
          // Set user in Hono context
          if (cds.context?.user) {
            c.set("user", cds.context.user);
            c.set("tenant", cds.context.user.tenant || 'default');
          }
          resolve();
        }
      });
    });
  } catch (error) {
    console.warn("⚠️  CDS processing failed:", error);
    // Continue without CDS context - don't block the request
  }

  await next();
});

// Utility functions for easy access to CDS context
export function getCDSUser(c: any) {
  return c.get("user") || null;
}

export function getCDSTenant(c: any) {
  const user = c.get("user");
  return c.get("tenant") || user?.tenant || 'default';
}

export function getCDSUserAttributes(c: any) {
  return c.get("userAttributes") || {};
}

export function hasRole(c: any, role: string): boolean {
  const user = c.get("user");
  return user?.roles?.includes(role) || false;
}

export function belongsToTenant(c: any, tenant: string): boolean {
  return getCDSTenant(c) === tenant;
}

export default [cdsContextMiddleware, simpleCDSMiddleware];
