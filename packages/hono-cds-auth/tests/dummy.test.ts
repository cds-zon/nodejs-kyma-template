/**
 * Test Dummy Authentication Provider
 */
import { Hono } from 'hono';
import { createAuthMiddleware, dummyProvider } from '../src/index.js';

async function testDummyAuth() {
  console.log('\n🧪 Testing Dummy Authentication Provider\n');

  const app = new Hono();

  // Apply auth middleware
  app.use('*', createAuthMiddleware({
    provider: dummyProvider,
    publicRoutes: ['/health'],
    debug: true,
  }));

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/me', (c) => {
    const user = c.get('user');
    return c.json({ user: user.id, claims: user.attr });
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

  // Test 3: Protected endpoint with valid auth
  console.log('Test 3: Protected endpoint with valid Basic auth');
  try {
    const token = Buffer.from('alice:password').toString('base64');
    const req3 = new Request('http://localhost/api/me', {
      headers: {
        'Authorization': `Basic ${token}`,
      },
    });
    const res3 = await app.fetch(req3);
    console.log(`${res3.status === 200 ? '✅' : '❌'} Status: ${res3.status}`);
    console.log(`   Response: ${JSON.stringify(await res3.json())}\n`);
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  // Test 4: Different user
  console.log('Test 4: Different user (bob)');
  try {
    const token = Buffer.from('bob:password').toString('base64');
    const req4 = new Request('http://localhost/api/me', {
      headers: {
        'Authorization': `Basic ${token}`,
      },
    });
    const res4 = await app.fetch(req4);
    console.log(`${res4.status === 200 ? '✅' : '❌'} Status: ${res4.status}`);
    console.log(`   Response: ${JSON.stringify(await res4.json())}\n`);
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }

  console.log('✅ Dummy authentication tests completed\n');
}

// Run tests
testDummyAuth().catch(console.error);
