/**
 * IAS Authentication Middleware
 * Based on SAP XSUAA IAS authentication pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '../../config';

interface AuthenticatedRequest extends NextRequest {
  user?: any;
  authToken?: string;
}

interface IASUser {
  id: string;
  name?: string;
  email?: string;
  roles?: string[];
  tenant?: string;
  attr?: Record<string, any>;
  authInfo?: any;
}

/**
 * IAS Authentication Middleware
 * Validates IAS tokens using XSUAA pattern
 */
export function withIasAuth(handler: (req: AuthenticatedRequest) => Promise<Response>, options: any = {}) {
  const iasConfig = {
    clientId: options.clientId || config.auth.ias.clientId,
    clientSecret: options.clientSecret || config.auth.ias.clientSecret,
    iasUrl: options.iasUrl || config.auth.ias.iasUrl,
    redirectUri: options.redirectUri || config.auth.ias.redirectUri,
  };

  return async function iasMiddleware(req: NextRequest): Promise<Response> {
    const auth = req.headers.get('authorization');
    
    // Check for Bearer token
    if (!auth?.match(/^bearer/i)) {
      console.log('🔐 IAS Middleware - No Bearer token provided');
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="IAS"'
        }
      });
    }

    try {
      // Extract token
      const token = auth.slice(7); // Remove "Bearer "
      
      // Validate IAS token and create security context
      const user = await authenticateIASToken(token, iasConfig);
      
      if (!user) {
        console.log('🔐 IAS Middleware - Invalid IAS token');
        return new NextResponse('Unauthorized', { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="IAS"'
          }
        });
      }

      // Set user in request context
      (req as any).user = user;
      (req as any).authToken = token;


      console.log('🔐 IAS Middleware - User authenticated:', { 
        user: user.id, 
        tenant: user.tenant, 
        roles: user.roles 
      });

      return await handler(req as AuthenticatedRequest); // Continue to next middleware/handler

    } catch (error) {
      console.error('🔐 IAS Middleware - Error:', error);
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="IAS"'
        }
      });
    }
  };
}

/**
 * Authenticate IAS token and return user information
 * Based on XSUAA pattern from @ias.ts
 */
async function authenticateIASToken(token: string, config: any): Promise<IASUser | null> {
  try {
    // In a real implementation, you would use @sap/xssec to validate the token
    // For now, we'll simulate the XSUAA pattern
    
    console.log('🔐 IAS Auth Service - Authenticate Token');
    
    // Simulate token payload (in real implementation, this comes from XSUAA)
    const payload = {
      sub: 'ias-user-123',
      aud: [config.clientId],
      scope: ['openid', 'profile', 'email'],
      ias_apis: ['user.read', 'user.write'],
      name: 'IAS User',
      email: 'user@example.com',
      given_name: 'IAS',
      family_name: 'User',
      tenant_id: 't1',
      zone_uuid: 'zone-123',
      app_tid: 't1',
      iss: config.iasUrl,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    // Extract roles from scope and ias_apis (similar to getRoles function)
    const roles: string[] = payload.scope ? 
      (Array.isArray(payload.scope) ? payload.scope : (payload.scope as string).split(' ')) : [];
    
    if (Array.isArray(payload.ias_apis)) {
      roles.push(...payload.ias_apis);
    }

    // Check if it's a client credentials token
    const clientId = payload.aud?.[0] || payload.aud;
    if (clientId === config.clientId) {
      roles.push('internal-user');
    }

    if (clientId === payload.sub) {
      // System user (client credentials or x509)
      roles.push('system-user');
    }

    console.log('🔐 IAS Auth Service - Token validated:', payload.sub, payload.aud, roles);
    
    // Create user object (similar to CDSUser pattern)
    const user: IASUser = {
      id: payload.sub || 'unknown',
      name: payload.name,
      email: payload.email,
      roles,
      tenant: payload.app_tid || payload.tenant_id,
      attr: {
        ...payload,
        aud: Array.isArray(payload.aud) ? payload.aud.join(',') : payload.aud,
        ias_tenant: payload.tenant_id,
        ias_zone: payload.zone_uuid,
      },
      authInfo: {
        token: payload,
        clientId: clientId,
        tenant: payload.app_tid,
      }
    };

    return user;
    
  } catch (error) {
    console.error('IAS token authentication error:', error);
    return null;
  }
}
