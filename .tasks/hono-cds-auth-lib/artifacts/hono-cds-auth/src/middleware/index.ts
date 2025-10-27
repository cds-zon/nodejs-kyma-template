/**
 * Hono CDS Authentication Middleware
 * 
 * Provides authentication middleware for Hono applications
 * using SAP CDS authentication providers.
 */
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { AuthProvider, AuthMiddlewareConfig } from '../types.js';

/**
 * Create authentication middleware
 * 
 * @param config - Middleware configuration
 * @returns Hono middleware function
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  const {
    publicRoutes = ['/health'],
    provider,
    debug = false,
  } = config;

  if (!provider) {
    throw new Error('Authentication provider is required');
  }

  return createMiddleware(async (c: Context, next) => {
    const path = c.req.path;
    const method = c.req.method;

    // Check if this is a public route
    if (publicRoutes.includes(path)) {
      if (debug) {
        console.debug(`🔐 Auth Middleware - Public route, skipping auth: ${method} ${path}`);
      }
      return await next();
    }

    // Extract token from Authorization header
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (debug) {
      console.debug(`🔐 Auth Middleware - Token: ${token ? 'Present' : 'Absent'}, ${method} ${path}`);
    }

    // No token provided
    if (!token) {
      if (debug) {
        console.debug(`🔐 Auth Middleware - No token: ${method} ${path}`);
      }

      const wwwAuth = provider.wwwAuthenticate || 'Basic realm="Users"';
      return c.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': wwwAuth,
          },
        }
      );
    }

    // Authenticate token
    try {
      const user = await provider.authenticateToken(token, c.req);

      if (!user) {
        if (debug) {
          console.debug(`🔐 Auth Middleware - Authentication failed: ${method} ${path}`);
        }

        const wwwAuth = provider.wwwAuthenticate || 'Basic realm="Users"';
        return c.json(
          { error: 'Unauthorized', message: 'Invalid credentials' },
          {
            status: 401,
            headers: {
              'WWW-Authenticate': wwwAuth,
            },
          }
        );
      }

      // Authorize user
      const isAuthorized = await provider.authorizeUser(user, c.req);

      if (!isAuthorized) {
        if (debug) {
          const userId = (user as any).id || (user as any)._id || 'unknown';
          console.debug(`🔐 Auth Middleware - Authorization failed for user ${userId}: ${method} ${path}`);
        }

        return c.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Set user in context
      c.set('user', user);

      if (debug) {
        const userId = (user as any).id || (user as any)._id || 'unknown';
        console.debug(`🔐 Auth Middleware - User authenticated: ${userId}`);
      }

      return await next();
    } catch (error) {
      console.error('🔐 Auth Middleware - Error:', error);
      
      const wwwAuth = provider.wwwAuthenticate || 'Basic realm="Users"';
      return c.json(
        { error: 'Unauthorized', message: 'Authentication error' },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': wwwAuth,
          },
        }
      );
    }
  });
}

/**
 * Get user from context
 */
export function getUser(c: Context) {
  return c.get('user');
}
