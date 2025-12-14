export interface AuthUser {
  id: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: AuthUser
  success: boolean
  message?: string
  token?: string // JWT token for Bearer authentication
  expires_in?: number // Token expiry time in seconds from now
  refresh_threshold?: number // Recommended refresh threshold in seconds before expiry
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  graphId?: string
  createdAt: string
  expiresAt?: string
  lastUsedAt?: string
  isActive: boolean
}

export interface CreateAPIKeyRequest {
  name: string
  permissions: string[]
  graphId?: string
  expiresAt?: string
}

export interface SSOTokenResponse {
  token: string
  expires_at: string
  apps: string[]
}

export interface AppConfig {
  name: string
  displayName: string
  url: string
  description: string
  initials: string
  colorClass: string
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  sessionWarning: { show: boolean; timeLeft: number }
  login: (email: string, password: string) => Promise<AuthUser>
  register: (
    email: string,
    password: string,
    name?: string
  ) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshSession: (force?: boolean) => Promise<void>
  forgotPassword: (
    email: string
  ) => Promise<{ success: boolean; message?: string }>
  resetPassword: (
    token: string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string }>
  validateResetToken: (
    token: string
  ) => Promise<{ valid: boolean; email?: string; message?: string }>
  verifyEmail: (
    token: string
  ) => Promise<{ success: boolean; message?: string; user?: AuthUser }>
  resendVerificationEmail: (
    email: string
  ) => Promise<{ success: boolean; message?: string }>
}

export interface UseUserHook {
  /**
   * Refresh the current user's data from the server
   */
  refreshUser: () => Promise<AuthUser | null>
  /**
   * Update the current user's profile information
   */
  updateProfile: (data: { name?: string; email?: string }) => Promise<AuthUser>
}

// SDK Response Types
export interface SDKAuthResponse {
  user: AuthUser
  message?: string
  token?: string // JWT token from backend
  expires_in?: number | null // Token expiry time in seconds from now
  refresh_threshold?: number | null // Recommended refresh threshold in seconds before expiry
}

export interface SDKCurrentUserResponse {
  user: AuthUser
}

export interface SDKApiKeyResponse {
  api_key: {
    id: string
    name: string
    created_at: string
    is_active: boolean
    last_used_at: string | null
  }
  key: string
}

export interface SDKApiKeysListResponse {
  api_keys: Array<{
    id: string
    name: string
    prefix: string
    created_at: string
    is_active: boolean
    last_used_at: string | null
  }>
}

export interface SDKSsoExchangeResponse {
  session_id: string
}
