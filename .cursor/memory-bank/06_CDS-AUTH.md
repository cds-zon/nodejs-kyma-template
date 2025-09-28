# CDS Authentication Provider for Mastra

This document describes the CDS authentication provider implementation for Mastra that integrates with SAP's XSUAA service and CDS framework.

## Overview

The `MastraAuthCds` provider extends Mastra's `MastraAuthProvider` to authenticate users using SAP's XSUAA (Extended Services for User Account and Authentication) service. It validates JWT tokens issued by XSUAA and extracts user information from the security context.

## Features

- **XSSEC Integration**: Uses `@sap/xssec` to validate JWT tokens and create security contexts
- **CDS Context Integration**: Enriches user data with information from CDS context when available
- **401 Authentication**: Returns proper 401 Unauthorized responses for invalid or missing tokens
- **User Context**: Provides structured user information to Mastra endpoints

## Configuration

### Prerequisites

1. Your application must be bound to an XSUAA service instance
2. CDS auth configuration must be properly set up in your environment
3. The following packages are required:
   - `@sap/cds`
   - `@sap/xssec`
   - `@mastra/core`

### Environment Setup

The provider automatically reads XSUAA credentials from your CDS environment configuration:

```javascript
// This is handled automatically by CDS
const authConfig = cds.env.requires.auth;
```

### Mastra Configuration

Replace the custom middleware with the CDS auth provider in your Mastra configuration:

```typescript
import { Mastra } from '@mastra/core';
import { MastraAuthCds } from './auth/cds-auth-provider';

export const mastra = new Mastra({
  // ... other configuration
  server: {
    // Remove custom middleware
    // middleware: [iasAuth],
    
    // Add CDS auth provider
    experimental_auth: new MastraAuthCds(),
    
    apiRoutes: [
      {
        path: "/protected-endpoint",
        method: "GET",
        requiresAuth: true, // This endpoint requires authentication
        handler: async (c) => {
          const user = c.get('user'); // Get authenticated user
          return c.json({ user });
        },
      }
    ]
  }
});
```

## User Object Structure

The authenticated user object has the following structure:

```typescript
interface CdsUser {
  id: string;              // User's logon name
  name: string;            // Full name (given + family)
  email?: string;          // Email address
  logonName: string;       // XSUAA logon name
  givenName?: string;      // First name
  familyName?: string;     // Last name
  roles?: string[];        // User roles (optional)
  tenant?: string;         // Tenant ID (optional)
  attributes?: {           // Additional attributes
    logonName: string;
    zoneId?: string;
    email?: string;
    cdsContext?: boolean;  // True if CDS context data was merged
    [key: string]: any;    // Other CDS context attributes
  };
}
```

## API Endpoints

### Protected Endpoints

Add `requiresAuth: true` to any API route to make it require authentication:

```typescript
{
  path: "/user/me",
  method: "GET",
  requiresAuth: true,
  handler: async (c) => {
    const user = c.get('user');
    return c.json({ user });
  },
}
```

### Authentication Flow

1. **Token Extraction**: The provider extracts JWT tokens from the `Authorization` header
2. **Token Validation**: Uses XSSEC to validate the token and create a security context
3. **User Creation**: Extracts user information from the security context
4. **CDS Enrichment**: Optionally enriches user data from CDS context
5. **Authorization**: Runs custom authorization logic (if provided)
6. **Context Setting**: Sets the user in the request context for handlers

## Error Handling

- **401 Unauthorized**: Returned when no valid token is provided
- **Token Validation Errors**: Logged and result in 401 responses
- **Configuration Errors**: Thrown during initialization if XSUAA credentials are missing

## Custom Authorization

You can provide custom authorization logic when creating the provider:

```typescript
const authProvider = new MastraAuthCds({
  authorizeUser: async (user, request) => {
    // Custom authorization logic
    if (user.roles?.includes('admin')) {
      return true;
    }
    
    // Check specific endpoints
    if (request.url.includes('/admin/')) {
      return user.roles?.includes('admin') || false;
    }
    
    return true; // Allow all authenticated users by default
  }
});
```

## Migration from Custom Middleware

If you're migrating from the custom middleware approach:

1. **Remove** the custom auth middleware from the `middleware` array
2. **Add** `experimental_auth: new MastraAuthCds()` to the server configuration
3. **Add** `requiresAuth: true` to protected routes
4. **Update** user access from `c.get('user')` (same as before)
5. **Remove** security context access (no longer needed in handlers)

## Benefits

- **Standards Compliance**: Uses SAP's standard XSUAA authentication
- **Mastra Integration**: Fully integrated with Mastra's authentication system
- **Type Safety**: Provides typed user objects
- **Flexibility**: Supports custom authorization logic
- **Error Handling**: Proper HTTP status codes and error responses
- **Performance**: No fallback to mock users - proper authentication required

## Troubleshooting

### Common Issues

1. **"CDS auth credentials not found"**: Ensure your app is bound to XSUAA service
2. **401 on all requests**: Check that valid JWT tokens are being sent in Authorization header
3. **User data missing**: Verify XSUAA token includes required claims

### Debug Logging

The provider includes extensive logging:
- `🔐 MastraAuthCds initialized with XSSEC`
- `✅ CDS user authenticated: {userId}`
- `❌ CDS token authentication failed: {error}`
- `🔄 Enriching user data from CDS context`

Check your application logs for these messages to troubleshoot authentication issues.
