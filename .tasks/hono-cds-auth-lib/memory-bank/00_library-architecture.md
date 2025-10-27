# Hono CDS Auth Library Architecture

**Created**: 2025-10-27
**Last Updated**: 2025-10-27
**Category**: [ARCHITECTURE]
**Timeline**: 00 of 02 - Initial architecture design

## Overview
A standalone, reusable authentication middleware library for Hono that integrates with SAP CDS authentication providers.

## Architecture

### Core Components

#### 1. Middleware (`src/middleware/index.ts`)
- `createAuthMiddleware()`: Factory function that creates Hono middleware
- Handles token extraction from Authorization header
- Performs authentication and authorization
- Sets user in Hono context
- Configurable public routes and debug logging

#### 2. Providers (`src/providers/`)
All providers implement the `AuthProvider` interface:

##### Dummy Provider (`dummy.ts`)
- Accepts any credentials for development/testing
- Basic authentication (username:password)
- No password validation
- Creates CDS User with username as id

##### Mock Provider (`mock.ts`)
- Uses predefined mock users
- Loads from CDS configuration or defaults
- Supports alice (admin) and bob (user) by default
- Basic authentication with optional password check
- **Key Fix**: Ensures `id` is set from username if missing in configuration

##### IAS Provider (`ias.ts`)
- SAP Identity Authentication Service integration
- JWT token validation using `@sap/xssec`
- Extracts user info from security context
- Loads credentials from CDS configuration

#### 3. Factory (`src/factory.ts`)
- `createAuthApp()`: Creates pre-configured Hono app with auth
- `getProvider()`: Get provider instance by type
- Provides default `/health` and `/api/me` endpoints

### Key Design Decisions

1. **No Mastra Dependencies**: Completely standalone, only uses SAP CDS and Hono
2. **Provider Interface**: Clean separation between providers
3. **ES Modules**: Full ESM support, no CommonJS requires
4. **Type Safety**: Full TypeScript with type exports
5. **Extensible**: Easy to add custom providers

### Export Structure
```
hono-cds-auth
├── index.js (main)
├── middleware/index.js
└── providers/
    ├── dummy.js
    ├── mock.js
    └── ias.js
```

### Dependencies
- `@sap/cds`: ^8.5.5
- `@sap/xssec`: ^4.2.5 (for IAS provider)
- `hono`: ^4.6.14

### Build Tool
- **pkgroll**: Modern, zero-config bundler for libraries
- Generates TypeScript definitions automatically
- Preserves ES modules structure
