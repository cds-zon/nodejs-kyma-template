import { createMiddleware } from "hono/factory";
import authProvider from '../auth';

// const authProvider = new AuthProvider();
export const authMiddleware = createMiddleware(async (c, next) => {
  // Check if this is a public route that doesn't require authentication
  const path = c.req.path;
  const publicRoutes = ['/health']; // Removed /api/telemetry as it's disabled
  
  if (publicRoutes.includes(path)) {
    console.debug('🔐 Auth Middleware - Public route, skipping auth:', c.req.method, c.req.url);
    return await next();
 }

  const authHeader = c.req.header('Authorization'); 
  const token = authHeader?.split(' ')[1];
  console.debug('🔐 Auth Middleware - Token:', token ? 'Present' : 'Absent', c.req.method, c.req.url, authProvider.wwwAuthenticateHeader());
  if (!token) {
    console.debug('🔐 Auth Middleware - No token:', c.req.method, c.req.url, authProvider.wwwAuthenticateHeader());
    c.header('WWW-Authenticate', authProvider.wwwAuthenticateHeader());
    c.res = new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': authProvider.wwwAuthenticateHeader()
      }
    });
  }
  const user = await authProvider.authenticateToken(token || 'anonymous', c.req);
  if (!user) {
    console.debug('🔐 Auth Middleware - No user:', c.req.method, c.req.url);
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': authProvider.wwwAuthenticateHeader()
      }
    });
  }
  c.set('user', user);
  c.get('runtimeContext')?.set('user', user);
  console.debug('🔐 Auth Middleware - User:', c.get('user'));
  return await next();
});