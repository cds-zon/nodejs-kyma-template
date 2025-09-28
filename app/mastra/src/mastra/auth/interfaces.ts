/**
 * Common authentication interfaces aligned with Mastra and CDS
 */

import cds from "@sap/cds";

// Use CDS User type directly

// Mastra Authentication provider interface
export interface MastraAuthProvider {
  authenticateToken(token: string): Promise<CDSUser | null>;
  authorizeUser(user: CDSUser): Promise<boolean>;
}

    
  // Simple CDS User implementation
 export class CDSUser extends cds.User {
   
    authInfo?: any;
  
    constructor(data:any) {
      super(data);
      this.authInfo = "authInfo" in data ? data.authInfo : undefined;
    }
}
   