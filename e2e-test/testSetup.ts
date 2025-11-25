import { beforeAll, afterAll } from "vitest";
import { attachListeners } from "@mastra/evals";
import { TokenService } from "./token-service.js";

// Initialize token service for authentication
const tokenService = new TokenService({
  apiUrl: process.env.APPROUTER_URL || 'https://developer-agent-approuter-devspace.c-127c9ef.stage.kyma.ondemand.com'
});

beforeAll(async () => {
  console.log('🔧 Setting up Mastra evals test environment...');
  
  try {
    // Attach Mastra evals listeners
    await attachListeners();
    console.log('✅ Mastra evals listeners attached');
    
    // Test authentication
    console.log('🔐 Testing authentication setup...');
    try {
      await tokenService.getToken('mastra-api');
      console.log('✅ Authentication test successful');
    } catch (error) {
      console.warn('⚠️ Authentication test failed:', error.message);
      console.log('📝 Tests will run in mock mode');
    }
    
  } catch (error) {
    console.warn('⚠️ Mastra evals setup failed:', error.message);
    console.log('📝 Continuing with basic test setup');
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  // Add any cleanup logic here if needed
});
