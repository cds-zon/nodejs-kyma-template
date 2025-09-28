/**
 * Mock Authentication Provider
 * 
 * Uses predefined mock users for testing specific scenarios
 */

import { MastraAuthProvider, CDSUser, User } from "./interfaces";

interface MockUserData {
  id: string;
  name?: string;
  email?: string;
  roles?: string[];
  tenant?: string;
  attr?: Record<string, any>;
}

export class MockProvider implements MastraAuthProvider {
  private mockUsers: Record<string, MockUserData>;

  constructor(mockUsers?: Record<string, MockUserData>) {
    this.mockUsers = mockUsers || {
      'alice': {
        id: 'alice',
        name: 'Alice Smith',
        email: 'alice@example.com',
        roles: ['authenticated', 'user'],
        tenant: 'tenant-1',
        attr: {
          given_name: 'Alice',
          family_name: 'Smith',
          department: 'Engineering'
        }
      },
      'bob': {
        id: 'bob',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        roles: ['authenticated', 'admin'],
        tenant: 'tenant-2',
        attr: {
          given_name: 'Bob',
          family_name: 'Johnson',
          department: 'Management'
        }
      },
      'charlie': {
        id: 'charlie',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        roles: ['authenticated', 'viewer'],
        tenant: 'tenant-1',
        attr: {
          given_name: 'Charlie',
          family_name: 'Brown',
          department: 'Support'
        }
      }
    };
  }

  async authenticateToken(token: string): Promise<CDSUser | null> {
    if (!token) {
      return null;
    }

    try {
      console.log('🔐 Mock Provider - Authenticating token');
      
      // Extract username from token (expecting format: "mock:username" or just "username")
      const username = token.startsWith('mock:') ? token.substring(5) : token;
      
      const userData = this.mockUsers[username];
      if (!userData) {
        console.warn('🔐 Mock Provider - User not found:', username);
        return null;
      }

      const user = new User({
        id: userData.id,
        roles: userData.roles || ['authenticated'],
        tenant: userData.tenant || 'default',
        attr: {
          name: userData.name || userData.id,
          email: userData.email || `${userData.id}@example.com`,
          ...userData.attr
        },
        authInfo: {
          provider: 'mock',
          username
        }
      });

      console.log('🔐 Mock Provider - User authenticated:', user.id);
      return user;

    } catch (error) {
      console.warn('🔐 Mock Provider - Authentication failed:', error.message);
      return null;
    }
  }

  async authorizeUser(user: CDSUser): Promise<boolean> {
    // Simple authorization - if user exists and has authenticated role
    const authorized = user != null && user.roles?.includes('authenticated');
    console.log('🔐 Mock Provider - User authorized:', user?.id, authorized);
    return authorized;
  }

  // Helper method to add/update mock users
  addMockUser(username: string, userData: MockUserData): void {
    this.mockUsers[username] = userData;
  }

  // Helper method to get all mock users
  getMockUsers(): Record<string, MockUserData> {
    return { ...this.mockUsers };
  }
}

const mockProvider = new MockProvider();

export default mockProvider;