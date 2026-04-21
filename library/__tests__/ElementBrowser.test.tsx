import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ElementBrowser } from '../components/ElementBrowser'

type MockClient = {
  listLibraryElements: ReturnType<typeof vi.fn>
  searchLibraryElements: ReturnType<typeof vi.fn>
}

const makeClient = (overrides: Partial<MockClient> = {}): MockClient => ({
  listLibraryElements: vi.fn().mockResolvedValue([]),
  searchLibraryElements: vi.fn().mockResolvedValue([]),
  ...overrides,
})

const baseProps = {
  graphId: 'library',
  taxonomyId: 'tax-1',
  selectedElementId: null,
  onSelectElement: vi.fn(),
}

describe('ElementBrowser', () => {
  it('shows loading state while the fetch is pending', () => {
    const client = makeClient({
      listLibraryElements: vi.fn(() => new Promise(() => {})),
    })

    render(<ElementBrowser {...baseProps} client={client as any} />)

    expect(screen.getByText(/loading…/i)).toBeInTheDocument()
  })

  it('shows empty-state message when no elements match', async () => {
    const client = makeClient()

    render(<ElementBrowser {...baseProps} client={client as any} />)

    await waitFor(() =>
      expect(
        screen.getByText(/no elements match these filters/i)
      ).toBeInTheDocument()
    )
    expect(client.listLibraryElements).toHaveBeenCalledWith(
      'library',
      expect.objectContaining({ taxonomyId: 'tax-1', limit: 50, offset: 0 })
    )
  })

  it('shows error alert when the fetch rejects', async () => {
    const client = makeClient({
      listLibraryElements: vi.fn().mockRejectedValue(new Error('boom')),
    })

    render(<ElementBrowser {...baseProps} client={client as any} />)

    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument())
  })

  it('renders element rows when the fetch resolves with data', async () => {
    const client = makeClient({
      listLibraryElements: vi.fn().mockResolvedValue([
        {
          id: 'el-1',
          qname: 'us-gaap:Assets',
          name: 'Assets',
          classification: 'asset',
          elementType: 'monetary',
          isAbstract: false,
        },
      ]),
    })

    render(<ElementBrowser {...baseProps} client={client as any} />)

    await waitFor(() =>
      expect(screen.getByText('us-gaap:Assets')).toBeInTheDocument()
    )
    expect(screen.getByText('Assets')).toBeInTheDocument()
  })
})
