import {
  checkPasswordStrength,
  client,
  completeSsoAuth,
  createUserApiKey,
  forgotPassword,
  generateSsoToken,
  getCurrentAuthUser,
  getPasswordPolicy,
  listUserApiKeys,
  loginUser,
  logoutUser,
  refreshAuthSession,
  registerUser,
  resendVerificationEmail,
  resetPassword,
  revokeUserApiKey,
  ssoTokenExchange,
  validateResetToken,
  verifyEmail,
} from '@robosystems/client'
import type {
  APIKey,
  AuthResponse,
  AuthUser,
  CreateAPIKeyRequest,
  SDKApiKeyResponse,
  SDKApiKeysListResponse,
  SDKAuthResponse,
  SDKCurrentUserResponse,
  SDKSsoExchangeResponse,
  SSOTokenResponse,
} from './types'

// Try to import SDK extensions for enhanced features
let RoboSystemsExtensions: any = null
try {
  const extensions = require('@robosystems/client/extensions')
  RoboSystemsExtensions = extensions.RoboSystemsExtensions
} catch {
  // SDK extensions not available in this version
}

// Configuration constants
const CACHE_TTL_MS = 30 * 1000 // 30 seconds - optimized for performance
const ERROR_CACHE_TTL_MS = 5 * 1000 // 5 seconds - allow reasonable retry delay

