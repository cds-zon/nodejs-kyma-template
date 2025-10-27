/**
 * Test Mock Authentication Provider
 */
import { Hono } from 'hono';
import { createAuthMiddleware, mockProvider } from '../src/index.js';

async function testMockAuth() {
  console.log('\n🧪 Testing Mock Authentication Provider\n');

  const app = new Hono();

  // Apply auth middleware
  app.use('*', createAuthMiddleware({
    provider: mockProvider,
    publicRoutes: ['/health'],
    debug: true,
  }));

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/me', (c) => {
    const user = c.get('user');
    return c.json({ 
      user: user.id, 
      claims: user.attr,
      roles: user.roles,
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

  // Test 3: Mock user alice (admin)
  console.log('Test 3: Mock user alice (admin)');
  try {
    const token = Buffer.from('alice:').toString('base64');
    const req3 = new Request('http://localhost/api/me', {
      headers: {
        'Authorization': `Basic ${token}`,
      },
    });
    const res3 = await app.fetch(req3);
    const data = await res3.json();
    console.log(`${res3.status === 200 ? '✅' : '❌'} Status: ${res3.status}`);
    console.log(`   User: ${data.user}`);
    console.log(`   Email: ${data.claims?.email}`);
    console.log(`   Phone: ${data.claims?.phone}\n`);
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  // Test 4: Mock user bob (user)
  console.log('Test 4: Mock user bob (user)');
  try {
    const token = Buffer.from('bob:').toString('base64');
    const req4 = new Request('http://localhost/api/me', {
      headers: {
        'Authorization': `Basic ${token}`,
      },
    });
    const res4 = await app.fetch(req4);
    const data = await res4.json();
    console.log(`${res4.status === 200 ? '✅' : '❌'} Status: ${res4.status}`);
    console.log(`   User: ${data.user}`);
    console.log(`   Email: ${data.claims?.email}\n`);
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }

  // Test 5: Unknown user (should fail)
  console.log('Test 5: Unknown user (should fail)');
  try {
    const token = Buffer.from('charlie:').toString('base64');
    const req5 = new Request('http://localhost/api/me', {
      headers: {
        'Authorization': `Basic ${token}`,
      },
    });
    const res5 = await app.fetch(req5);
    console.log(`${res5.status === 401 ? '✅' : '❌'} Status: ${res5.status}`);
    console.log(`   Response: ${JSON.stringify(await res5.json())}\n`);
  } catch (error) {
    console.error('❌ Test 5 failed:', error);
  }

  console.log('✅ Mock authentication tests completed\n');
}

// Run tests
testMockAuth().catch(console.error);
