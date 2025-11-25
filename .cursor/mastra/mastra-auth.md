
```MastraAuthProvider
import type { HonoRequest } from 'hono';
import { MastraBase } from '../base';
import { InstrumentClass } from '../telemetry';

export interface MastraAuthProviderOptions<TUser = unknown> {
  name?: string;
  authorizeUser?: (user: TUser, request: HonoRequest) => Promise<boolean> | boolean;
}

@InstrumentClass({
  prefix: 'auth',
  excludeMethods: ['__setTools', '__setLogger', '__setTelemetry', '#log'],
})
export abstract class MastraAuthProvider<TUser = unknown> extends MastraBase {
  constructor(options?: MastraAuthProviderOptions<TUser>) {
    super({ component: 'AUTH', name: options?.name });

    if (options?.authorizeUser) {
      this.authorizeUser = options.authorizeUser.bind(this);
    }
  }

  /**
   * Authenticate a token and return the payload
   * @param token - The token to authenticate
   * @param request - The request
   * @returns The payload
   */
  abstract authenticateToken(token: string, request: HonoRequest): Promise<TUser | null>;

  /**
   * Authorize a user for a path and method
   * @param user - The user to authorize
   * @param request - The request
   * @returns The authorization result
   */
  abstract authorizeUser(user: TUser, request: HonoRequest): Promise<boolean> | boolean;

  protected registerOptions(opts?: MastraAuthProviderOptions<TUser>) {
    if (opts?.authorizeUser) {
      this.authorizeUser = opts.authorizeUser.bind(this);
    }
  }
}

```


```workos-example
import { verifyJwks } from '@mastra/auth';
import type { JwtPayload } from '@mastra/auth';
import type { MastraAuthProviderOptions } from '@mastra/core/server';
import { MastraAuthProvider } from '@mastra/core/server';
import { WorkOS } from '@workos-inc/node';

type WorkosUser = JwtPayload;

interface MastraAuthWorkosOptions extends MastraAuthProviderOptions<WorkosUser> {
  apiKey?: string;
  clientId?: string;
}

export class MastraAuthWorkos extends MastraAuthProvider<WorkosUser> {
  protected workos: WorkOS;

  constructor(options?: MastraAuthWorkosOptions) {
    super({ name: options?.name ?? 'workos' });

    const apiKey = options?.apiKey ?? process.env.WORKOS_API_KEY;
    const clientId = options?.clientId ?? process.env.WORKOS_CLIENT_ID;

    if (!apiKey || !clientId) {
      throw new Error(
        'WorkOS API key and client ID are required, please provide them in the options or set the environment variables WORKOS_API_KEY and WORKOS_CLIENT_ID',
      );
    }

    this.workos = new WorkOS(apiKey, {
      clientId,
    });

    this.registerOptions(options);
  }

  async authenticateToken(token: string): Promise<WorkosUser | null> {
    const jwksUri = this.workos.userManagement.getJwksUrl(process.env.WORKOS_CLIENT_ID!);
    const user = await verifyJwks(token, jwksUri);
    return user;
  }

  async authorizeUser(user: WorkosUser) {
    if (!user) {
      return false;
    }

    const org = await this.workos.userManagement.listOrganizationMemberships({
      userId: user.sub,
    });

    const roles = org.data.map(org => org.role);

    const isAdmin = roles.some(role => role.slug === 'admin');

    return isAdmin;
  }
}

```

