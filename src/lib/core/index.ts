// Root package that re-exports all sub-packages

// Export auth-core with namespace to avoid conflicts
export * as AuthCore from './auth-core'

// Export token storage utilities for JWT authentication
export {
  clearToken,
  getAuthHeader,
  getToken,
  handleAuthResponse,
  hasValidToken,
  storeToken,
} from './auth-core/token-storage'

// Export auth cleanup utilities
export {
  clearUserCookies,
  clearUserLocalStorage,
  clearUserSessionStorage,
  listUserData,
  performLogoutCleanup,
  resetUIState,
} from './auth-core/cleanup'

// Export auth-components
export {
  AppSwitcher,
  AuthGuard,
  AuthProvider,
  SignInForm,
  SignUpForm,
  useAuth,
} from './auth-components'

// Export hooks
export {
  useApiError,
  useBillingStatus,
  useEntities,
  useMediaQuery,
  useToast,
  useUser,
  useUserLimits,
  type BillingStatus,
  type ToastMessage,
} from './hooks'

// Export contexts
export {
  // Graph context exports
  createGraphContext,
  createGraphProvider,
  createUseGraphContext,
  // Credit context exports
  CreditProvider,
  // Credit visibility context
  CreditVisibilityProvider,
  // Entity context exports
  EntityProvider,
  GraphContext,
  GraphProvider,
  // Org context exports
  OrgProvider,
  // Service offerings context
  ServiceOfferingsProvider,
  SidebarProvider,
  useCreditAwareOperation,
  useCreditContext,
  useCredits,
  useCreditVisibility,
  useEntity,
  useGraphContext,
  useOrg,
  useServiceOfferings,
  useSidebarContext,
  type CreditVisibilityProviderProps,
  type EntityContextValue,
  type EntityProviderProps,
  type GraphContextValue,
  type GraphProviderProps,
  type GraphState,
  type OrgContextState,
  type OrgContextValue,
  type OrgProviderProps,
  type ServiceOfferings,
} from './contexts'

// Export lib utilities
export {
  clientGraphCookie,
  clientSidebarCookie,
  creditVisibilityCookie,
  entityCookie,
  graphCookie,
  sidebarCookie,
  type CreditVisibilityCookie,
  type EntityCookie,
  type GraphCookie,
  type SidebarCookie,
} from './lib'

// Export utils
export { generateEntityUri, isUUID, UUID_REGEX } from './utils'

// Export server actions
export {
  clearGraphSelection,
  getGraphSelection,
  persistGraphSelection,
} from './actions/graph-actions'

export {
  clearEntitySelection,
  getEntitySelection,
  persistEntitySelection,
} from './actions/entity-actions'

export {
  getCreditVisibility,
  setCreditVisibility,
} from './actions/credit-visibility-actions'

// Export types
export type { Entities, Entity, User } from './types'

// Export theme
export { customTheme } from './theme'

// Export components
export {
  CreditAlerts,
  CreditAwareButton,
  CreditBadge,
  CreditCostPreview,
  CreditCostTable,
  CreditDisplay,
  CreditLowBanner,
  EntitySelector,
  EntitySelectorCore,
  GraphSelectorCore,
  PageLayout,
  PreferencesCard,
  RepositoryGuard,
  useIsRepository,
  type EntityGroup,
  type EntityLike,
  type EntityRecord,
  type EntitySelectorProps,
  type GraphSelectorProps,
  type GraphWithEntities,
  type SelectableEntity,
} from './components'

// Export graph filters
export {
  composeFilters,
  excludeRepositories,
  excludeSubgraphs,
  GraphFilters,
  hasSchemaExtension,
  onlyRepositories,
  onlyUserGraphs,
} from './components/graph-filters'

// Export graph creation components
export {
  GraphCreationModal,
  GraphCreationPage,
  GraphCreationWizard,
  type GraphCreationConfig,
  type GraphCreationStep,
  type GraphFormData,
} from './components/graph-creation'

// Export app-components
export {
  ApiKeyDisplay,
  ApiKeysCard,
  ApiKeyTable,
  categorizeError,
  ChatHeader,
  ChatInputArea,
  // Chat components
  ChatMessage,
  CoreNavbar,
  CoreSidebar,
  CreateApiKeyModal,
  DeepResearchToggle,
  ErrorType,
  GeneralInformationCard,
  generateMessageId,
  getErrorMessage,
  PageContainer,
  PasswordInformationCard,
  PasswordRequirements,
  SecureApiKeyField,
  SettingsCard,
  SettingsContainer,
  SettingsFormField,
  SettingsPageHeader,
  Spinner,
  StatusAlert,
  ThemeToggle,
} from './ui-components'

// Export commonly used types
export type { AgentType, Message, SidebarItemData } from './ui-components'

// Export SDK with namespace to avoid conflicts
export * as SDK from '@robosystems/client'

// Export SDK Extensions (available with @robosystems/client v0.1.22+)
export {
  EventType,
  executeQuery,
  extensions,
  FileClient,
  MaterializationClient,
  monitorOperation,
  OperationClient,
  QueryClient,
  QueuedQueryError,
  RoboSystemsExtensions,
  SSEClient,
  streamQuery,
  TableClient,
  useMultipleOperations,
  useOperation,
  useQuery,
  useSDKClients,
  useStreamingQuery,
  useTableUpload,
  type FileUploadOptions,
  type FileUploadResult,
  type MaterializationOptions,
  type MaterializationResult,
  type OperationMonitorOptions,
  type OperationProgress,
  type OperationResult,
  type QueryOptions,
  type QueryRequest,
  type QueryResult,
  type QueuedQueryResponse,
  type RoboSystemsExtensionConfig,
  type SSEConfig,
  type SSEEvent,
  type TableInfo,
} from '@robosystems/client/extensions'

// Export task monitoring utilities
export {
  cancelTask,
  getActiveTasks,
  pollTaskStatus,
  taskMonitor,
} from './task-monitoring/taskMonitor'

export {
  getProgressFromStep,
  useEntityCreationTask,
  useTaskMonitoring,
  type UseTaskMonitoringResult,
} from './task-monitoring/hooks'

export type {
  TaskCreateResponse,
  TaskMonitorState,
  TaskPollingOptions,
  TaskStatus,
  TaskStatusResponse,
} from './task-monitoring'

// Export operation monitoring hooks
export {
  useGraphCreation,
  useOperationMonitoring,
  useRepositorySubscription,
  type OperationMonitorState,
  type UseOperationMonitoringResult,
} from './task-monitoring/operationHooks'

// Configure and export client directly for convenience (since it's commonly used)
import { client } from '@robosystems/client'
import { getAuthHeader } from './auth-core/token-storage'

// Configure the SDK client with default settings
// Skip configuration in test environment to prevent connection attempts
if (process.env.NODE_ENV !== 'test') {
  client.setConfig({
    baseUrl:
      process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000',
    // No longer using credentials: 'include' for cookies
    // Using Bearer token authentication instead
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Add Bearer token to all requests if authenticated
  client.interceptors.request.use(async (request) => {
    const authHeader = getAuthHeader()
    if (authHeader) {
      request.headers.set('Authorization', authHeader)
    }
    return request
  })
}

export { client }

// For backward compatibility, also export the main auth types directly
export type { APIKey, AuthContextType, AuthUser } from './auth-core'
