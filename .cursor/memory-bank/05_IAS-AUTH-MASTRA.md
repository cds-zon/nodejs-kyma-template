# Mastra with SAP CDS Authentication

This Mastra application is integrated with SAP CDS authentication using `@sap/xssec` for proper identity and access management.

## Architecture

- **Mastra Server**: Runs independently with its own agents and workflows
- **Auth Middleware**: Uses `@sap/xssec` to integrate with SAP Identity Authentication Service (IAS)
- **CDS Integration**: Leverages CDS environment configuration for auth credentials

## Running the Application

### Development Mode (with CDS bindings)

1. **From the project root**, bind to auth services and run Mastra:
   ```bash
   # Bind to authentication services for hybrid profile
   npm run bind:auth
   
   # Run Mastra with CDS environment
   npm run -w app/mastra dev
   ```

2. **Alternative**: Use the hybrid profile directly:
   ```bash
   # This will bind and run everything
   npm run hybrid:mastra
   ```

### Production Mode

1. Ensure all service bindings are in place
2. Build and start:
   ```bash
   npm run -w app/mastra build
   npm run -w app/mastra start
   ```

## Authentication Flow

1. **Request arrives** at Mastra server
2. **Auth middleware** processes the request:
   - Extracts JWT token from `Authorization` header
   - Creates security context using `@sap/xssec`
   - Falls back to mock user in development
3. **User context** is available in all route handlers via `c.get('user')`
4. **Memory and agents** use user ID for personalization

## API Endpoints

### Standard Mastra Endpoints
- `GET /` - Mastra playground
- `POST /chat` - Chat with research agent
- `GET /health` - Health check

### Auth-Enabled Endpoints
- `GET /user/me` - Get current user information
- `POST /chat/protected` - Protected chat with user context

### Example Usage

```bash
# Get user info (with JWT token)
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:4111/user/me

# Protected chat (with JWT token)
curl -X POST \
     -H "Authorization: Bearer <your-jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello"}]}' \
     http://localhost:4111/chat/protected
```

## Environment Variables

The auth middleware uses CDS environment configuration:

```json
{
  "requires": {
    "auth": {
      "kind": "ias",
      "credentials": {
        // IAS service credentials
      }
    }
  }
}
```

## Development vs Production

- **Development**: Uses mock user when no valid JWT is provided
- **Production**: Requires valid JWT tokens from bound IAS service

## Troubleshooting

1. **Auth service not initialized**: Check CDS bindings with `npm run bind:list`
2. **Mock user always used**: Verify JWT token format and IAS service binding
3. **Memory not persisting**: Check if user ID is correctly extracted from security context
