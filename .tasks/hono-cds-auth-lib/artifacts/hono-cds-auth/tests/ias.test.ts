/**
 * Test IAS Authentication Provider
 * 
 * This test requires valid IAS credentials and a real JWT token.
 * See token-service.js for token acquisition example.
 */
import { Hono } from 'hono';
import { createAuthMiddleware, iasProvider } from '../src/index.js';

async function testIASAuth() {
  console.log('\n🧪 Testing IAS Authentication Provider\n');

  // Check if we have a token from environment
  const token = process.env.IAS_TOKEN;

  if (!token) {
    console.log('⚠️  No IAS_TOKEN environment variable set');
    console.log('   To test IAS authentication:');
    console.log('   1. Obtain a JWT token using token-service.js');
    console.log('   2. Set IAS_TOKEN environment variable');
    console.log('   3. Run: IAS_TOKEN="your-token" npm run test:ias\n');
    return;
  }

  const app = new Hono();

  // Apply auth middleware
  app.use('*', createAuthMiddleware({
    provider: iasProvider,
    publicRoutes: ['/health'],
    debug: true,
  }));

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/me', (c) => {
    const user = c.get('user');
    return c.json({
      user: user.id,
      claims: user.attr,
      tenant: user.tenant,
    });
  });

  // Test 1: Public endpoint (no auth)
  console.log('Test 1: Public endpoint (no auth)');
  try {
    const req1 = new Request('http://localhost/health');
    const res1 = await app.fetch(req1);
    console.log(`✅ Status: ${res1.status}`);
    console.log(`   Response: ${JSON.stringify(await res1.json())}\n`);
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Protected endpoint without auth (should fail)
  console.log('Test 2: Protected endpoint without auth (should fail)');
  try {
    const req2 = new Request('http://localhost/api/me');
    const res2 = await app.fetch(req2);
    console.log(`${res2.status === 401 ? '✅' : '❌'} Status: ${res2.status}`);
    console.log(`   Response: ${JSON.stringify(await res2.json())}\n`);
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test 3: Protected endpoint with valid JWT token
  console.log('Test 3: Protected endpoint with valid JWT token');
  try {
    const req3 = new Request('http://localhost/api/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const res3 = await app.fetch(req3);
    const data = await res3.json();
    console.log(`${res3.status === 200 ? '✅' : '❌'} Status: ${res3.status}`);
    
    if (res3.status === 200) {
      console.log(`   User: ${data.user}`);
      console.log(`   Email: ${data.claims?.email || 'N/A'}`);
      console.log(`   Tenant: ${data.tenant || 'N/A'}\n`);
    } else {
      console.log(`   Response: ${JSON.stringify(data)}\n`);
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  // Test 4: Invalid token (should fail)
  console.log('Test 4: Invalid JWT token (should fail)');
  try {
    const req4 = new Request('http://localhost/api/me', {
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });
    const res4 = await app.fetch(req4);
    console.log(`${res4.status === 401 ? '✅' : '❌'} Status: ${res4.status}`);
    console.log(`   Response: ${JSON.stringify(await res4.json())}\n`);
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }

  console.log('✅ IAS authentication tests completed\n');
}

// Run tests
testIASAuth().catch(console.error);
