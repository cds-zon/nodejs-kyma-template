# CDS Integration with Mastra

This document explains how to integrate SAP CDS (Cloud Application Programming Model) middleware with your Mastra service.

## Overview

The CDS middleware integration allows your Mastra service to:
- Process CDS authentication context
- Access user information from CDS
- Handle tenant-specific operations
- Integrate with SAP's authentication systems

## Architecture

```
CDS Service → Router → Mastra Service
     ↓           ↓         ↓
  Auth Context → Headers → CDS Middleware → Mastra Handlers
```

## Setup

### 1. Middleware Installation

The CDS middleware is automatically configured in your Mastra service:

```typescript
// In app/mastra/src/mastra/index.ts
import simpleCDSMiddleware, { getCDSUser, getCDSTenant } from './middleware/cds-simple';

export const mastra = new Mastra({
  server: {
    middleware: [
      {
        path: "*",
        handler: simpleCDSMiddleware
      }
    ]
  }
});
```

### 2. Dependencies

Required packages:
- `@sap/cds` - CDS runtime
- `@sap/xssec` - Security context
- `fetch-to-node` - Request/response conversion
- `hono` - Web framework

## Usage

### Accessing CDS Context in Handlers

```typescript
import { getCDSUser, getCDSTenant, getCDSUserAttributes } from './middleware/cds-simple';

// In your API route handlers
{
  path: "/my-endpoint",
  method: "GET",
  handler: async (c) => {
    const user = getCDSUser(c);
    const tenant = getCDSTenant(c);
    const attributes = getCDSUserAttributes(c);
    
    return c.json({
      user: user?.id,
      tenant,
      attributes
    });
  }
}
```

### User Context Structure

The middleware provides user context in this format:

```typescript
interface CDSUser {
  id: string;           // User ID
  tenant: string;       // Tenant ID
  attributes: {         // User attributes
    [key: string]: any;
  };
}
```

### Memory and Threading

Use CDS context for memory isolation:

```typescript
const stream = await mastra.getAgent("researchAgent").streamVNext(messages, {
  format: "aisdk",
  savePerStep: true,
  memory: {
    resource: user?.id || "default",
    thread: `${tenant}-${user?.id}` || "default",
  }
});
```

## Integration Methods

### Method 1: Header Forwarding (Recommended)

When requests come from a CDS service, the middleware automatically reads:
- `X-CDS-User-ID` - User identifier
- `X-CDS-User-Tenant` - Tenant identifier  
- `X-CDS-User-Attributes` - JSON-encoded user attributes

### Method 2: Direct JWT Processing

For direct requests with JWT tokens, the middleware:
1. Extracts the `Authorization` header
2. Processes through CDS middleware pipeline
3. Creates user context from CDS context

## Router Configuration

Configure your router to forward CDS context:

```json
// xs-app.json
{
  "source": "^/mastra(.*)",
  "target": "$1",
  "destination": "mastra-api",
  "csrfProtection": false,
  "authenticationType": "ias"
}
```

## Example API Endpoints

### Health Check
```bash
GET /health
# Returns: "OK"
```

### User Information
```bash
GET /user/me
# Returns user context from CDS
```

### Protected Chat
```bash
POST /chat/protected
Content-Type: application/json
Authorization: Bearer <token>

{
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
```

## Utility Functions

### Role-based Access Control

```typescript
import { hasRole, belongsToTenant } from './middleware/cds-simple';

// Check user roles
if (hasRole(c, 'admin')) {
  // Admin-only logic
}

// Check tenant membership
if (belongsToTenant(c, 'production')) {
  // Tenant-specific logic
}
```

### Error Handling

The middleware gracefully handles errors:
- Missing authentication → continues without user context
- Invalid tokens → logs warning, continues
- CDS processing errors → falls back to header-based context

## Testing

### Local Development

1. Start CDS service:
```bash
npm run serve:cds
```

2. Start Mastra service:
```bash
cd app/mastra && npm start
```

3. Test with authentication:
```bash
curl -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     http://localhost:4111/user/me
```

### With Header Forwarding

```bash
curl -H "X-CDS-User-ID: test-user" \
     -H "X-CDS-User-Tenant: test-tenant" \
     -H "X-CDS-User-Attributes: {\"name\":\"Test User\"}" \
     http://localhost:4111/user/me
```

## Troubleshooting

### Common Issues

1. **No user context available**
   - Check Authorization header format
   - Verify CDS configuration
   - Check middleware order

2. **CDS middleware not processing**
   - Verify `@sap/cds` is properly installed
   - Check CDS environment configuration
   - Review middleware registration

3. **Authentication failures**
   - Validate JWT token format
   - Check XSSEC configuration
   - Verify auth service credentials

### Debug Logging

Enable debug logging:

```bash
DEBUG=cds:auth,cds:context npm start
```

### Environment Variables

Required environment variables:
- `CDS_CONFIG` - CDS configuration
- `VCAP_SERVICES` - Service bindings (in cloud)

## Advanced Configuration

### Custom Auth Processing

```typescript
// Override auth processing
export const customCDSMiddleware = createMiddleware(async (c, next) => {
  // Custom authentication logic
  const customUser = await processCustomAuth(c.req);
  
  if (customUser) {
    c.set("user", customUser);
  }
  
  await next();
});
```

### Multi-tenant Support

```typescript
// Tenant-specific configuration
const tenantConfig = {
  'tenant-a': { features: ['feature1', 'feature2'] },
  'tenant-b': { features: ['feature1'] }
};

const features = tenantConfig[getCDSTenant(c)]?.features || [];
```

## Security Considerations

1. **Token Validation**: Always validate JWT tokens properly
2. **Header Sanitization**: Sanitize forwarded headers
3. **Context Isolation**: Ensure tenant isolation in memory/storage
4. **Audit Logging**: Log authentication events for security monitoring

## Migration Guide

### From Basic Auth to CDS

1. Replace basic auth middleware with CDS middleware
2. Update user context access patterns
3. Modify memory/storage keys to include tenant
4. Test multi-tenant scenarios

### From Custom Auth to CDS

1. Remove custom auth implementation
2. Configure CDS auth in environment
3. Update user attribute access
4. Test with actual CDS tokens