// Custom error class for token expiry
export class TokenExpiredError extends Error {
  constructor(message: string = 'Token expired') {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

export class RoboSystemsAuthClient {
  private client: typeof client
  private authCheckPromise: Promise<AuthUser> | null = null
  private lastAuthCheck: { timestamp: number; result: AuthUser | null } | null =
    null
  private lastError: { timestamp: number; error: Error } | null = null
  private refreshRetryCount = 0
  private readonly MAX_REFRESH_RETRIES = 3
  private readonly INITIAL_RETRY_DELAY = 1000 // 1 second

  constructor(baseUrl: string) {
    // Configure the SDK client with the provided base URL and credentials
    this.client = client

    // Configure client with JWT authentication
    this.configureClientWithAuth(baseUrl)
  }

  /**
   * Configure the client with JWT authentication for all requests
   */
  private configureClientWithAuth(baseUrl: string): void {
    // Get JWT token for authorization with auto-refresh
    const getAuthToken = async () => {
      const { getValidToken } = await import('./token-storage')
      return await getValidToken() // This will auto-refresh if needed
    }

    // Set base configuration
    this.client.setConfig({
      baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
      credentials: 'include', // Essential for cookie-based authentication
      headers: {},
    })

    // Wrap the client methods to add JWT token to requests
    const originalPost = this.client.post?.bind(this.client)
    const originalPut = this.client.put?.bind(this.client)
    const originalPatch = this.client.patch?.bind(this.client)
    const originalDelete = this.client.delete?.bind(this.client)

    // Helper to add JWT token to headers and handle 401 responses
    const wrapWithAuthAndErrorHandling = (
      originalMethod: Function | undefined,
      methodName: string
    ) => {
      if (!originalMethod) return undefined

      return async (options: any) => {
        try {
          const authToken = await getAuthToken()
          const headers: any = { ...options.headers }

          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`
          }

          const enhancedOptions = {
            ...options,
            headers,
          }

          const result = await originalMethod(enhancedOptions)
          return result
        } catch (error: any) {
          // Check for 401 Unauthorized errors
          if (
            error?.status === 401 ||
            error?.response?.status === 401 ||
            error?.message?.toLowerCase().includes('unauthorized') ||
            error?.message?.toLowerCase().includes('401')
          ) {
            // Clear cached auth data
            this.clearAuthCache()

            // Clear token from storage
            const { clearToken } = await import('./token-storage')
            clearToken()

            // Throw custom error that can be caught by UI
            throw new TokenExpiredError(
              'Your session has expired. Please log in again.'
            )
          }

          // Re-throw other errors
          throw error
        }
      }
    }

    // Also wrap GET requests to add JWT token
    const originalGet = this.client.get?.bind(this.client)

    // Override all methods with auth headers and error handling
    this.client.get = wrapWithAuthAndErrorHandling(originalGet, 'GET')
    this.client.post = wrapWithAuthAndErrorHandling(originalPost, 'POST')
    this.client.put = wrapWithAuthAndErrorHandling(originalPut, 'PUT')
    this.client.patch = wrapWithAuthAndErrorHandling(originalPatch, 'PATCH')
    this.client.delete = wrapWithAuthAndErrorHandling(originalDelete, 'DELETE')
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await loginUser({
      client: this.client,
      body: { email, password },
    })

    const sdkResponse = this.validateSDKAuthResponse(response.data)

    // Store JWT token with expiry information if present in response
    if (sdkResponse.token) {
      const { storeToken } = await import('./token-storage')
      storeToken(
        sdkResponse.token,
        sdkResponse.expires_in || 1800,
        sdkResponse.refresh_threshold || 300
      )

      // Configure SDK extensions with the new token if available
      if (RoboSystemsExtensions) {
        // Create a new extensions instance with the token
        const extensions = new RoboSystemsExtensions({
          baseUrl: this.client.getConfig().baseUrl,
          credentials: 'include',
          token: sdkResponse.token,
          s3EndpointUrl: process.env.NEXT_PUBLIC_S3_ENDPOINT_URL, // For LocalStack in local dev
        })
        // Store for later use if needed
        if (typeof window !== 'undefined') {
          ;(window as any).__roboSystemsExtensions = extensions
        }
      }
    }

    return {
      user: sdkResponse.user,
      success: true,
      message: sdkResponse.message,
      token: sdkResponse.token,
      expires_in: sdkResponse.expires_in,
      refresh_threshold: sdkResponse.refresh_threshold,
    }
  }

  async register(
    email: string,
    password: string,
    name?: string,
    captchaToken?: string
  ): Promise<AuthResponse> {
    const response = await registerUser({
      client: this.client,
      body: {
        email,
        password,
        name: name || '',
        captcha_token: captchaToken || undefined,
      },
    })

    const sdkResponse = this.validateSDKAuthResponse(response.data)

    // Store JWT token with expiry information if present in response
    if (sdkResponse.token) {
      const { storeToken } = await import('./token-storage')
      storeToken(
        sdkResponse.token,
        sdkResponse.expires_in || 1800,
        sdkResponse.refresh_threshold || 300
      )

      // Configure SDK extensions with the new token if available
      if (RoboSystemsExtensions) {
        // Create a new extensions instance with the token
        const extensions = new RoboSystemsExtensions({
          baseUrl: this.client.getConfig().baseUrl,
          credentials: 'include',
          token: sdkResponse.token,
          s3EndpointUrl: process.env.NEXT_PUBLIC_S3_ENDPOINT_URL, // For LocalStack in local dev
        })
        // Store for later use if needed
        if (typeof window !== 'undefined') {
          ;(window as any).__roboSystemsExtensions = extensions
        }
      }
    }

    return {
      user: sdkResponse.user,
      success: true,
      message: sdkResponse.message,
      token: sdkResponse.token,
      expires_in: sdkResponse.expires_in,
      refresh_threshold: sdkResponse.refresh_threshold,
    }
  }

  async logout(): Promise<void> {
    try {
      // Add timeout to prevent hanging
      const logoutPromise = logoutUser({
        client: this.client,
      })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Logout timeout after 10 seconds')),
          10000
        )
      })

      await Promise.race([logoutPromise, timeoutPromise])
    } catch (error) {
      // Don't throw - continue with local cleanup even if backend fails
    }

    // Clear stored JWT token
    const { clearToken } = await import('./token-storage')
    clearToken()

    // Verify logout by checking current user session
    try {
      // Clear any cached auth state to force fresh API call
      this.clearAuthCache()

      // Try to get current user - this should fail if logout worked
      await this.getCurrentUser()
    } catch (verifyError) {
      // This is expected - getCurrentUser should throw an error after logout
    }
  }

  async getCurrentUser(): Promise<AuthUser> {
    // Return cached result if fresh
    if (
      this.lastAuthCheck &&
      Date.now() - this.lastAuthCheck.timestamp < CACHE_TTL_MS
    ) {
      if (this.lastAuthCheck.result) {
        return this.lastAuthCheck.result
      }
    }

    // Return cached error if fresh
    if (
      this.lastError &&
      Date.now() - this.lastError.timestamp < ERROR_CACHE_TTL_MS
    ) {
      throw this.lastError.error
    }

    // If request already in progress, wait for it
    if (this.authCheckPromise) {
      return await this.authCheckPromise
    }

    // Create new auth check promise
    this.authCheckPromise = this.performAuthCheck()

    try {
      const result = await this.authCheckPromise
      // Clear any previous error on success
      this.lastError = null
      return result
    } catch (error) {
      // Don't cache 403 errors - they indicate a permanent state change
      const is403 =
        (error as any)?.status === 403 ||
        (error as any)?.response?.status === 403

      if (!is403) {
        // Cache non-403 errors for consistent responses
        this.lastError = {
          timestamp: Date.now(),
          error: error instanceof Error ? error : new Error(String(error)),
        }
      } else {
        // Clear cached error for 403s to force fresh checks
        this.lastError = null
      }

      throw error
    } finally {
      this.authCheckPromise = null
    }
  }

  private async performAuthCheck(): Promise<AuthUser> {
    try {
      const response = await getCurrentAuthUser({
        client: this.client,
      })

      const data = this.validateSDKCurrentUserResponse(response.data)
      const user = data.user

      this.lastAuthCheck = { timestamp: Date.now(), result: user }
      return user
    } catch (error) {
      this.lastAuthCheck = { timestamp: Date.now(), result: null }
      // Error caching is handled in getCurrentUser()
      throw error
    }
  }

  async refreshSession(): Promise<AuthResponse> {
    const response = await this.refreshSessionWithRetry()

    // Check if response has data property or if it IS the data
    const responseData = response?.data !== undefined ? response.data : response

    const sdkResponse = this.validateSDKAuthResponse(responseData)

    // Store new JWT token with expiry information if present in response
    if (sdkResponse.token) {
      const { storeToken } = await import('./token-storage')
      storeToken(
        sdkResponse.token,
        sdkResponse.expires_in || 1800,
        sdkResponse.refresh_threshold || 300
      )

      // Configure SDK extensions with the new token if available
      if (RoboSystemsExtensions) {
        // Create a new extensions instance with the token
        const extensions = new RoboSystemsExtensions({
          baseUrl: this.client.getConfig().baseUrl,
          credentials: 'include',
          token: sdkResponse.token,
          s3EndpointUrl: process.env.NEXT_PUBLIC_S3_ENDPOINT_URL, // For LocalStack in local dev
        })
        // Store for later use if needed
        if (typeof window !== 'undefined') {
          ;(window as any).__roboSystemsExtensions = extensions
        }
      }
    }

    // Reset retry count on success
    this.refreshRetryCount = 0

    return {
      user: sdkResponse.user,
      success: true,
      message: sdkResponse.message,
      token: sdkResponse.token,
      expires_in: sdkResponse.expires_in,
      refresh_threshold: sdkResponse.refresh_threshold,
    }
  }

  /**
   * Refresh session with exponential backoff retry logic
   */
  private async refreshSessionWithRetry(): Promise<any> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.MAX_REFRESH_RETRIES; attempt++) {
      try {
        // Attempt to refresh the session
        const response = await refreshAuthSession({
          client: this.client,
        })

        // Success - return the response
        return response
      } catch (error) {
        lastError = error as Error

        // If this is the last attempt, throw the error
        if (attempt === this.MAX_REFRESH_RETRIES) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt)

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * delay
        const totalDelay = delay + jitter

        console.warn(
          `Session refresh attempt ${attempt + 1} failed, retrying in ${Math.round(
            totalDelay
          )}ms...`
        )

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, totalDelay))
      }
    }

    // All attempts failed - throw the last error
    throw lastError || new Error('Failed to refresh session after all retries')
  }

  async createAPIKey(request: CreateAPIKeyRequest): Promise<APIKey> {
    const response = await createUserApiKey({
      client: this.client,
      body: {
        name: request.name,
        description: request.permissions.join(', '), // Map permissions to description for now
      },
    })

    const sdkResponse = response.data as unknown as SDKApiKeyResponse
    return {
      id: sdkResponse.api_key.id,
      name: sdkResponse.api_key.name,
      key: sdkResponse.key,
      permissions: request.permissions,
      graphId: request.graphId,
      createdAt: sdkResponse.api_key.created_at,
      isActive: sdkResponse.api_key.is_active,
      lastUsedAt: sdkResponse.api_key.last_used_at,
      expiresAt: request.expiresAt,
    }
  }

  async getAPIKeys(): Promise<APIKey[]> {
    const response = await listUserApiKeys({
      client: this.client,
    })

    const sdkResponse = response.data as unknown as SDKApiKeysListResponse
    return sdkResponse.api_keys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.prefix + '...', // Only prefix is available in list
      permissions: [], // Not available in the SDK response
      createdAt: apiKey.created_at,
      isActive: apiKey.is_active,
      lastUsedAt: apiKey.last_used_at,
    }))
  }

  async revokeAPIKey(keyId: string): Promise<void> {
    await revokeUserApiKey({
      client: this.client,
      path: { api_key_id: keyId },
    })
  }

  async generateSSOToken(): Promise<SSOTokenResponse> {
    const response = await generateSsoToken({
      client: this.client,
    })

    const data = response.data as unknown as SSOTokenResponse
    return data
  }

  async ssoExchange(
    token: string,
    targetApp: string
  ): Promise<{ session_id: string }> {
    const response = await ssoTokenExchange({
      client: this.client,
      body: { token, target_app: targetApp },
    })

    const data = response.data as unknown as SDKSsoExchangeResponse
    return {
      session_id: data.session_id,
    }
  }

  async ssoComplete(sessionId: string): Promise<AuthResponse> {
    const response = await completeSsoAuth({
      client: this.client,
      body: { session_id: sessionId },
    })

    const sdkResponse = this.validateSDKAuthResponse(response.data)

    // Store JWT token with expiry information if present in response
    if (sdkResponse.token) {
      const { storeToken } = await import('./token-storage')
      storeToken(
        sdkResponse.token,
        sdkResponse.expires_in || 1800,
        sdkResponse.refresh_threshold || 300
      )

      // Configure SDK extensions with the new token if available
      if (RoboSystemsExtensions) {
        // Create a new extensions instance with the token
        const extensions = new RoboSystemsExtensions({
          baseUrl: this.client.getConfig().baseUrl,
          credentials: 'include',
          token: sdkResponse.token,
          s3EndpointUrl: process.env.NEXT_PUBLIC_S3_ENDPOINT_URL, // For LocalStack in local dev
        })
        // Store for later use if needed
        if (typeof window !== 'undefined') {
          ;(window as any).__roboSystemsExtensions = extensions
        }
      }
    }

    return {
      user: sdkResponse.user,
      success: true,
      message: sdkResponse.message,
      token: sdkResponse.token,
      expires_in: sdkResponse.expires_in,
      refresh_threshold: sdkResponse.refresh_threshold,
    }
  }

  async checkAuthentication(): Promise<AuthUser | null> {
    try {
      return await this.getCurrentUser()
    } catch {
      return null
    }
  }

  // Clear request deduplication cache (useful after login/logout)
  clearAuthCache(): void {
    this.lastAuthCheck = null
    this.lastError = null
    this.authCheckPromise = null
  }

  /**
   * Send password reset email
   */
  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await forgotPassword({
        client: this.client,
        body: { email } as any,
      })

      return {
        success: true,
        message: 'Password reset email sent if the account exists',
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      return {
        success: false,
        message: 'Failed to send password reset email',
      }
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await resetPassword({
        client: this.client,
        body: {
          token,
          new_password: newPassword,
        },
      })

      // Handle the auth response if login is automatic after reset
      const data = response.data as any
      if (
        data?.token &&
        typeof data.token === 'string' &&
        data.token.length > 0
      ) {
        const { storeToken } = await import('./token-storage')
        storeToken(data.token)
      }

      return {
        success: true,
        message: 'Password reset successfully',
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return {
        success: false,
        message: 'Failed to reset password',
      }
    }
  }

  /**
   * Validate password reset token
   */
  async validateResetToken(token: string): Promise<{
    valid: boolean
    email?: string
    message?: string
  }> {
    try {
      const response = await validateResetToken({
        client: this.client,
        query: { token },
      })

      const data = response.data as any
      return {
        valid: data?.valid === true,
        email: data?.email,
        message: data?.message,
      }
    } catch (error) {
      console.error('Validate reset token error:', error)
      return {
        valid: false,
        message: 'Invalid or expired reset token',
      }
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{
    success: boolean
    message?: string
    user?: AuthUser
  }> {
    try {
      const response = await verifyEmail({
        client: this.client,
        body: { token } as any,
      })

      const data = response.data as any

      // Handle the auth response if login is automatic after verification
      if (
        data?.token &&
        typeof data.token === 'string' &&
        data.token.length > 0
      ) {
        const { storeToken } = await import('./token-storage')
        storeToken(data.token)
      }

      return {
        success: true,
        message: 'Email verified successfully',
        user: data?.user,
      }
    } catch (error) {
      console.error('Verify email error:', error)
      return {
        success: false,
        message: 'Failed to verify email',
      }
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{
    success: boolean
    message?: string
  }> {
    try {
      await (resendVerificationEmail as any)({
        client: this.client,
        body: { email },
      })

      return {
        success: true,
        message: 'Verification email sent if the account exists',
      }
    } catch (error) {
      console.error('Resend verification email error:', error)
      return {
        success: false,
        message: 'Failed to send verification email',
      }
    }
  }

  /**
   * Get password policy requirements
   */
  async getPasswordPolicy(): Promise<{
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecial: boolean
    specialCharacters: string
  }> {
    try {
      const response = await getPasswordPolicy({
        client: this.client,
      })

      const data = response.data as any
      return {
        minLength: data?.min_length || 8,
        requireUppercase: data?.require_uppercase || false,
        requireLowercase: data?.require_lowercase || false,
        requireNumbers: data?.require_numbers || false,
        requireSpecial: data?.require_special || false,
        specialCharacters:
          data?.special_characters || '!@#$%^&*()_+-=[]{}|;:,.<>?',
      }
    } catch (error) {
      console.error('Get password policy error:', error)
      // Return default policy
      return {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecial: true,
        specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      }
    }
  }

  /**
   * Check password strength
   */
  async checkPasswordStrength(password: string): Promise<{
    score: number
    strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
    suggestions: string[]
    meets_policy: boolean
  }> {
    try {
      const response = await checkPasswordStrength({
        client: this.client,
        body: { password } as any,
      })

      const data = response.data as any
      return {
        score: data?.score || 0,
        strength: data?.strength || 'very-weak',
        suggestions: data?.suggestions || [],
        meets_policy: data?.meets_policy || false,
      }
    } catch (error) {
      console.error('Check password strength error:', error)
      // Return basic strength calculation
      let score = 0
      if (password.length >= 8) score += 20
      if (password.length >= 12) score += 20
      if (/[a-z]/.test(password)) score += 20
      if (/[A-Z]/.test(password)) score += 20
      if (/[0-9]/.test(password)) score += 10
      if (/[^a-zA-Z0-9]/.test(password)) score += 10

      return {
        score,
        strength:
          score < 20
            ? 'very-weak'
            : score < 40
              ? 'weak'
              : score < 60
                ? 'fair'
                : score < 80
                  ? 'good'
                  : 'strong',
        suggestions: [],
        meets_policy: score >= 60,
      }
    }
  }

  /**
   * Validate and safely cast SDK response data
   */
  private validateSDKAuthResponse(data: unknown): SDKAuthResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid SDK response: expected object')
    }

    const response = data as any
    if (!response.user || typeof response.user !== 'object') {
      throw new Error('Invalid SDK response: missing or invalid user')
    }

    const user = response.user
    if (!user.id || typeof user.id !== 'string') {
      throw new Error('Invalid SDK response: user missing required id')
    }
    if (!user.email || typeof user.email !== 'string') {
      throw new Error('Invalid SDK response: user missing required email')
    }

    return response as SDKAuthResponse
  }

  private validateSDKCurrentUserResponse(
    data: unknown
  ): SDKCurrentUserResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid SDK response: expected object')
    }

    const response = data as any

    // Check if the response is the user object directly (not nested under 'user' property)
    if (response.id && response.email) {
      return { user: response } as SDKCurrentUserResponse
    }

    // Check if it's nested under 'user' property
    if (!response.user || typeof response.user !== 'object') {
      throw new Error('Invalid SDK response: missing or invalid user')
    }
    return response as SDKCurrentUserResponse
  }
}
