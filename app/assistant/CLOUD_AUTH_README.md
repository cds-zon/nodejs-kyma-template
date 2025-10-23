# Cloud Authentication Integration

This document describes the cloud-based authentication system integrated with AssistantCloud, following the assistant-ui documentation pattern.

## Overview

The authentication system now integrates directly with AssistantCloud using the `authToken` function approach. This eliminates the need for UI-based login and leverages the app router's built-in authentication mechanisms.

## Architecture

### Core Components

1. **CloudAuthProvider** (`lib/auth/cloud-auth.ts`)
   - Manages token storage and retrieval
   - Handles 401 responses and re-authentication
   - Integrates with AssistantCloud's authToken function

2. **Auth Token API** (`app/api/auth/token/route.ts`)
   - Validates tokens and returns user information
   - Handles workspace ID generation
   - Supports multiple auth providers (Dummy, Mock, JWT)

3. **Middleware** (`middleware.ts`)
   - Intercepts API requests
   - Returns 401 with WWW-Authenticate header to trigger basic auth
   - Works with app router's authentication flow

4. **Runtime Integration** (`app/runtime.tsx`)
   - Uses AssistantCloud with authToken function
   - Automatically handles token management
   - No UI components needed

## How It Works

### 1. Token Flow

```
User Request → Middleware → 401 Response → Basic Auth/IAS Login → Token → AssistantCloud
```

1. **Initial Request**: User makes a request to the assistant
2. **Middleware Check**: Middleware checks for Authorization header
3. **401 Response**: If no token, returns 401 with WWW-Authenticate header
4. **Auth Trigger**: Browser/app router triggers basic auth or IAS login
5. **Token Storage**: Valid token is stored in localStorage
6. **Cloud Integration**: AssistantCloud uses the token for API calls

### 2. AssistantCloud Integration

```typescript
const cloud = new AssistantCloud({
    baseUrl: config.api.assistantBaseUrl,
    async authToken() {
        return await cloudAuthProvider.getAuthToken();
    } 
});
```

The `authToken` function is called by AssistantCloud when needed, automatically handling:
- Token retrieval from localStorage
- Token validation
- Re-authentication when tokens expire

### 3. API Route Protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Assistant API"',
        },
      });
    }
  }
  return NextResponse.next();
}
```

## Configuration

### Environment Variables

```bash
# Authentication
NEXT_PUBLIC_AUTH_TYPE=dummy  # or 'mock' or 'jwt'

# API endpoints
NEXT_PUBLIC_ASSISTANT_BASE_URL=http://localhost:4361/api/agents/researchAgent/stream/vnext
MASTRA_BASE_URL=http://localhost:4361

# JWT configuration (if using JWT)
JWT_SECRET=your-jwt-secret
JWT_ISSUER=your-app
JWT_AUDIENCE=your-api
```

### Auth Provider Types

#### 1. Dummy Provider (Development)
- Always returns a privileged user
- No configuration needed
- Perfect for development and testing

#### 2. Mock Provider (Testing)
- Uses predefined mock users
- Login with tokens: `mock:alice` or `mock:bob`
- Supports custom user configurations

#### 3. JWT Provider (Production)
- Validates JWT tokens
- Configurable secret, issuer, and audience
- Production-ready authentication

## Usage

### 1. Development Setup

```bash
# Set auth type to dummy for development
NEXT_PUBLIC_AUTH_TYPE=dummy

# Start the development server
npm run dev
```

The app will automatically use the default token for development.

### 2. Testing with Mock Users

```bash
# Set auth type to mock
NEXT_PUBLIC_AUTH_TYPE=mock

# In browser console, set a mock token
localStorage.setItem('auth_token', 'mock:alice');
```

### 3. Production with JWT

```bash
# Set auth type to JWT
NEXT_PUBLIC_AUTH_TYPE=jwt

# Configure JWT settings
JWT_SECRET=your-production-secret
JWT_ISSUER=your-app
JWT_AUDIENCE=your-api
```

### 4. App Router Integration

When running with app router, the middleware will automatically:
- Check for Authorization headers
- Return 401 responses for unauthenticated requests
- Trigger basic auth or IAS login based on your app router configuration

## API Endpoints

### Auth Token Endpoint

**POST /api/auth/token**

Validates a token and returns user information.

**Request:**
```http
POST /api/auth/token
Authorization: Bearer <token>
```

**Response:**
```json
{
  "token": "validated-token",
  "userId": "user123",
  "workspaceId": "tenant:user123",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["authenticated", "admin"],
    "tenant": "default"
  }
}
```

## Security Considerations

### Token Management
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Automatic token validation on each request
- 401 responses trigger re-authentication

### Middleware Protection
- All API routes are protected by default
- WWW-Authenticate header triggers browser auth
- App router handles the authentication flow

### Production Deployment
- Use JWT provider with strong secrets
- Configure proper CORS settings
- Implement token refresh for long-lived sessions

## Troubleshooting

### Common Issues

1. **401 Responses Not Triggering Auth**
   - Check middleware configuration
   - Verify WWW-Authenticate header is set
   - Ensure app router is configured for authentication

2. **Tokens Not Being Stored**
   - Check localStorage availability
   - Verify token format and validity
   - Check browser console for errors

3. **AssistantCloud Not Using Tokens**
   - Verify authToken function is properly configured
   - Check that cloud instance is passed to useChatRuntime
   - Ensure baseUrl is correctly set

### Debug Mode

Enable debug logging by checking the browser console for messages starting with "🔐 Cloud Auth".

## Migration from UI Auth

The system has been updated to remove UI-based authentication:

- ✅ Removed login forms and user menus
- ✅ Removed protected route components
- ✅ Integrated auth directly with AssistantCloud
- ✅ Added middleware for automatic auth handling
- ✅ Maintained all auth provider logic

## Benefits

1. **Simplified Architecture**: No UI components needed
2. **App Router Integration**: Leverages built-in auth mechanisms
3. **Automatic Token Management**: AssistantCloud handles token lifecycle
4. **Production Ready**: Supports multiple auth providers
5. **Security**: Proper 401 handling and re-authentication

This implementation follows the assistant-ui documentation pattern and provides a robust, production-ready authentication system that integrates seamlessly with AssistantCloud.
