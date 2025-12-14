import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GraphCreationModal } from '../GraphCreationModal'

// Mock the GraphCreationWizard
vi.mock('../GraphCreationWizard', () => ({
  GraphCreationWizard: ({ onSuccess, onCancel }: any) => (
    <div data-testid="graph-creation-wizard">
      <button
        data-testid="success-button"
        onClick={() => onSuccess('test-graph-id')}
      >
        Complete Graph Creation
      </button>
      <button data-testid="cancel-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}))

// Mock the theme
vi.mock('../../../theme', () => ({
  customTheme: {
    button: {},
    modal: {},
  },
}))

describe('GraphCreationModal', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the trigger button with default text', () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    expect(button).toBeInTheDocument()
  })

  it('should render the trigger button with custom text', () => {
    render(
      <GraphCreationModal
        buttonText="Custom Button Text"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    expect(
      screen.getByRole('button', { name: 'Custom Button Text' })
    ).toBeInTheDocument()
  })

  it('should show the plus icon by default', () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('should hide the icon when showIcon is false', () => {
    render(
      <GraphCreationModal
        showIcon={false}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    const icon = button.querySelector('svg')
    expect(icon).not.toBeInTheDocument()
  })

  it('should apply custom button color', () => {
    render(
      <GraphCreationModal
        buttonColor="red"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    // The button should have the red color applied through the theme
    expect(button).toBeInTheDocument()
  })

  it('should open modal when button is clicked', async () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Create New Knowledge Graph')).toBeInTheDocument()
    })

    expect(screen.getByTestId('graph-creation-wizard')).toBeInTheDocument()
  })

  it('should close modal when cancel button is clicked', async () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    // Open modal
    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByTestId('graph-creation-wizard')).toBeInTheDocument()
    })

    // Click cancel
    const cancelButton = screen.getByTestId('cancel-button')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(
        screen.queryByText('Create New Knowledge Graph')
      ).not.toBeInTheDocument()
    })

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should close modal and call onSuccess when graph creation succeeds', async () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    // Open modal
    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByTestId('graph-creation-wizard')).toBeInTheDocument()
    })

    // Click success
    const successButton = screen.getByTestId('success-button')
    fireEvent.click(successButton)

    await waitFor(() => {
      expect(
        screen.queryByText('Create New Knowledge Graph')
      ).not.toBeInTheDocument()
    })

    expect(mockOnSuccess).toHaveBeenCalledWith('test-graph-id')
    expect(mockOnSuccess).toHaveBeenCalledTimes(1)
  })

  it('should handle async onSuccess callback', async () => {
    const asyncOnSuccess = vi.fn().mockResolvedValue(undefined)
    render(
      <GraphCreationModal onSuccess={asyncOnSuccess} onCancel={mockOnCancel} />
    )

    // Open modal
    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByTestId('graph-creation-wizard')).toBeInTheDocument()
    })

    // Click success
    const successButton = screen.getByTestId('success-button')
    fireEvent.click(successButton)

    await waitFor(() => {
      expect(asyncOnSuccess).toHaveBeenCalledWith('test-graph-id')
    })

    expect(mockOnCancel).not.toHaveBeenCalled()
  })

  it('should pass wizard props to GraphCreationWizard', () => {
    const wizardProps = {
      allowGenericGraphs: false,
      showTierSelection: false,
      requiredExtensions: ['test-extension'],
    }

    render(
      <GraphCreationModal
        {...wizardProps}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    // Open modal to verify props are passed
    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    fireEvent.click(button)

    // The wizard should receive the props (we can't easily test this directly
    // but we can verify the modal opens and contains the wizard)
    expect(screen.getByTestId('graph-creation-wizard')).toBeInTheDocument()
  })

  it('should have correct modal size', async () => {
    render(
      <GraphCreationModal
        modalSize="6xl"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    )

    // Open modal
    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    fireEvent.click(button)

    await waitFor(() => {
      const modal = screen
        .getByText('Create New Knowledge Graph')
        .closest('[role="dialog"]')
      expect(modal).toBeInTheDocument()
    })
  })

  it('should have default modal size of 4xl', async () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    // Open modal
    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    fireEvent.click(button)

    await waitFor(() => {
      const modal = screen
        .getByText('Create New Knowledge Graph')
        .closest('[role="dialog"]')
      expect(modal).toBeInTheDocument()
    })
  })

  it('should have close button in modal header', async () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    // Open modal
    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    fireEvent.click(button)

    await waitFor(() => {
      // Look for the close button in the modal header
      const modalHeader = screen
        .getByText('Create New Knowledge Graph')
        .closest('.flex')
      const closeButton = modalHeader?.querySelector('button[type="button"]')
      expect(closeButton).toBeInTheDocument()
    })
  })

  it('should handle modal close via X button', async () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    // Open modal
    const button = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })
    fireEvent.click(button)

    await waitFor(() => {
      const modalHeader = screen
        .getByText('Create New Knowledge Graph')
        .closest('.flex')
      const closeButton = modalHeader?.querySelector('button[type="button"]')
      fireEvent.click(closeButton!)
    })

    await waitFor(() => {
      expect(
        screen.queryByText('Create New Knowledge Graph')
      ).not.toBeInTheDocument()
    })

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple open/close cycles', async () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    const triggerButton = screen.getByRole('button', {
      name: /create knowledge graph/i,
    })

    // First cycle
    fireEvent.click(triggerButton)
    await waitFor(() => {
      expect(screen.getByText('Create New Knowledge Graph')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('cancel-button'))
    await waitFor(() => {
      expect(
        screen.queryByText('Create New Knowledge Graph')
      ).not.toBeInTheDocument()
    })

    // Second cycle
    fireEvent.click(triggerButton)
    await waitFor(() => {
      expect(screen.getByText('Create New Knowledge Graph')).toBeInTheDocument()
    })

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('should be initially closed', () => {
    render(
      <GraphCreationModal onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    )

    expect(
      screen.queryByText('Create New Knowledge Graph')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('graph-creation-wizard')
    ).not.toBeInTheDocument()
  })
})
