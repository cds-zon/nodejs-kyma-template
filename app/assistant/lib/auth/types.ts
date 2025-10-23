/**
 * Authentication types for the assistant app
 */

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  roles: string[];
  tenant?: string;
  attr?: Record<string, any>;
}

export interface AuthProvider {
  authenticateToken(token: string): Promise<AuthUser | null>;
  authorizeUser(user: AuthUser): Promise<boolean>;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
