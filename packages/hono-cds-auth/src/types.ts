/**
 * Type definitions for Hono CDS Auth
 */
import type { HonoRequest } from 'hono';
import type cds from '@sap/cds';

/**
 * Authentication provider types supported by CDS
 */
export type ProviderType = 'ias' | 'dummy' | 'mock';

/**
 * Configuration for authentication providers
 */
export interface ProviderConfig {
  type: ProviderType;
  config?: any;
}

/**
 * Core authentication provider interface
 */
export interface AuthProvider<TUser = cds.User> {
  /**
   * Authenticate a token and return user information
   */
  authenticateToken(token: string, request: HonoRequest): Promise<TUser | null>;
  
  /**
   * Authorize a user for a specific request
   */
  authorizeUser(user: TUser, request: HonoRequest): Promise<boolean>;
  
  /**
   * Get the WWW-Authenticate header value
   */
  wwwAuthenticate?: string;
}

/**
 * Middleware configuration options
 */
export interface AuthMiddlewareConfig {
  /**
   * Routes that don't require authentication
   */
  publicRoutes?: string[];
  
  /**
   * Custom authentication provider
   */
  provider?: AuthProvider;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * User information stored in context
 */
export interface AuthUser extends cds.User {
  id: string;
  [key: string]: any;
}
