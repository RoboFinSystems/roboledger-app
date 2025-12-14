// Mock implementation of @robosystems/client for Vitest tests
import { vi } from 'vitest'

const mockClient = {
  setConfig: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  getConfig: vi.fn(),
}

export const loginUser = vi.fn()
export const registerUser = vi.fn()
export const logoutUser = vi.fn()
export const getCurrentAuthUser = vi.fn()
export const refreshAuthSession = vi.fn()
export const generateSsoToken = vi.fn()
export const ssoLogin = vi.fn()
export const ssoTokenExchange = vi.fn()
export const completeSsoAuth = vi.fn()
export const forgotPassword = vi.fn()
export const resendVerificationEmail = vi.fn()
export const resetPassword = vi.fn()
export const validateResetToken = vi.fn()
export const verifyEmail = vi.fn()
export const checkPasswordStrength = vi.fn()
export const getPasswordPolicy = vi.fn()

// API Key functions
export const createUserApiKey = vi.fn()
export const listUserApiKeys = vi.fn()
export const revokeUserApiKey = vi.fn()
export const updateUserApiKey = vi.fn()

// User functions
export const getCurrentUser = vi.fn()
export const updateUser = vi.fn()
export const updateUserPassword = vi.fn()

// Graph functions
export const getGraphs = vi.fn()
export const selectGraph = vi.fn()
export const createGraph = vi.fn()
export const getGraphMetrics = vi.fn()
export const getGraphUsageStats = vi.fn()

// Credit functions
export const getAllCreditSummaries = vi.fn()
export const getCreditSummary = vi.fn()
export const listCreditTransactions = vi.fn()
export const checkCreditBalance = vi.fn()

// Backup functions
export const createBackup = vi.fn()
export const listBackups = vi.fn()
export const restoreBackup = vi.fn()
export const exportBackup = vi.fn()
export const getBackupStats = vi.fn()
export const getBackupDownloadUrl = vi.fn()

// Database functions
export const getDatabaseHealth = vi.fn()
export const getDatabaseInfo = vi.fn()

// Operation functions
export const getOperationStatus = vi.fn()
export const cancelOperation = vi.fn()
export const streamOperationEvents = vi.fn()

// Schema functions
export const getAvailableExtensions = vi.fn()
export const getGraphSchemaInfo = vi.fn()
export const validateSchema = vi.fn()
export const exportGraphSchema = vi.fn()
export const listSchemaExtensions = vi.fn()

// Query functions
export const executeCypherQuery = vi.fn()

// Service functions
export const getServiceOfferings = vi.fn()

// MCP functions
export const listMcpTools = vi.fn()
export const callMcpTool = vi.fn()

// Billing functions
export const getCurrentGraphBill = vi.fn()
export const getGraphMonthlyBill = vi.fn()
export const getGraphBillingHistory = vi.fn()
export const getGraphUsageDetails = vi.fn()

// Connection functions
export const getConnectionOptions = vi.fn()
export const listConnections = vi.fn()
export const createConnection = vi.fn()
export const deleteConnection = vi.fn()
export const getConnection = vi.fn()
export const syncConnection = vi.fn()
export const createLinkToken = vi.fn()
export const exchangeLinkToken = vi.fn()

// Usage functions
export const getUserLimits = vi.fn()
export const getUserUsage = vi.fn()
export const getUserUsageOverview = vi.fn()
export const getDetailedUserAnalytics = vi.fn()

// Storage functions
export const getStorageUsage = vi.fn()
export const checkStorageLimits = vi.fn()

// Shared repository functions
export const getUserSharedSubscriptions = vi.fn()
export const subscribeToSharedRepository = vi.fn()
export const upgradeSharedRepositorySubscription = vi.fn()
export const cancelSharedRepositorySubscription = vi.fn()
export const getSharedRepositoryCredits = vi.fn()
export const getRepositoryCredits = vi.fn()

// Client
export const client = mockClient
