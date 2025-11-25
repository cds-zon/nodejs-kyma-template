/**
 * JWT Authentication Middleware
 * Validates JWT tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '../../config';

interface AuthenticatedRequest extends NextRequest {
  user?: any;
  authToken?: string;
}

interface JWTUser {
  id: string;
  name?: string;
  email?: string;
  roles?: string[];
  tenant?: string;
  attr?: Record<string, any>;
}

/**
 * JWT Authentication Middleware
 * Validates JWT tokens from Authorization header
 */
export function withJwtAuth(handler: (req: AuthenticatedRequest) => Promise<Response>, options: any = {}) {
  const jwtConfig = {
    secret: options.secret || config.auth.jwt.secret,
    issuer: options.issuer || config.auth.jwt.issuer,
    audience: options.audience || config.auth.jwt.audience,
  };

  return async function jwtMiddleware(req: NextRequest): Promise<Response> {
    const auth = req.headers.get('authorization');
    
    // Check for Bearer token
    if (!auth?.match(/^bearer/i)) {
      console.log('🔐 JWT Middleware - No Bearer token provided');
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="API"'
        }
      });
    }
      // Extract token
      const token = auth.slice(7); // Remove "Bearer "
      
      // Parse JWT payload (simplified - in production use proper JWT library)
      const payload = parseJWTPayload(token);
      
      if (!payload) {
        console.log('🔐 JWT Middleware - Invalid JWT format');
        return new NextResponse('Unauthorized', { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="API"'
          }
        });
      }

      // Validate issuer and audience if configured
      if (jwtConfig.issuer && payload.iss !== jwtConfig.issuer) {
        console.log('🔐 JWT Middleware - Invalid issuer:', payload.iss);
        return new NextResponse('Unauthorized', { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="API"'
          }
        });
      }

      if (jwtConfig.audience && payload.aud !== jwtConfig.audience) {
        console.log('🔐 JWT Middleware - Invalid audience:', payload.aud);
        return new NextResponse('Unauthorized', { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="API"'
          }
        });
      }

      // Check expiry
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        console.log('🔐 JWT Middleware - Token expired');
        return new NextResponse('Unauthorized', { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="API"'
          }
        });
      }

      // Create user object
      const user: JWTUser = {
        id: payload.sub || 'unknown',
        name: payload.name,
        email: payload.email,
        roles: payload.roles || ['authenticated'],
        tenant: payload.tenant,
        attr: {
          ...payload,
          aud: Array.isArray(payload.aud) ? payload.aud.join(',') : payload.aud,
        }
      };

      // Set user in request context
      (req as any).user = user;
      (req as any).authToken = token;
      
      console.log('🔐 JWT Middleware - User authenticated:', { 
        user: user.id, 
        tenant: user.tenant, 
        roles: user.roles 
      });

      return await handler(req as AuthenticatedRequest); // Continue to next middleware/handler

  };
}

/**
 * Parse JWT payload (simplified implementation)
 * In production, use a proper JWT library like jsonwebtoken
 */
function parseJWTPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('JWT parsing error:', error);
    return null;
  }
}

// JWT middleware is exported as withJwtAuth function
