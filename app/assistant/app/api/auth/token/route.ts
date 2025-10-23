/**
 * Auth token endpoint for AssistantCloud
 * Uses middleware-based authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withBackendAuth, AuthenticatedRequest } from '@/lib/auth/backend-middleware';
async function handleTokenRequest(req: AuthenticatedRequest) {
  try {
    // Get user and token from request context (set by middleware)
    const user = req.user;
    const authToken = req.authToken;
    if (!user) {
      console.log('🔐 Auth Token API - No user in request context');
      return NextResponse.json({ error: 'No user authenticated' }, { status: 401 });
    }

    // Generate workspace ID (using user ID as workspace ID for simplicity)
    const workspaceId = user.tenant ? `${user.tenant}:${user.id}` : user.id;
    
    console.log('🔐 Auth Token API - User authenticated:', { 
      userId: user.id, 
      workspaceId,
      roles: user.roles 
    });

    // Return the token and user information
    return NextResponse.json({ 
      token: authToken,
      userId: user.id,
      workspaceId: workspaceId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        tenant: user.tenant
      }
    });

  } catch (error: any) {
    console.error('🔐 Auth Token API - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withBackendAuth(handleTokenRequest);
export const GET = withBackendAuth(handleTokenRequest);
