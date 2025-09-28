/**
 * Common authentication interfaces aligned with Mastra and CDS
 */

import cds from "@sap/cds";
import type { Service,Token } from "@sap/xssec";
import { SecurityContext } from "@sap/xssec";

// Use CDS User type directly

// Mastra Authentication provider interface
export interface MastraAuthProvider {
  authenticateToken(token: string): Promise<CDSUser | null>;
  authorizeUser(user: CDSUser): Promise<boolean>;
}

 
    
  // Simple CDS User implementation
 export class CDSUser<S extends Service= Service,T extends Token= Token> extends cds.User {
   
    authInfo?: SecurityContext<S,T>;
  
    constructor(data:ConstructorParameters<typeof cds.User>[0] & { authInfo?: SecurityContext<S,T> }) {
      super(data);
      this.authInfo = "authInfo" in data ? data.authInfo : undefined;
    }
}
   