/**
 * Mock Authentication Provider
 * 
 * Uses predefined mock users for testing.
 * Reads from CDS configuration.
 */
import type { HonoRequest } from 'hono';
import cds from '@sap/cds';
import type { AuthProvider } from '../types.js';

interface MockUser {
  id: string;
  password?: string;
  roles?: string[];
  attr?: Record<string, any>;
}

export class MockAuthProvider implements AuthProvider<cds.User> {
  wwwAuthenticate = 'Basic realm="Users"';
  private users: Map<string, MockUser>;

  constructor() {
    // Load mock users from CDS configuration
    this.users = new Map();
    this.loadMockUsers();
  }

  private loadMockUsers() {
    try {
      const mockUsers = cds.env?.requires?.auth?.users || {
        alice: {
          id: 'alice',
          roles: ['admin'],
          attr: {
            name: 'Alice',
            email: 'alice@example.com',
            phone: '1234567890',
            address: '123 Main St, Anytown, USA'
          }
        },
        bob: {
          id: 'bob',
          roles: ['user'],
          attr: {
            name: 'Bob',
            email: 'bob@example.com'
          }
        }
      };

      for (const [username, userData] of Object.entries(mockUsers)) {
        const user = userData as MockUser;
        // Ensure id is set if not provided
        if (!user.id) {
          user.id = username;
        }
        this.users.set(username, user);
      }

      console.debug(`🔐 Mock Auth - Loaded ${this.users.size} mock users`);
    } catch (error) {
      console.error('🔐 Mock Auth - Error loading mock users:', error);
    }
  }

  async authenticateToken(token: string, request: HonoRequest): Promise<cds.User | null> {
    if (!token || token === 'anonymous') {
      return null;
    }

    try {
      // Basic auth: decode base64 token
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');
      
      if (!username) {
        return null;
      }

      const mockUser = this.users.get(username);
      if (!mockUser) {
        console.debug(`🔐 Mock Auth - User not found: ${username}`);
        return null;
      }

      // Check password if configured
      if (mockUser.password && mockUser.password !== password) {
        console.debug(`🔐 Mock Auth - Invalid password for user: ${username}`);
        return null;
      }

      const user = new cds.User({
        id: mockUser.id,
        roles: mockUser.roles || [],
        attr: mockUser.attr || {},
      });

      console.debug(`🔐 Mock Auth - Authenticated user: ${username}`);
      return user;
    } catch (error) {
      console.error('🔐 Mock Auth - Error decoding token:', error);
      return null;
    }
  }

  async authorizeUser(user: cds.User, request: HonoRequest): Promise<boolean> {
    // Mock provider authorizes all authenticated users
    return !!user?.id;
  }

  /**
   * Add a mock user programmatically
   */
  addMockUser(username: string, userData: Omit<MockUser, 'id'>) {
    this.users.set(username, { id: username, ...userData });
  }

  /**
   * Get all mock users
   */
  getMockUsers(): string[] {
    return Array.from(this.users.keys());
  }
}

export default new MockAuthProvider();
