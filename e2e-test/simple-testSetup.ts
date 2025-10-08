import { beforeAll, afterAll } from "vitest";
import { attachListeners } from "@mastra/evals";

beforeAll(async () => {
  console.log('🔧 Setting up Mastra evals test environment...');
  
  try {
    // Attach Mastra evals listeners
    await attachListeners();
    console.log('✅ Mastra evals listeners attached');
    
  } catch (error) {
    console.warn('⚠️ Mastra evals setup failed:', error.message);
    console.log('📝 Continuing with basic test setup');
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  // Add any cleanup logic here if needed
});

