import { globalSetup } from "@mastra/evals";

export default function setup() {
  console.log('🔧 Setting up Mastra evals global configuration...');
  
  try {
    globalSetup();
    console.log('✅ Mastra evals global setup completed');
  } catch (error) {
    console.warn('⚠️ Mastra evals global setup failed:', error.message);
    console.log('📝 Tests will run in mock mode');
  }
}
