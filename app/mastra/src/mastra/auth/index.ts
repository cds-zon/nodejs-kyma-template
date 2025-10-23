/**
 * Authentication Provider Factory
 * 
 * Creates and manages different authentication providers
 */
import type { Handler, MiddlewareHandler, HonoRequest, Context } from 'hono';

import {ContextWithMastra, defineAuth, MastraAuthProvider } from "@mastra/core/server";
import ias from "./ias";
import dummy from "./dummy";
import mock from "./mock";
import cds from "@sap/cds";

export type ProviderType = typeof cds.requires.auth.kind;

export interface ProviderConfig {
  type: ProviderType;
  config?: any;
}


const providers: Record<ProviderType, Pick<MastraAuthProvider<cds.User>, "authenticateToken" | "authorizeUser">> = {
    "ias": ias,
    "dummy": dummy,
    "mock": mock
}
export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL';

const which = providers[cds.requires.auth.kind];
console.log('🔐 Mastra Auth Provider:', cds.requires.auth.kind);
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
export  class CDSAuthProvider extends MastraAuthProvider<cds.User>  {
  constructor(options?: Partial<MastraAuthProvider<cds.User>>) {
    super({ name: 'cds', authorizeUser: which.authorizeUser.bind(which) });
      
  }
  authenticateToken = which.authenticateToken.bind(which);
  authorizeUser = which.authorizeUser.bind(which);
  
  wwwAuthenticateHeader(): string {
      switch (cds.requires.auth.kind) {
          case 'ias':
              return 'Bearer realm="IAS"';
          default:
              return 'Basic realm="Users"';
      }
  }
}

const provider = new CDSAuthProvider();

const authConfig= defineAuth<cds.User>({
    protected: [
        /^\/api\/.*/,
        '/user/me',
    ],
    public: [
        '/health',
        "/api/telemetry"
    ],
    async authenticateToken(token: string, request: HonoRequest): Promise<cds.User> {
        const user = await provider.authenticateToken(token, request);
        console.debug('🔐 Auth Config - Authenticated User:', user ? user.id : 'None');
        if (!user) {
            request.header("WWW-Authenticate", provider.wwwAuthenticateHeader());
            throw new Error('Unauthorized');
       
        }
        return user;
    }
});

export  default Object.assign(provider, authConfig);