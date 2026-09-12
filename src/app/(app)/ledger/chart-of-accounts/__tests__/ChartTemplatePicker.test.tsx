import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListChartTemplates = vi.fn()
const mockInitializeChartOfAccounts = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listChartTemplates: (...args: any[]) => mockListChartTemplates(...args),
      initializeChartOfAccounts: (...args: any[]) =>
        mockInitializeChartOfAccounts(...args),
    },
  },
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Select: ({ children, id, value, onChange, disabled }: any) => (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
  ),
}))

import { ChartTemplatePicker } from '../components/ChartTemplatePicker'

const TEMPLATES = [
  {
    key: 'saas',
    displayName: 'SaaS / subscription software',
    description: 'Recurring revenue with deferred revenue.',
    accountCount: 20,
  },
  {
    key: 'services',
    displayName: 'Professional services',
    description: 'No inventory, no COGS.',
    accountCount: 27,
  },
]

// The SDK facade throws `Error("<label> failed: " + JSON.stringify(error))`;
// the picker must unwrap that envelope rather than show it.
const sdkError = (label: string, detail: string) =>
  new Error(`${label} failed: ${JSON.stringify({ detail })}`)

describe('ChartTemplatePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListChartTemplates.mockResolvedValue(TEMPLATES)
  })

  it('lists the shipped templates and selects the first by default', async () => {
    render(<ChartTemplatePicker graphId="kg_test" onInitialized={vi.fn()} />)

    expect(await screen.findByText('Professional services')).toBeInTheDocument()
    expect(mockListChartTemplates).toHaveBeenCalledWith('kg_test')
    expect(screen.getByRole('radio', { name: /SaaS/ })).toBeChecked()
    expect(
      screen.getByRole('radio', { name: /Professional services/ })
    ).not.toBeChecked()
    expect(screen.getByText('27 accounts')).toBeInTheDocument()
  })

  it('initializes with the chosen template and legal form, then reports back', async () => {
    const onInitialized = vi.fn()
    const result = {
      taxonomyId: 'tax_new',
      template: 'services',
      entityType: 'llc',
      frameworks: ['rs-gaap'],
    }
    mockInitializeChartOfAccounts.mockResolvedValue(result)
    render(
      <ChartTemplatePicker graphId="kg_test" onInitialized={onInitialized} />
    )

    fireEvent.click(
      await screen.findByRole('radio', { name: /Professional services/ })
    )
    fireEvent.change(screen.getByLabelText('Equity mapping'), {
      target: { value: 'llc' },
    })
    fireEvent.click(screen.getByText('Create chart of accounts'))

    await waitFor(() =>
      expect(mockInitializeChartOfAccounts).toHaveBeenCalledWith(
        'kg_test',
        'services',
        { entityType: 'llc' }
      )
    )
    expect(onInitialized).toHaveBeenCalledWith(result)
  })

  it("sends a null legal form when the entity's own is kept", async () => {
    mockInitializeChartOfAccounts.mockResolvedValue({ taxonomyId: 'tax_new' })
    render(<ChartTemplatePicker graphId="kg_test" onInitialized={vi.fn()} />)

    fireEvent.click(await screen.findByText('Create chart of accounts'))

    await waitFor(() =>
      expect(mockInitializeChartOfAccounts).toHaveBeenCalledWith(
        'kg_test',
        'saas',
        { entityType: null }
      )
    )
  })

  it('unwraps the SDK envelope and explains the one-time refusal', async () => {
    mockInitializeChartOfAccounts.mockRejectedValue(
      sdkError(
        'Initialize chart of accounts',
        'This graph already has a chart of accounts; a chart is never replaced.'
      )
    )
    const onInitialized = vi.fn()
    render(
      <ChartTemplatePicker graphId="kg_test" onInitialized={onInitialized} />
    )

    fireEvent.click(await screen.findByText('Create chart of accounts'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('already has a chart of accounts')
    expect(alert).toHaveTextContent('Reload the page')
    expect(alert).not.toHaveTextContent('{"detail"')
    expect(onInitialized).not.toHaveBeenCalled()
  })

  it('shows a warning when the templates cannot be loaded', async () => {
    mockListChartTemplates.mockRejectedValue(
      sdkError('List chart templates', 'boom')
    )
    render(<ChartTemplatePicker graphId="kg_test" onInitialized={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load chart templates: boom'
    )
    expect(
      screen.queryByText('Create chart of accounts')
    ).not.toBeInTheDocument()
  })
})
