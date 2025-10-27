/**
 * Dummy Authentication Provider
 * 
 * Simple authentication that accepts any credentials.
 * For development/testing purposes only.
 */
import type { HonoRequest } from 'hono';
import cds from '@sap/cds';
import type { AuthProvider } from '../types.js';

export class DummyAuthProvider implements AuthProvider<cds.User> {
  wwwAuthenticate = 'Basic realm="Users"';

  async authenticateToken(token: string, request: HonoRequest): Promise<cds.User | null> {
    if (!token || token === 'anonymous') {
      return null;
    }

    // Basic auth: decode base64 token
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [username] = decoded.split(':');
      
      if (!username) {
        return null;
      }

      const user = new cds.User({
        id: username,
        attr: {
          name: username.charAt(0).toUpperCase() + username.slice(1),
        },
      });

      console.debug(`🔐 Dummy Auth - Authenticated user: ${username}`);
      return user;
    } catch (error) {
      console.error('🔐 Dummy Auth - Error decoding token:', error);
      return null;
    }
  }

  async authorizeUser(user: cds.User, request: HonoRequest): Promise<boolean> {
    // Dummy provider authorizes all authenticated users
    return !!user?.id;
  }
}

export default new DummyAuthProvider();