```oauth0-example
import { MastraAuthProvider } from '@mastra/core/server';
import type { MastraAuthProviderOptions } from '@mastra/core/server';

import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';

type Auth0User = JWTPayload;

interface MastraAuthAuth0Options extends MastraAuthProviderOptions<Auth0User> {
  domain?: string; // set this to your Auth0 domain
  audience?: string; // set this to your Auth0 API identifier
}

export class MastraAuthAuth0 extends MastraAuthProvider<Auth0User> {
  protected domain: string;
  protected audience: string;
  constructor(options?: MastraAuthAuth0Options) {
    super({ name: options?.name ?? 'auth0' });

    const domain = options?.domain ?? process.env.AUTH0_DOMAIN;
    const audience = options?.audience ?? process.env.AUTH0_AUDIENCE;

    if (!domain || !audience) {
      throw new Error(
        'Auth0 domain and audience are required, please provide them in the options or set the environment variables AUTH0_DOMAIN and AUTH0_AUDIENCE',
      );
    }

    this.domain = domain;
    this.audience = audience;

    this.registerOptions(options);
  }

  async authenticateToken(token: string): Promise<Auth0User | null> {
    const JWKS = createRemoteJWKSet(new URL(`https://${this.domain}/.well-known/jwks.json`));

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${this.domain}/`,
      audience: this.audience,
    });

    return payload;
  }

  async authorizeUser(user: Auth0User) {
    return !!user;
  }
}

````

```firebase
import type { MastraAuthProviderOptions } from '@mastra/core/server';
import { MastraAuthProvider } from '@mastra/core/server';

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

type FirebaseUser = admin.auth.DecodedIdToken;

interface MastraAuthFirebaseOptions extends MastraAuthProviderOptions<FirebaseUser> {
  databaseId?: string;
  serviceAccount?: string;
}

export class MastraAuthFirebase extends MastraAuthProvider<FirebaseUser> {
  private serviceAccount: string | undefined;
  private databaseId: string | undefined;

  constructor(options?: MastraAuthFirebaseOptions) {
    super({ name: options?.name ?? 'firebase' });

    this.serviceAccount = options?.serviceAccount ?? process.env.FIREBASE_SERVICE_ACCOUNT;
    this.databaseId = options?.databaseId ?? process.env.FIRESTORE_DATABASE_ID ?? process.env.FIREBASE_DATABASE_ID;

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: this.serviceAccount
          ? admin.credential.cert(this.serviceAccount)
          : admin.credential.applicationDefault(),
      });
    }

    this.registerOptions(options);
  }

  async authenticateToken(token: string): Promise<FirebaseUser | null> {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  }

  async authorizeUser(user: FirebaseUser) {
    const db = this.databaseId ? getFirestore(this.databaseId) : getFirestore();
    const userAccess = await db.doc(`/user_access/${user.uid}`).get();
    const userAccessData = userAccess.data();

    if (!userAccessData) {
      return false;
    }

    return true;
  }
}

```

```clerk
import { createClerkClient } from '@clerk/backend';
import type { ClerkClient } from '@clerk/backend';
import { verifyJwks } from '@mastra/auth';
import type { JwtPayload } from '@mastra/auth';
import type { MastraAuthProviderOptions } from '@mastra/core/server';
import { MastraAuthProvider } from '@mastra/core/server';

type ClerkUser = JwtPayload;

interface MastraAuthClerkOptions extends MastraAuthProviderOptions<ClerkUser> {
  jwksUri?: string;
  secretKey?: string;
  publishableKey?: string;
}

export class MastraAuthClerk extends MastraAuthProvider<ClerkUser> {
  protected clerk: ClerkClient;
  protected jwksUri: string;

  constructor(options?: MastraAuthClerkOptions) {
    super({ name: options?.name ?? 'clerk' });

    const jwksUri = options?.jwksUri ?? process.env.CLERK_JWKS_URI;
    const secretKey = options?.secretKey ?? process.env.CLERK_SECRET_KEY;
    const publishableKey = options?.publishableKey ?? process.env.CLERK_PUBLISHABLE_KEY;

    if (!jwksUri || !secretKey || !publishableKey) {
      throw new Error(
        'Clerk JWKS URI, secret key and publishable key are required, please provide them in the options or set the environment variables CLERK_JWKS_URI, CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY',
      );
    }

    this.jwksUri = jwksUri;
    this.clerk = createClerkClient({
      secretKey,
      publishableKey,
    });

    this.registerOptions(options);
  }

  async authenticateToken(token: string): Promise<ClerkUser | null> {
    const user = await verifyJwks(token, this.jwksUri);
    return user;
  }

