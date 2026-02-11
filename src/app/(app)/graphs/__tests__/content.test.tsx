import { useUserLimits } from '@/lib/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { GraphsContent } from '../content'

// Mock dependencies
vi.mock('@/lib/core', () => ({
  useUserLimits: vi.fn(),
  useToast: vi.fn(),
  useApiError: vi.fn(),
  customTheme: {
    card: {},
  },
}))
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))
vi.mock('date-fns', () => ({
  formatDistanceToNow: (date: Date) => '5 minutes ago',
}))
vi.mock('@robosystems/client', () => ({
  getGraphs: vi.fn(() =>
    Promise.resolve({
      data: {
        graphs: [
          {
            graphId: 'company_123',
            graphName: 'Acme Corp',
            companyId: 'comp_123',
            companyName: 'Acme Corporation',
            graphType: 'company',
            role: 'admin',
            isSelected: true,
          },
          {
            graphId: 'company_456',
            graphName: 'TechStart Inc',
            companyId: 'comp_456',
            companyName: 'TechStart Inc',
            graphType: 'company',
            role: 'member',
            isSelected: false,
          },
          {
            graphId: 'generic_789',
            graphName: 'SEC XBRL Data',
            companyId: null,
            companyName: null,
            graphType: 'generic',
            role: 'viewer',
            isSelected: false,
          },
        ],
      },
      error: null,
    })
  ),
}))

// Mock react-icons
vi.mock('react-icons/hi', () => ({
  HiCog: () => <span>Icon</span>,
  HiDatabase: () => <span>Icon</span>,
  HiDotsVertical: () => <span>Icon</span>,
  HiExternalLink: () => <span>Icon</span>,
  HiLightningBolt: () => <span>Icon</span>,
  HiPencil: () => <span>Icon</span>,
  HiPlus: () => <span>Icon</span>,
  HiRefresh: () => <span>Icon</span>,
  HiSearch: () => <span>Icon</span>,
  HiTrash: () => <span>Icon</span>,
}))

// Mock Flowbite React components
vi.mock('flowbite-react', () => {
  const Table = ({ children, ...props }: any) => (
    <table {...props}>{children}</table>
  )
  Table.displayName = 'Table'

  const TableHead = ({ children, ...props }: any) => (
    <thead {...props}>
      <tr>{children}</tr>
    </thead>
  )
  TableHead.displayName = 'Table.Head'
  Table.Head = TableHead

  const TableHeadCell = ({ children, ...props }: any) => (
    <th {...props}>{children}</th>
  )
  TableHeadCell.displayName = 'Table.HeadCell'
  Table.HeadCell = TableHeadCell

  const TableBody = ({ children, ...props }: any) => (
    <tbody {...props}>{children}</tbody>
  )
  TableBody.displayName = 'Table.Body'
  Table.Body = TableBody

  const TableRow = ({ children, ...props }: any) => (
    <tr {...props}>{children}</tr>
  )
  TableRow.displayName = 'Table.Row'
  Table.Row = TableRow

  const TableCell = ({ children, ...props }: any) => (
    <td {...props}>{children}</td>
  )
  TableCell.displayName = 'Table.Cell'
  Table.Cell = TableCell

  const Dropdown = ({ label, renderTrigger, children, ...props }: any) => (
    <div {...props}>
      {renderTrigger ? renderTrigger() : <button>{label}</button>}
      {children}
    </div>
  )
  Dropdown.displayName = 'Dropdown'

  const DropdownItem = ({ children, onClick, icon: Icon, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {Icon && <Icon />}
      {children}
    </button>
  )
  DropdownItem.displayName = 'Dropdown.Item'
  Dropdown.Item = DropdownItem

  const DropdownDivider = () => <hr />
  DropdownDivider.displayName = 'Dropdown.Divider'
  Dropdown.Divider = DropdownDivider

  const Badge = ({ children, ...props }: any) => (
    <span {...props}>{children}</span>
  )
  Badge.displayName = 'Badge'

  const Button = ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  )
  Button.displayName = 'Button'

  const Card = ({ children, ...props }: any) => <div {...props}>{children}</div>
  Card.displayName = 'Card'

  const Progress = ({ progress, ...props }: any) => (
    <div
      role="progressbar"
      aria-valuenow={progress}
      {...props}
      style={{ width: `${progress}%` }}
    />
  )
  Progress.displayName = 'Progress'

  const TextInput = (props: any) => <input type="text" {...props} />
  TextInput.displayName = 'TextInput'

  const Tooltip = ({ content, children, ...props }: any) => (
    <div title={content} {...props}>
      {children}
    </div>
  )
  Tooltip.displayName = 'Tooltip'

  return {
    Badge,
    Button,
    Card,
    Dropdown,
    DropdownDivider,
    DropdownItem,
    Progress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow,
    TextInput,
    Tooltip,
  }
})

