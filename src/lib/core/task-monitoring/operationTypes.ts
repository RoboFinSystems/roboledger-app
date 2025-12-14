/**
 * TypeScript types for the unified SSE operation system
 */

// ============================================
// Core Operation Types
// ============================================

export interface Operation {
  operation_id: string
  status: OperationStatus
  created_at: string
  updated_at?: string
  completed_at?: string
  error?: string
  result?: any
  metadata?: OperationMetadata
}

export type OperationStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface OperationMetadata {
  operation_type: string
  graph_id?: string
  user_id?: string
  request_id?: string
  duration_ms?: number
  credits_used?: number
}

// ============================================
// SSE Event Types
// ============================================

export interface SSEEvent<T = any> {
  event: string
  data: T
  id?: string
  retry?: number
}

export interface OperationStartedEvent {
  operation_id: string
  operation_type: string
  message?: string
  timestamp: string
}

export interface OperationProgressEvent {
  operation_id: string
  progress_percent: number
  message: string
  current_step?: number
  total_steps?: number
  timestamp: string
}

export interface OperationCompletedEvent {
  operation_id: string
  result: any
  duration_ms: number
  credits_used?: number
  timestamp: string
}

export interface OperationErrorEvent {
  operation_id: string
  error: string
  code?: string
  details?: any
  timestamp: string
}

export interface OperationCancelledEvent {
  operation_id: string
  reason?: string
  timestamp: string
}

// ============================================
// Graph Creation Types
// ============================================

export interface CreateGraphRequest {
  graph_type: 'generic' | 'company'
  graph_name: string
  description?: string
  company_name?: string
  company_identifier?: string
  company_identifier_type?: 'ein' | 'name'
  metadata?: Record<string, any>
}

export interface CreateGraphResponse {
  graph_id: string
  graph_type: 'generic' | 'company'
  status: 'created' | 'pending'
  operation_id?: string
  created_at: string
  metadata?: Record<string, any>
}

// ============================================
// Query Execution Types
// ============================================

export interface ExecuteQueryRequest {
  query: string
  parameters?: Record<string, any>
  mode?: 'auto' | 'sync' | 'async' | 'stream'
  chunk_size?: number
  timeout?: number
  test_mode?: boolean
}

export interface ExecuteQueryResponse {
  // Synchronous response
  data?: any[]
  columns?: string[]
  row_count?: number
  execution_time_ms?: number

  // Asynchronous response
  status?: 'queued'
  operation_id?: string
  queue_position?: number
  estimated_wait_seconds?: number
}

export interface QueryChunkEvent {
  chunk_number: number
  total_chunks?: number
  rows: any[]
  columns?: string[]
  has_more: boolean
}

// ============================================
// Data Import Types
// ============================================

export interface DataImportRequest {
  graph_id: string
  source_type: 'csv' | 'json' | 'parquet' | 's3'
  source_uri: string
  target_table: string
  mapping?: Record<string, string>
  options?: DataImportOptions
}

export interface DataImportOptions {
  batch_size?: number
  skip_errors?: boolean
  validate?: boolean
  transform?: string // JavaScript transform function
}

export interface DataImportResponse {
  operation_id: string
  status: 'started' | 'queued'
  estimated_rows?: number
  estimated_duration_ms?: number
}

export interface DataImportProgressEvent {
  operation_id: string
  rows_processed: number
  total_rows: number
  errors_count: number
  progress_percent: number
  current_batch?: number
  total_batches?: number
}

// ============================================
// Backup/Restore Types
// ============================================

export interface BackupRequest {
  graph_id: string
  backup_type: 'full' | 'incremental'
  destination?: string
  include_metadata?: boolean
}

export interface BackupResponse {
  operation_id: string
  backup_id?: string
  status: 'started' | 'queued'
  estimated_size_mb?: number
}

export interface RestoreRequest {
  backup_id: string
  target_graph_id?: string
  restore_type: 'full' | 'schema_only' | 'data_only'
}

export interface RestoreResponse {
  operation_id: string
  status: 'started' | 'queued'
  new_graph_id?: string
}

// ============================================
// Operation Management Types
// ============================================

export interface GetOperationStatusRequest {
  operation_id: string
}

export interface GetOperationStatusResponse {
  operation: Operation
  events?: OperationEvent[]
}

export interface CancelOperationRequest {
  operation_id: string
  reason?: string
}

export interface CancelOperationResponse {
  success: boolean
  message?: string
}

export interface ListOperationsRequest {
  graph_id?: string
  status?: OperationStatus
  operation_type?: string
  limit?: number
  offset?: number
  since?: string
}

export interface ListOperationsResponse {
  operations: Operation[]
  total_count: number
  has_more: boolean
}

// ============================================
// Operation Event Union Type
// ============================================

export type OperationEvent =
  | { type: 'started'; data: OperationStartedEvent }
  | { type: 'progress'; data: OperationProgressEvent }
  | { type: 'completed'; data: OperationCompletedEvent }
  | { type: 'error'; data: OperationErrorEvent }
  | { type: 'cancelled'; data: OperationCancelledEvent }
  | { type: 'query_chunk'; data: QueryChunkEvent }
  | { type: 'import_progress'; data: DataImportProgressEvent }

// ============================================
// Helper Type Guards
// ============================================

export function isOperationStarted(
  event: OperationEvent
): event is { type: 'started'; data: OperationStartedEvent } {
  return event.type === 'started'
}

export function isOperationProgress(
  event: OperationEvent
): event is { type: 'progress'; data: OperationProgressEvent } {
  return event.type === 'progress'
}

export function isOperationCompleted(
  event: OperationEvent
): event is { type: 'completed'; data: OperationCompletedEvent } {
  return event.type === 'completed'
}

export function isOperationError(
  event: OperationEvent
): event is { type: 'error'; data: OperationErrorEvent } {
  return event.type === 'error'
}

export function isOperationCancelled(
  event: OperationEvent
): event is { type: 'cancelled'; data: OperationCancelledEvent } {
  return event.type === 'cancelled'
}

export function isQueryChunk(
  event: OperationEvent
): event is { type: 'query_chunk'; data: QueryChunkEvent } {
  return event.type === 'query_chunk'
}

export function isImportProgress(
  event: OperationEvent
): event is { type: 'import_progress'; data: DataImportProgressEvent } {
  return event.type === 'import_progress'
}

// ============================================
// Utility Functions
// ============================================

export function isOperationActive(status: OperationStatus): boolean {
  return status === 'pending' || status === 'running'
}

export function isOperationTerminal(status: OperationStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

export function getOperationDuration(operation: Operation): number | null {
  if (!operation.created_at || !operation.completed_at) {
    return null
  }
  const start = new Date(operation.created_at).getTime()
  const end = new Date(operation.completed_at).getTime()
  return end - start
}

export function formatOperationStatus(status: OperationStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'running':
      return 'Running'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}