  async authorizeUser(user: ClerkUser) {
    if (!user.sub) {
      return false;
    }

    const orgs = await this.clerk.users.getOrganizationMembershipList({
      userId: user.sub,
    });

    return orgs.data.length > 0;
  }
}
```



```
import type { Handler, MiddlewareHandler, HonoRequest, Context } from 'hono';
import type { cors } from 'hono/cors';
import type { DescribeRouteOptions } from 'hono-openapi';
import type { Mastra } from '../mastra';
import type { RuntimeContext } from '../runtime-context';
import type { MastraAuthProvider } from './auth';

export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL';

export type ApiRoute =
  | {
      path: string;
      method: Methods;
      handler: Handler;
      middleware?: MiddlewareHandler | MiddlewareHandler[];
      openapi?: DescribeRouteOptions;
      requiresAuth?: boolean;
    }
  | {
      path: string;
      method: Methods;
      createHandler: ({ mastra }: { mastra: Mastra }) => Promise<Handler>;
      middleware?: MiddlewareHandler | MiddlewareHandler[];
      openapi?: DescribeRouteOptions;
      requiresAuth?: boolean;
    };

export type Middleware = MiddlewareHandler | { path: string; handler: MiddlewareHandler };

export type ContextWithMastra = Context<{
  Variables: {
    mastra: Mastra;
    runtimeContext: RuntimeContext;
    customRouteAuthConfig?: Map<string, boolean>;
  };
}>;

export type MastraAuthConfig<TUser = unknown> = {
  /**
   * Protected paths for the server
   */
  protected?: (RegExp | string | [string, Methods | Methods[]])[];

  /**
   * Public paths for the server
   */
  public?: (RegExp | string | [string, Methods | Methods[]])[];

  /**
   * Public paths for the server
   */
  authenticateToken?: (token: string, request: HonoRequest) => Promise<TUser>;

  /**
   * Authorization function for the server
   */
  authorize?: (path: string, method: string, user: TUser, context: ContextWithMastra) => Promise<boolean>;

  /**
   * Rules for the server
   */
  rules?: {
    /**
     * Path for the rule
     */
    path?: RegExp | string | string[];
    /**
     * Method for the rule
     */
    methods?: Methods | Methods[];
    /**
     * Condition for the rule
     */
    condition?: (user: TUser) => Promise<boolean> | boolean;
    /**
     * Allow the rule
     */
    allow?: boolean;
  }[];
};

export type ServerConfig = {
  /**
   * Port for the server
   * @default 4111
   */
  port?: number;
  /**
   * Host for the server
   * @default 'localhost'
   */
  host?: string;
  /**
   * Timeout for the server
   */
  timeout?: number;
  /**
   * Custom API routes for the server
   */
  apiRoutes?: ApiRoute[];
  /**
   * Middleware for the server
   */
  middleware?: Middleware | Middleware[];
  /**
   * CORS configuration for the server
   * @default { origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization', 'x-mastra-client-type'], exposeHeaders: ['Content-Length', 'X-Requested-With'], credentials: false }
   */
  cors?: Parameters<typeof cors>[0] | false;
  /**
   * Build configuration for the server
   */
  build?: {
    /**
     * Enable Swagger UI
     * @default false
     */
    swaggerUI?: boolean;
    /**
     * Enable API request logging
     * @default false
     */
    apiReqLogs?: boolean;
    /**
     * Enable OpenAPI documentation
     * @default false
     */
    openAPIDocs?: boolean;
  };
  /**
   * Body size limit for the server
   * @default 4.5mb
   */
  bodySizeLimit?: number;

  /**
   * Authentication configuration for the server
   */
  experimental_auth?: MastraAuthConfig<any> | MastraAuthProvider<any>;

  /**
   * If you want to run `mastra dev` with HTTPS, you can run it with the `--https` flag and provide the key and cert files here.
   */
  https?: {
    key: Buffer;
    cert: Buffer;
  };
};
```