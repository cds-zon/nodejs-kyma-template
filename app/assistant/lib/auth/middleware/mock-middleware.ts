/**
 * Mock Authentication Middleware
 * Based on CDS mocked-users.js implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '../../config';

interface MockUser {
  id: string;
  password?: string;
  roles?: string[];
  tenant?: string;
  features?: any;
  attr?: Record<string, any>;
}

interface MockTenant {
  features?: any;
}

class MockedUsers {
  private tenants: Record<string, MockTenant>;
  private users: Record<string, MockUser>;

  constructor(options: any = {}) {
    this.tenants = options.tenants || {};
    this.users = options.users || {};
    
    // Initialize users similar to CDS mocked-users.js
    for (let [k, v] of Object.entries(this.users)) {
      if (!config.auth.tenant) delete (v as any).tenant;
      if (typeof v === 'boolean') continue;
      if (typeof v === 'string') v = { password: v };
      
      let id = this._configured(v as any).id || k;
      let user = this.users[id] = { id, ...(v as any) };
      let fts = this.tenants[user.tenant]?.features;
      if (fts && !user.features) user.features = fts;
    }

    // If no users configured, use defaults
    if (Object.keys(this.users).length === 0) {
      this.users = this._getDefaultUsers();
    }
  }

  /**
   * Verifies a username / password combination against configured users.
   * @returns { {id:string} | {failed:string} }
   */
  verify(id: string, pwd?: string): MockUser | { failed: string } {
    let u = this.users[id];
    if (!u) return id && this.users['*'] ? { id } : { failed: `User '${id}' not found` };
    if (u.password && pwd !== u.password) return { failed: `Wrong password for user '${id}'` };
    return u;
  }

  /**
   * Configure user properties similar to CDS mocked-users.js
   */
  private _configured(u: any): any {
    // Handle deprecated properties
    if (u.ID) {
      u.id = u.ID;
      console.warn('WARNING: Usage of "ID" in user configurations is deprecated. Use "id" instead.');
    }
    if (u.userAttributes) {
      u.attr = { ...u.attr, ...u.userAttributes };
      console.warn('WARNING: Usage of "userAttributes" in user configurations is deprecated. Use "attr" instead.');
    }
    if (u.jwt) {
      if (u.jwt.zid) {
        u.tenant = u.jwt.zid;
      }
      if (u.jwt.attributes) {
        u.attr = { ...u.attr, ...u.jwt.attributes };
      }
      if (u.jwt.userInfo) {
        u.attr = { ...u.attr, ...u.jwt.userInfo };
      }
      if (u.jwt.scope || u.jwt.scopes) {
        const scopes = u.jwt.scope || u.jwt.scopes;
        const { aud } = u.jwt;
        let roles = Array.isArray(scopes) ? scopes : scopes.split(' ');
        if (aud) {
          roles = roles.map((s: string) => {
            for (const each of aud) s = s.replace(`${each}.`, '');
            return s;
          });
        }
        u.roles = [...(u.roles || []), ...roles];
      }
    }
    return u;
  }

  /**
   * Get default users if none configured
   */
  private _getDefaultUsers(): Record<string, MockUser> {
    return {
      'alice': {
        id: 'alice',
        roles: ['authenticated-user', 'admin'],
        tenant: 't1',
        attr: {
          name: 'Alice',
          email: 'alice@example.com',
          phone: '1234567890',
          address: '123 Main St, Anytown, USA'
        }
      },
      'bob': {
        id: 'bob',
        roles: ['authenticated-user'],
        tenant: 't2',
        attr: {
          name: 'Bob',
          email: 'bob@example.com'
        }
      }
    };
  }
}

/**
 * Mock Authentication Middleware
 * Based on CDS basic_auth implementation
 */
export function withMockAuth(handler: (req: AuthenticatedRequest) => Promise<Response>, options: any = {}) {
  const users = new MockedUsers(options);
  const loginRequired = true; // Always require authentication

  return async function mockMiddleware(req: NextRequest): Promise<Response> {
    const auth = req.headers.get('authorization');
    console.log("Mock Middleware")

    // Enforce login if requested
    if (!auth?.match(/^basic/i)) {
      if (loginRequired) {
        console.log("Mock Middleware: Unauthorized - login required");
        return new NextResponse('Unauthorized', { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Users"'
          }
        });
      }
      console.log("Mock Middleware: No auth, continuing without auth");
      return await handler(req as AuthenticatedRequest); // Continue without auth
    }
      // Decode user credentials from authorization header
      const credentials = Buffer.from(auth.slice(6), 'base64').toString();
      const [id, pwd] = credentials.split(':');
      
      // Verify user credentials
      const user = users.verify(id, pwd);
      
      // Re-request login in case of wrong credentials
      if ('failed' in user) {
        console.log('🔐 Mock Middleware - Authentication failed:', user.failed);
        return new NextResponse('Unauthorized', { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Users"'
          }
        });
      }

      // User authenticated - set user in request context
      req.user = user;
      req.authToken = auth; // Store the full auth header
      
      console.log('🔐 Mock Middleware - User authenticated:', { 
        user: user.id, 
        tenant: user.tenant, 
        roles: user.roles 
      });

      return await handler(req as AuthenticatedRequest); // Continue to next middleware/handler

  };
}
