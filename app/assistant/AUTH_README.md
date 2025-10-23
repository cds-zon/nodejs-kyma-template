# Authentication Implementation

This document describes the authentication system implemented for the assistant app, based on the mastra auth module.

## Overview

The authentication system provides:
- Multiple authentication providers (Dummy, Mock, JWT)
- Token-based authentication
- Protected routes and API endpoints
- User context and state management
- Integration with the transport API

## Architecture

### Core Components

1. **Authentication Providers** (`lib/auth/providers.ts`)
   - `DummyAuthProvider`: Always returns a privileged user (development)
   - `MockAuthProvider`: Uses configured mock users for testing
   - `JWTAuthProvider`: Validates JWT tokens

2. **Authentication Context** (`lib/auth/context.tsx`)
   - React context for authentication state
   - Token management and storage
   - Login/logout functionality

3. **Authentication Middleware** (`lib/auth/middleware.ts`)
   - API route protection
   - Token validation
   - User authorization

4. **UI Components** (`components/auth/`)
   - Login form
   - User menu
   - Protected route wrapper

## Configuration

The authentication system is configured through environment variables and the `lib/config.ts` file:

```typescript
export const config = {
  auth: {
    type: 'dummy' | 'mock' | 'jwt',
    jwt: {
      secret: 'your-jwt-secret',
      issuer: 'your-app',
      audience: 'your-api',
    },
  },
  api: {
    assistantBaseUrl: 'http://localhost:4361/api/agents/researchAgent/stream/vnext',
    mastraBaseUrl: 'http://localhost:4361',
  },
};
```

## Usage

### 1. Environment Variables

Set the following environment variables:

```bash
# Authentication type
NEXT_PUBLIC_AUTH_TYPE=dummy  # or 'mock' or 'jwt'

# API endpoints
NEXT_PUBLIC_ASSISTANT_BASE_URL=http://localhost:4361/api/agents/researchAgent/stream/vnext
MASTRA_BASE_URL=http://localhost:4361

# JWT configuration (if using JWT auth)
JWT_SECRET=your-jwt-secret
JWT_ISSUER=your-app
JWT_AUDIENCE=your-api
```

### 2. Authentication Providers

#### Dummy Provider (Development)
Always returns a privileged user. No configuration needed.

#### Mock Provider (Testing)
Uses predefined mock users:
- `alice`: Admin user with full access
- `bob`: Regular user

Login with tokens: `mock:alice` or `mock:bob`

#### JWT Provider (Production)
Validates JWT tokens with configurable secret, issuer, and audience.

### 3. Using Authentication

#### In Components
```tsx
import { useAuth, useAuthToken } from '@/lib/auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const token = useAuthToken();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return <div>Welcome, {user?.name}!</div>;
}
```

#### In API Routes
```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';

async function handleRequest(req: AuthenticatedRequest) {
  const user = req.user; // Authenticated user
  // Your logic here
}

export const POST = withAuth(handleRequest);
```

### 4. Protected Routes

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

function App() {
  return (
    <ProtectedRoute>
      <YourProtectedContent />
    </ProtectedRoute>
  );
}
```

## Transport API Integration

The authentication system automatically passes the auth token to the transport API:

1. **Runtime Provider** (`app/runtime.tsx`)
   - Gets token from localStorage
   - Passes token in Authorization header to transport API

2. **API Routes** (`app/_api/chat/route.ts`)
   - Uses authentication middleware
   - Forwards auth token to Mastra client
   - Includes fallback to direct LLM if Mastra fails

## Token Flow

1. User logs in with token
2. Token is stored in localStorage
3. Token is automatically included in API requests
4. Backend validates token and extracts user info
5. User info is passed to transport API

## Security Considerations

- Tokens are stored in localStorage (consider httpOnly cookies for production)
- JWT tokens should be properly validated with secret
- Mock provider should only be used in development
- Consider implementing token refresh for long-lived sessions

## Development

### Adding New Auth Providers

1. Create a new provider class implementing `AuthProvider` interface
2. Add the provider to the factory function in `providers.ts`
3. Update the configuration to support the new provider type

### Customizing UI

The authentication UI components can be customized:
- `components/auth/login-form.tsx`: Login form
- `components/auth/user-menu.tsx`: User dropdown menu
- `components/auth/protected-route.tsx`: Route protection wrapper

## Troubleshooting

### Common Issues

1. **Token not being passed**: Check that `useAuthToken()` is being called in the runtime provider
2. **Authentication failing**: Verify the auth provider type matches your configuration
3. **CORS issues**: Ensure the transport API accepts requests from your domain
4. **Mock users not working**: Check that you're using the correct token format (`mock:username`)

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will show authentication logs in the console.
