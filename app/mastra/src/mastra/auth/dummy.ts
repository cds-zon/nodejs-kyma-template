/**
 * Dummy Authentication Provider
 * 
 * Always returns a privileged user for development/testing
 */

import { MastraAuthProvider, CDSUser } from "./interfaces";
import cds from "@sap/cds";

export class DummyProvider implements MastraAuthProvider {
  private dummyUser: CDSUser;

  constructor() {
    this.dummyUser = new CDSUser({
      id: 'anonymous',
      roles: ['any', 'authenticated', 'admin'],
      tenant: 'default',
      attr: { 
        name: 'Anonymous User',
        email: 'anonymous@example.com',
        given_name: 'Anonymous',
        family_name: 'User'
      } 
    });
  }

  async authenticateToken(token: string): Promise<CDSUser | null> {
    console.log('🔐 Dummy Provider - Always returning privileged user');
    return this.dummyUser;
  }

  async authorizeUser(user: CDSUser): Promise<boolean> {
    console.log('🔐 Dummy Provider - User always authorized:', user?.id);
    return true; // Always authorize
  }
}

const dummyProvider = new DummyProvider();

export default dummyProvider;