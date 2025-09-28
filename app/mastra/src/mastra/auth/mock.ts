/**
 * Mock Authentication Provider
 * 
 * Uses CDS configuration mock users for testing, similar to CDS mocked-users.js
 */

import { MastraAuthProvider, CDSUser } from "./interfaces";
import cds from "@sap/cds";

export class MockProvider implements MastraAuthProvider {
  private users: Record<string, cds.User>;
  private tenants: Record<string, any>;

  constructor(options?: any) {
    // Use CDS auth configuration if available
    const authConfig = options || cds.requires?.auth || {};
    this.tenants = authConfig.tenants || {};
    const configuredUsers = authConfig.users || {};

    // Initialize users similar to CDS mocked-users.js
    this.users = {};
    for (let [k, v] of Object.entries(configuredUsers)) {
      if (!cds.env.requires.multitenancy) delete (v as any).tenant;
      if (typeof v === 'boolean') continue;
      if (typeof v === 'string') v = { password: v };
      
      let id = this._configured(v as any).id || k;
      let user = this.users[id] = new cds.User({ id, ...v });
      let fts = this.tenants[user.tenant]?.features;
      if (fts && !(user as any).features) (user as any).features = fts;
    }

    // If no users configured, use defaults
    if (Object.keys(this.users).length === 0) {
      this.users = this._getDefaultUsers();
    }
  }

  async authenticateToken(token: string): Promise<CDSUser | null> {
    if (!token) {
      return null;
    }

    try {
      console.log('🔐 Mock Provider - Authenticating token');
      
      // Extract username from token (expecting format: "mock:username" or just "username")
      const username = token.startsWith('mock:') ? token.substring(5) : token;
      
      // Use verify method similar to CDS mocked-users.js
      const result = this.verify(username);
      if ('failed' in result) {
        console.warn('🔐 Mock Provider -', result.failed);
        return null;
      }

      console.log('🔐 Mock Provider - User authenticated:', result.id);
      return result as CDSUser;

    } catch (error: any) {
      console.warn('🔐 Mock Provider - Authentication failed:', error?.message || error);
      return null;
    }
  }

  async authorizeUser(user: CDSUser): Promise<boolean> {
    // Simple authorization - if user exists
    const authorized = user != null;
    console.log('🔐 Mock Provider - User authorized:', user?.id, authorized);
    return authorized;
  }

  /**
   * Verifies a username against configured users (similar to CDS mocked-users.js)
   * @returns { {id:string} | {failed:string} }
   */
  verify(id: string): { id: string; [key: string]: any } | { failed: string } {
    let u = this.users[id];
    if (!u) return id && this.users['*'] ? { id } : { failed: `User '${id}' not found` };
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
  private _getDefaultUsers(): Record<string, cds.User> {
    return {
      'alice': new cds.User({
        id: 'alice',
        password: 'alice',
        roles: ['authenticated-user', 'admin'],
        tenant: 't1',
        attr: {
          name: 'Alice',
          email: 'alice@example.com',
          phone: '1234567890',
          address: '123 Main St, Anytown, USA'
        }
      }),
      'bob': new cds.User({
        id: 'bob',
        password: 'bob',
        roles: ['authenticated-user'],
        tenant: 't2',
        attr: {
          name: 'Bob',
          email: 'bob@example.com'
        }
      }),
      '*': new cds.User({ id: '*' }) // Allow any user
    };
  }
}

const mockProvider = new MockProvider();

export default mockProvider;




////* original code
/*
const cds = require ('../../../index.js'), { User } = cds
const LOG = cds.log('auth')

class MockedUsers {

  constructor (options) {
    const tenants = this.tenants = options.tenants || {}
    const users = this.users = options.users || {}
    for (let [k,v] of Object.entries(users)) {
      if (!cds.env.requires.multitenancy) delete v.tenant
      if (typeof v === 'boolean') continue
      if (typeof v === 'string') v = { password:v }
      let id = _configured(v).id || k
      let u = users[id] = new User ({ id, ...v })
      let fts = tenants[u.tenant]?.features
      if (fts && !u.features) u.features = fts
    }
  }

 
  verify (id, pwd) {
    let u = this.users[id]
    if (!u) return id && this.users['*'] ? { id } : { failed: `User '${id}' not found` }
    if (u.password && pwd !== u.password) return { failed: `Wrong password for user '${id}'` }
    return u
  }
}

const _configured = (u,x) => {
  if ((x = _deprecated (u.ID, 'ID','id'))) {
    u.id = x
  }
  if ((x = _deprecated (u.userAttributes, 'userAttributes','attr'))) {
    u.attr = { ...u.attr, ...x }
  }
  if (u.jwt) {
    if ((x = _deprecated (u.jwt.zid, 'jwt.zid','tenant'))) {
      u.tenant = u.jwt.zid
    }
    if ((x = _deprecated (u.jwt.attributes, 'jwt.attributes','attr'))) {
      u.attr = { ...u.attr, ...x }
    }
    if ((x = _deprecated (u.jwt.userInfo, 'jwt.attributes','attr'))) {
      u.attr = { ...u.attr, ...x }
    }
    if ((x = _deprecated (u.jwt.scope || u.jwt.scopes, 'jwt.scopes','roles'))) {
      const {aud} = u.jwt; if (aud) x = x.map (s => {
        for (const each of aud) s = s.replace(`${each}.`, '')
        return s
      })
      u.roles = [ ...u.roles||[], ...x ]
    }
  }
  return u
}

const _deprecated = (v,x,y) => {
  if (!v || x in _deprecated) return v
  else LOG.warn(`WARNING: \n
    Usage of '${x}' in user configurations is deprecated and won't be
    supported in future releases. → Please use property '${y}' instead.
  `)
  return _deprecated[x] = v
}


// allows calling with or without new
module.exports = function(o) { return new MockedUsers(o) }

*/