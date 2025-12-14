import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockStreamQuery = vi.fn()

vi.mock('@robosystems/client/extensions', () => ({
  streamQuery: mockStreamQuery,
}))

global.AbortController = vi.fn().mockImplementation(() => ({
  abort: vi.fn(),
  signal: {},
}))

import { useStreamingQuery } from '../use-streaming-query'

function createAsyncIterator(items: any[]): AsyncIterableIterator<any> {
  return {
    [Symbol.asyncIterator]() {
      let index = 0
      return {
        async next() {
          if (index >= items.length) {
            return { done: true, value: undefined }
          }
          const value = items[index++]
          return { done: false, value }
        },
      }
    },
  } as AsyncIterableIterator<any>
}

describe('useStreamingQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useStreamingQuery())

    expect(result.current).toMatchObject({
      isStreaming: false,
      results: [],
      error: null,
      status: 'idle',
    })
  })

  it('executes streaming query successfully', async () => {
    const mockBatches = [
      [{ id: 1, name: 'Alice' }],
      [{ id: 2, name: 'Bob' }],
      [{ id: 3, name: 'Charlie' }],
    ]

    mockStreamQuery.mockReturnValue(createAsyncIterator(mockBatches))

    const { result } = renderHook(() => useStreamingQuery())

    await act(async () => {
      await result.current.executeQuery('graph-123', 'MATCH (n) RETURN n')
    })

    expect(result.current.status).toBe('completed')
    expect(result.current.results).toHaveLength(3)
    expect(result.current.totalRows).toBe(3)
    expect(result.current.progress).toBe(100)
  })

  it('passes query parameters to streamQuery', async () => {
    mockStreamQuery.mockReturnValue(createAsyncIterator([[{ id: 1 }]]))

    const { result } = renderHook(() => useStreamingQuery())
    const parameters = { limit: 5 }

    await act(async () => {
      await result.current.executeQuery(
        'graph-123',
        'MATCH (n) RETURN n LIMIT $limit',
        parameters
      )
    })

    expect(mockStreamQuery).toHaveBeenCalledWith(
      'graph-123',
      'MATCH (n) RETURN n LIMIT $limit',
      parameters,
      100
    )
  })

  it('handles empty results', async () => {
    mockStreamQuery.mockReturnValue(createAsyncIterator([]))

    const { result } = renderHook(() => useStreamingQuery())

    await act(async () => {
      await result.current.executeQuery(
        'graph-123',
        'MATCH (n) WHERE false RETURN n'
      )
    })

    expect(result.current.results).toEqual([])
    expect(result.current.totalRows).toBe(0)
    expect(result.current.status).toBe('completed')
  })

  it('handles query execution errors', async () => {
    const error = new Error('Query syntax error')
    mockStreamQuery.mockImplementation(() => {
      throw error
    })

    const { result } = renderHook(() => useStreamingQuery())

    await act(async () => {
      await result.current.executeQuery('graph-123', 'INVALID QUERY')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Query syntax error')
  })

  it('handles non-Error exceptions', async () => {
    mockStreamQuery.mockImplementation(() => {
      throw 'string error'
    })

    const { result } = renderHook(() => useStreamingQuery())

    await act(async () => {
      await result.current.executeQuery('graph-123', 'MATCH (n) RETURN n')
    })

    expect(result.current.error).toBe('Query execution failed')
    expect(result.current.status).toBe('error')
  })

  it('cancels active query', async () => {
    mockStreamQuery.mockReturnValue(createAsyncIterator([[{ id: 1 }]]))

    const { result } = renderHook(() => useStreamingQuery())

    await act(async () => {
      await result.current.executeQuery('graph-123', 'MATCH (n) RETURN n')
      result.current.cancelQuery()
    })

    expect(result.current.status).toBe('cancelled')
    expect(result.current.error).toBe('Query was cancelled')
  })

  it('resets state to initial values', async () => {
    mockStreamQuery.mockReturnValue(createAsyncIterator([[{ id: 1 }]]))

    const { result } = renderHook(() => useStreamingQuery())

    await act(async () => {
      await result.current.executeQuery('graph-123', 'MATCH (n) RETURN n')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current).toMatchObject({
      results: [],
      status: 'idle',
      error: null,
    })
  })
})
