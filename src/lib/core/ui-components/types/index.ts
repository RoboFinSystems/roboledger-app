import type { AuthUser } from '../../auth-core/types'

export interface ApiKey {
  id: string
  name: string
  graphId?: string
  createdAt: Date | string
  lastUsedAt?: Date | string | null
  expiresAt?: Date | string | null
  isActive: boolean
  isSystem: boolean
}

export interface ApiKeyWithValue extends ApiKey {
  key: string
}

export interface GraphInfo {
  graphId: string
  graphName: string
  isSelected: boolean
}

export interface UserGraphsResponse {
  graphs: GraphInfo[]
}

export interface UserSettingsProps {
  user: AuthUser
}

export interface PasswordUpdateData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserUpdateData {
  username: string
  email: string
}

export interface CreateApiKeyData {
  name: string
  expiresInDays: number
}

export type { AuthUser } from '../../auth-core/types'
