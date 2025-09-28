import xssec from "@sap/xssec";
import axios from "axios";
import { TokenService } from "./token-service.js";
 
async function runTests() {
  console.log("🚀 Running XSSEC Token Service Tests\n");

  const tokenService = new TokenService( );

  try {
    // Test token acquisition
    await tokenService.getToken("user-api");
    await tokenService.getToken("mastra-api");
    // Test service calls
    await tokenService.testUserService();

    await tokenService.testmastraService();
  } catch (error) {
    console.error("❌ Error during tests:", error.message);
  }
}

// Run tests if called directly
if (import.meta.url === new URL(import.meta.url).href) {
  runTests().catch(console.error);
}

export { runTests };
