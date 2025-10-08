import { createMiddleware } from "hono/factory";
import AuthProvider from '../auth';
const authProvider = new AuthProvider();
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization'); 
  const token = authHeader?.split(' ')[1];
  if (!token) {
    console.debug('🔐 Auth Middleware - No token:', c.req.method, c.req.url);
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const user = await authProvider.authenticateToken(token || 'anonymous', c.req);
  if (!user) {
    console.debug('🔐 Auth Middleware - No user:', c.req.method, c.req.url);
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('user', user);
  c.get('runtimeContext')?.set('user', user);
  console.debug('🔐 Auth Middleware - User:', c.get('user'));
  await next();
});