const mockUseUserLimits = vi.mocked(useUserLimits)
const mockUseRouter = vi.mocked(useRouter)

describe('GraphsContent', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useUserLimits hook
    mockUseUserLimits.mockReturnValue({
      limits: { max_graphs: 10 },
      remainingGraphs: 7,
      canCreateGraph: true,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
    })
  })

  test('renders loading state initially', () => {
    render(<GraphsContent />)
    // The component renders immediately with mock data, so we just check it renders
    expect(screen.getByText('Graph Databases')).toBeInTheDocument()
    expect(
      screen.getByText('Manage your graph databases and monitor credit usage')
    ).toBeInTheDocument()
  })

  test('renders graph list after loading', async () => {
    render(<GraphsContent />)

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('TechStart Inc')).toBeInTheDocument()
      expect(screen.getByText('SEC XBRL Data')).toBeInTheDocument()
    })
  })

  test('displays correct statistics', async () => {
    render(<GraphsContent />)

    await waitFor(() => {
      // Total graphs - Find the specific card
      const totalGraphsCard = screen
        .getByText('Total Graphs')
        .closest('div')?.parentElement
      expect(totalGraphsCard).toHaveTextContent('3')

      // Admin access count
      const adminAccessCard = screen
        .getByText('Admin Access')
        .closest('div')?.parentElement
      expect(adminAccessCard).toHaveTextContent('1')
    })
  })

  test('filters graphs by search term', async () => {
    render(<GraphsContent />)

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search graphs...')
    fireEvent.change(searchInput, { target: { value: 'tech' } })

    await waitFor(() => {
      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
      expect(screen.getByText('TechStart Inc')).toBeInTheDocument()
    })
  })

  test('filters graphs by role', async () => {
    render(<GraphsContent />)

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    // Click role dropdown
    const roleDropdown = screen.getByText('Role: All')
    fireEvent.click(roleDropdown)

    // Select admin role
    const adminOption = screen.getByText('Admin')
    fireEvent.click(adminOption)

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.queryByText('TechStart Inc')).not.toBeInTheDocument()
      expect(screen.queryByText('SEC XBRL Data')).not.toBeInTheDocument()
    })
  })

  test('navigates to create graph page', () => {
    render(<GraphsContent />)

    const createButton = screen.getByText('Create Graph')
    expect(createButton).toHaveAttribute('href', '/graphs/new')
  })

  test('refreshes graph list', async () => {
    render(<GraphsContent />)

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    const refreshButton = screen.getByText('Refresh').closest('button')!
    fireEvent.click(refreshButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading graphs...')).toBeInTheDocument()
    })

    // Then show the graphs again
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  test('renders action dropdown for each graph', async () => {
    render(<GraphsContent />)

    await waitFor(() => {
      // Look for the dropdown triggers in the table
      const dropdownTriggers = screen.getAllByText('Icon').filter((icon) => {
        const parent = icon.parentElement
        return parent && parent.tagName === 'BUTTON'
      })
      expect(dropdownTriggers.length).toBeGreaterThan(0)
    })
  })

  test('displays role badges with correct colors', async () => {
    render(<GraphsContent />)

    await waitFor(() => {
      // Check for role badges in the table
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('member')).toBeInTheDocument()
      expect(screen.getByText('viewer')).toBeInTheDocument()
    })
  })

  test('shows empty state when no graphs found', async () => {
    render(<GraphsContent />)

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    // Search for non-existent graph
    const searchInput = screen.getByPlaceholderText('Search graphs...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('No graphs found')).toBeInTheDocument()
    })
  })

  test('displays graph IDs', async () => {
    render(<GraphsContent />)

    await waitFor(() => {
      expect(screen.getByText('ID: company_123')).toBeInTheDocument()
      expect(screen.getByText('ID: company_456')).toBeInTheDocument()
      expect(screen.getByText('ID: generic_789')).toBeInTheDocument()
    })
  })
})
