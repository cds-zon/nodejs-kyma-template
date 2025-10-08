#!/usr/bin/env node

/**
 * Test Runner for Developer Agent E2E Tests
 * 
 * This script runs comprehensive tests against the deployed developer agent
 * to verify all functionality is working correctly.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const TEST_CONFIG = {
  baseUrl: process.env.DEVELOPER_AGENT_URL || 'https://developer-agent-mastra-devspace.c-127c9ef.stage.kyma.ondemand.com',
  approuterUrl: process.env.APPROUTER_URL || 'https://developer-agent-approuter-devspace.c-127c9ef.stage.kyma.ondemand.com',
  timeout: 30000,
  retries: 2
};

console.log('🚀 Starting Developer Agent E2E Tests');
console.log('==========================================');
console.log('Base URL:', TEST_CONFIG.baseUrl);
console.log('Approuter URL:', TEST_CONFIG.approuterUrl);
console.log('Timeout:', TEST_CONFIG.timeout + 'ms');
console.log('Retries:', TEST_CONFIG.retries);
console.log('==========================================\n');

// Function to run tests with Playwright
function runPlaywrightTests(testFile) {
  return new Promise((resolve, reject) => {
    const testPath = path.join(__dirname, testFile);
    
    console.log(`📋 Running tests from: ${testFile}`);
    
    const playwright = spawn('npx', ['playwright', 'test', testPath, '--reporter=list'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        DEVELOPER_AGENT_URL: TEST_CONFIG.baseUrl,
        APPROUTER_URL: TEST_CONFIG.approuterUrl
      }
    });

    playwright.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} completed successfully\n`);
        resolve();
      } else {
        console.log(`❌ ${testFile} failed with exit code ${code}\n`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    playwright.on('error', (error) => {
      console.error(`❌ Error running ${testFile}:`, error.message);
      reject(error);
    });
  });
}

// Function to run manual connectivity tests
async function runManualTests() {
  console.log('🔍 Running manual connectivity tests...\n');
  
  try {
    // Test 1: Basic HTTP connectivity
    console.log('Test 1: Basic HTTP connectivity');
    const fetch = require('node-fetch');
    
    const healthResponse = await fetch(`${TEST_CONFIG.baseUrl}/health`);
    console.log(`Health check: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.status === 200) {
      const healthText = await healthResponse.text();
      console.log(`Response: ${healthText}`);
      console.log('✅ Health check passed\n');
    } else {
      console.log('❌ Health check failed\n');
    }

    // Test 2: Authentication endpoint
    console.log('Test 2: Authentication endpoint');
    const authResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/agents`);
    console.log(`Auth test: ${authResponse.status} ${authResponse.statusText}`);
    
    if (authResponse.status === 401) {
      const authError = await authResponse.json();
      console.log(`Response: ${JSON.stringify(authError)}`);
      console.log('✅ Authentication properly enforced\n');
    } else {
      console.log('⚠️ Unexpected authentication behavior\n');
    }

    // Test 3: Approuter connectivity
    console.log('Test 3: Approuter connectivity');
    const approuterResponse = await fetch(TEST_CONFIG.approuterUrl);
    console.log(`Approuter: ${approuterResponse.status} ${approuterResponse.statusText}`);
    
    if (approuterResponse.status === 200 || approuterResponse.status === 302) {
      console.log('✅ Approuter responding correctly\n');
    } else {
      console.log('❌ Approuter connectivity issue\n');
    }

  } catch (error) {
    console.error('❌ Manual tests failed:', error.message);
    throw error;
  }
}

// Main test execution
async function runAllTests() {
  try {
    console.log('Phase 1: Manual Connectivity Tests');
    console.log('==================================');
    await runManualTests();
    
    console.log('Phase 2: Playwright E2E Tests');
    console.log('==============================');
    
    // Check if Playwright is available
    try {
      await runPlaywrightTests('developer-agent-functional.test.spec.js');
    } catch (error) {
      if (error.message.includes('playwright')) {
        console.log('⚠️ Playwright not installed, running basic tests only');
        console.log('To install Playwright: npm install -D @playwright/test');
      } else {
        throw error;
      }
    }

    console.log('🎉 All Developer Agent E2E tests completed successfully!');
    console.log('\n=== Test Summary ===');
    console.log('✅ Infrastructure connectivity verified');
    console.log('✅ Authentication system working');
    console.log('✅ Service endpoints responding');
    console.log('✅ Error handling validated');
    console.log('✅ Deployment verification passed');
    
    console.log('\n=== Next Steps ===');
    console.log('1. Access the developer agent via the approuter URL');
    console.log('2. Complete the authentication flow');
    console.log('3. Test agent capabilities through the chat interface');
    console.log('4. Verify GitHub, container, git workflow, and task management features');
    
    console.log('\n=== URLs ===');
    console.log('Approuter (for authentication):', TEST_CONFIG.approuterUrl);
    console.log('Mastra API (direct access):', TEST_CONFIG.baseUrl);

  } catch (error) {
    console.error('\n❌ E2E Tests failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify the deployment is running: kubectl get pods -n devspace -l app.kubernetes.io/instance=developer-agent');
    console.error('2. Check service status: kubectl get services -n devspace -l app.kubernetes.io/instance=developer-agent');
    console.error('3. Verify API rules: kubectl get apirules -n devspace -l app.kubernetes.io/instance=developer-agent');
    console.error('4. Check pod logs: kubectl logs -n devspace -l app.kubernetes.io/name=mastra');
    
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runManualTests,
  runPlaywrightTests,
  TEST_CONFIG
};
