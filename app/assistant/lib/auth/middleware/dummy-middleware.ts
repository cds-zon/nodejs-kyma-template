/**
 * Dummy Authentication Middleware
 * Always returns a privileged user for development/testing
 */

import { NextRequest, NextResponse } from 'next/server';

interface AuthenticatedRequest extends NextRequest {
  user?: any;
  authToken?: string;
}

interface DummyUser {
  id: string;
  roles: string[];
  tenant?: string;
  attr?: Record<string, any>;
}

/**
 * Dummy Authentication Middleware
 * Always authenticates successfully with a privileged user
 */
export function withDummyAuth(handler: (req: AuthenticatedRequest) => Promise<Response>, options: any = {}) {
  const dummyUser: DummyUser = {
    id: 'anonymous',
    roles: ['any', 'authenticated', 'admin'],
    tenant: 'default',
    attr: { 
      name: 'Anonymous User',
      email: 'anonymous@example.com',
      given_name: 'Anonymous',
      family_name: 'User'
    }
  };

  // Check if we should require authentication (for testing WWW-Authenticate header)
  const requireAuth = options.requireAuth || process.env.NODE_ENV === 'production';

  return async function dummyMiddleware(req: NextRequest): Promise<Response> {
    const auth = req.headers.get('authorization');
    
    // If no auth header and auth is required, return 401 with WWW-Authenticate
    if (!auth && requireAuth) {
      console.log('🔐 Dummy Middleware - No auth header, authentication required');
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Users"'
        }
      });
    }
    
    // If no auth header and auth not required, use dummy user
    if (!auth) {
      console.log('🔐 Dummy Middleware - No auth header, using dummy user');
      (req as any).user = dummyUser;
      (req as any).authToken = 'dummy-token';
      return await handler(req as AuthenticatedRequest); // Continue
    }

    // If auth header exists, check if it's basic auth
    if (!auth.match(/^basic/i)) {
      console.log('🔐 Dummy Middleware - Non-basic auth, using dummy user');
      (req as any).user = dummyUser;
      (req as any).authToken = auth;
      return await handler(req as AuthenticatedRequest); // Continue
    }
      // Decode credentials (even though we'll ignore them)
      const credentials = Buffer.from(auth.slice(6), 'base64').toString();
      const [id, pwd] = credentials.split(':');
      
      console.log('🔐 Dummy Middleware - Credentials provided:', { id, pwd: pwd ? '***' : 'none' });
      
      // Always return the dummy user regardless of credentials
      (req as any).user = dummyUser;
      (req as any).authToken = auth;
      
      console.log('🔐 Dummy Middleware - User authenticated (dummy):', { 
        user: dummyUser.id, 
        tenant: dummyUser.tenant, 
        roles: dummyUser.roles 
      });

      return await handler(req as AuthenticatedRequest); // Continue to next middleware/handler

  };
}
