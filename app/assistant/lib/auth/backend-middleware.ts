/**
 * Backend authentication middleware
 * Uses provider-specific middleware for authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '../config';
import { withMockAuth } from './middleware/mock-middleware';
import { withDummyAuth } from './middleware/dummy-middleware';
import { withJwtAuth } from './middleware/jwt-middleware';
import { withIasAuth } from './middleware/ias-middleware';
export interface AuthenticatedRequest extends NextRequest {
  user?: any;
  authToken?: string;
}


/**
 * Authentication middleware for API routes
 * Uses provider-specific middleware for authentication
 */
export function withBackendAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
    const auth = {
        mock: withMockAuth(handler),
        dummy: withDummyAuth(handler),
        jwt: withJwtAuth(handler),
        ias: withIasAuth(handler)
    }
    return async (req: NextRequest): Promise<Response> => {
      return await auth[config.auth.type as keyof typeof auth](req);
  };
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export function withOptionalBackendAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
    const auth = {
        mock: withMockAuth(handler),
        dummy: withDummyAuth(handler),
        jwt: withJwtAuth(handler),
        ias: withIasAuth(handler)
    }
    return async (req: NextRequest): Promise<Response> => {
      return await auth[config.auth.type as keyof typeof auth](req);
  };
}
 