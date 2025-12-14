import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GraphTypeStep } from '../steps/GraphTypeStep'

// Mock the theme
vi.mock('../../../theme', () => ({
  customTheme: {
    card: {},
  },
}))

describe('GraphTypeStep', () => {
  const mockOnTypeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render both entity and generic graph options', () => {
    render(
      <GraphTypeStep selectedType="entity" onTypeChange={mockOnTypeChange} />
    )

    expect(screen.getByText('Entity Graph')).toBeInTheDocument()
    expect(screen.getByText('Generic Graph')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Create a knowledge graph for a specific entity with financial and business schemas'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Create a general-purpose knowledge graph with custom schemas'
      )
    ).toBeInTheDocument()
  })

  it('should highlight entity graph when selected', () => {
    render(
      <GraphTypeStep selectedType="entity" onTypeChange={mockOnTypeChange} />
    )

    const entityCard = screen
      .getByText('Entity Graph')
      .closest('.cursor-pointer')
    expect(entityCard).toHaveClass('ring-2', 'ring-blue-500')
  })

  it('should highlight generic graph when selected', () => {
    render(
      <GraphTypeStep selectedType="generic" onTypeChange={mockOnTypeChange} />
    )

    const genericCard = screen
      .getByText('Generic Graph')
      .closest('.cursor-pointer')
    expect(genericCard).toHaveClass('ring-2', 'ring-orange-500')
  })

  it('should call onTypeChange with "entity" when entity card is clicked', () => {
    render(
      <GraphTypeStep selectedType="generic" onTypeChange={mockOnTypeChange} />
    )

    const entityCard = screen
      .getByText('Entity Graph')
      .closest('.cursor-pointer')
    fireEvent.click(entityCard!)

    expect(mockOnTypeChange).toHaveBeenCalledWith('entity')
    expect(mockOnTypeChange).toHaveBeenCalledTimes(1)
  })

  it('should call onTypeChange with "generic" when generic card is clicked', () => {
    render(
      <GraphTypeStep selectedType="entity" onTypeChange={mockOnTypeChange} />
    )

    const genericCard = screen
      .getByText('Generic Graph')
      .closest('.cursor-pointer')
    fireEvent.click(genericCard!)

    expect(mockOnTypeChange).toHaveBeenCalledWith('generic')
    expect(mockOnTypeChange).toHaveBeenCalledTimes(1)
  })

  it('should show hover effects on cards', () => {
    render(
      <GraphTypeStep selectedType="entity" onTypeChange={mockOnTypeChange} />
    )

    const genericCard = screen
      .getByText('Generic Graph')
      .closest('.cursor-pointer')

    // Should have hover effect classes
    expect(genericCard).toHaveClass('hover:shadow-lg')
    expect(genericCard?.className).toContain('dark:hover:shadow-zinc-700/50')
  })

  it('should display correct icons for each graph type', () => {
    render(
      <GraphTypeStep selectedType="entity" onTypeChange={mockOnTypeChange} />
    )

    // Check that the icons are rendered (we can't easily test the specific icon classes)
    // but we can check the structure
    const entityIcon = screen
      .getByText('Entity Graph')
      .parentElement?.querySelector('svg')
    const genericIcon = screen
      .getByText('Generic Graph')
      .parentElement?.querySelector('svg')

    expect(entityIcon).toBeInTheDocument()
    expect(genericIcon).toBeInTheDocument()
  })

  it('should have proper grid layout', () => {
    render(
      <GraphTypeStep selectedType="entity" onTypeChange={mockOnTypeChange} />
    )

    const container = screen.getByText('Entity Graph').closest('.grid')
    expect(container).toHaveClass('gap-4', 'md:grid-cols-2')
  })

  it('should maintain selection state correctly', () => {
    const { rerender } = render(
      <GraphTypeStep selectedType="entity" onTypeChange={mockOnTypeChange} />
    )

    let entityCard = screen.getByText('Entity Graph').closest('.cursor-pointer')
    let genericCard = screen
      .getByText('Generic Graph')
      .closest('.cursor-pointer')

    expect(entityCard).toHaveClass('ring-2', 'ring-blue-500')
    expect(genericCard).not.toHaveClass('ring-2')

    // Change selection to generic
    rerender(
      <GraphTypeStep selectedType="generic" onTypeChange={mockOnTypeChange} />
    )

    entityCard = screen.getByText('Entity Graph').closest('.cursor-pointer')
    genericCard = screen.getByText('Generic Graph').closest('.cursor-pointer')

    expect(genericCard).toHaveClass('ring-2', 'ring-orange-500')
    expect(entityCard).not.toHaveClass('ring-2')
  })

  it('should be accessible with proper text content', () => {
    render(
      <GraphTypeStep selectedType="entity" onTypeChange={mockOnTypeChange} />
    )

    // Check that all important text is present and accessible
    expect(screen.getByText('Entity Graph')).toBeInTheDocument()
    expect(screen.getByText('Generic Graph')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Create a knowledge graph for a specific entity with financial and business schemas'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Create a general-purpose knowledge graph with custom schemas'
      )
    ).toBeInTheDocument()
  })
})
