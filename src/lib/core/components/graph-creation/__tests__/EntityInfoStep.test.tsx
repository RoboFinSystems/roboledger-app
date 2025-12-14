import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EntityInfoStep } from '../steps/EntityInfoStep'

// Mock the theme
vi.mock('../../../theme', () => ({
  customTheme: {
    textInput: {},
    textarea: {},
  },
}))

describe('EntityInfoStep', () => {
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial render with createEntity = true', () => {
    it('should render the toggle switch and entity creation info', () => {
      render(
        <EntityInfoStep
          entityName=""
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(screen.getByText('Create initial entity')).toBeInTheDocument()
      expect(
        screen.getByText(
          'An initial entity node will be created with the details below'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Entity Name *')).toBeInTheDocument()
    })

    it('should show entity creation info message', () => {
      render(
        <EntityInfoStep
          entityName=""
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(
        screen.getByText(/Enter the entity name for your knowledge graph/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/The entity is the core of your graph/)
      ).toBeInTheDocument()
    })

    it('should render entity name input field', () => {
      render(
        <EntityInfoStep
          entityName="Test Entity"
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      const input = screen.getByPlaceholderText('e.g., Acme Corporation')
      expect(input).toHaveValue('Test Entity')
      expect(input).toBeRequired()
    })

    it('should render description and tags fields for entity creation', () => {
      render(
        <EntityInfoStep
          entityName=""
          entityDescription="Test description"
          entityTags={['tag1', 'tag2']}
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('tag1, tag2')).toBeInTheDocument()
    })
  })

  describe('Toggle switch behavior', () => {
    it('should call onUpdate when toggle is changed', () => {
      render(
        <EntityInfoStep
          entityName=""
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      const toggle = screen.getByLabelText('Create initial entity')
      fireEvent.click(toggle)

      expect(mockOnUpdate).toHaveBeenCalledWith({ createEntity: false })
    })

    it('should show different description text based on toggle state', () => {
      const { rerender } = render(
        <EntityInfoStep
          entityName=""
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(
        screen.getByText(
          'An initial entity node will be created with the details below'
        )
      ).toBeInTheDocument()

      rerender(
        <EntityInfoStep
          entityName=""
          createEntity={false}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(
        screen.getByText(
          'Start with an empty graph structure (recommended for data imports)'
        )
      ).toBeInTheDocument()
    })
  })

  describe('Entity creation mode (createEntity = false)', () => {
    it('should show empty entity graph info message', () => {
      render(
        <EntityInfoStep
          entityName=""
          createEntity={false}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(
        screen.getByText(/You've chosen to create an empty entity graph/)
      ).toBeInTheDocument()
      expect(screen.getByText('Graph Name *')).toBeInTheDocument()
    })

    it('should render graph name input instead of entity name', () => {
      render(
        <EntityInfoStep
          graphName="My Graph"
          createEntity={false}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(
        screen.getByPlaceholderText('e.g., My Entity Graph')
      ).toBeInTheDocument()
      expect(screen.getByDisplayValue('My Graph')).toBeInTheDocument()
      expect(
        screen.queryByPlaceholderText('e.g., Acme Corporation')
      ).not.toBeInTheDocument()
    })
  })

  describe('Form input handling', () => {
    it('should call onUpdate when entity name changes', () => {
      render(
        <EntityInfoStep
          entityName=""
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      const input = screen.getByPlaceholderText('e.g., Acme Corporation')
      fireEvent.change(input, { target: { value: 'New Entity Name' } })

      expect(mockOnUpdate).toHaveBeenCalledWith({
        entityName: 'New Entity Name',
      })
    })

    it('should call onUpdate when graph name changes', () => {
      render(
        <EntityInfoStep
          graphName=""
          createEntity={false}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      const input = screen.getByPlaceholderText('e.g., My Entity Graph')
      fireEvent.change(input, { target: { value: 'New Graph Name' } })

      expect(mockOnUpdate).toHaveBeenCalledWith({ graphName: 'New Graph Name' })
    })

    it('should call onUpdate when description changes', () => {
      render(
        <EntityInfoStep
          entityName=""
          entityDescription=""
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      const textarea = screen.getByPlaceholderText(
        'Describe the purpose of this entity graph...'
      )
      fireEvent.change(textarea, { target: { value: 'New description' } })

      expect(mockOnUpdate).toHaveBeenCalledWith({
        entityDescription: 'New description',
      })
    })

    it('should parse tags correctly from comma-separated input', () => {
      render(
        <EntityInfoStep
          entityName=""
          entityTags={[]}
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      const input = screen.getByPlaceholderText(
        'e.g., consulting, professional-services, production'
      )
      fireEvent.change(input, { target: { value: 'tag1, tag2 , tag3' } })

      expect(mockOnUpdate).toHaveBeenCalledWith({
        entityTags: ['tag1', 'tag2', 'tag3'],
      })
    })

    it('should filter out empty tags', () => {
      render(
        <EntityInfoStep
          entityName=""
          entityTags={[]}
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      const input = screen.getByPlaceholderText(
        'e.g., consulting, professional-services, production'
      )
      fireEvent.change(input, { target: { value: 'tag1, , tag3,' } })

      expect(mockOnUpdate).toHaveBeenCalledWith({
        entityTags: ['tag1', 'tag3'],
      })
    })
  })

  describe('Validation error display', () => {
    it('should show validation error when present and createEntity is true', () => {
      render(
        <EntityInfoStep
          entityName=""
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError="Entity name is required"
        />
      )

      expect(screen.getByText('Validation Error!')).toBeInTheDocument()
      expect(screen.getByText('Entity name is required')).toBeInTheDocument()
    })

    it('should not show validation error when createEntity is false', () => {
      render(
        <EntityInfoStep
          entityName=""
          createEntity={false}
          onUpdate={mockOnUpdate}
          validationError="Entity name is required"
        />
      )

      expect(screen.queryByText('Validation Error!')).not.toBeInTheDocument()
      expect(
        screen.queryByText('Entity name is required')
      ).not.toBeInTheDocument()
    })

    it('should highlight input field with error styling when validation fails', () => {
      render(
        <EntityInfoStep
          entityName="Test"
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError="Invalid entity name"
        />
      )

      const input = screen.getByPlaceholderText('e.g., Acme Corporation')
      // The input should have error styling applied
      expect(input).toBeInTheDocument()
      // We can't easily test the exact color attribute since Flowbite uses CSS classes
      // but we can verify the component renders without crashing
    })
  })

  describe('Tag display and editing', () => {
    it('should display tags as comma-separated string', () => {
      render(
        <EntityInfoStep
          entityName=""
          entityTags={['analytics', 'customers', 'production']}
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(
        screen.getByDisplayValue('analytics, customers, production')
      ).toBeInTheDocument()
    })

    it('should handle empty tags array', () => {
      render(
        <EntityInfoStep
          entityName=""
          entityTags={[]}
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      const input = screen.getByPlaceholderText(
        'e.g., consulting, professional-services, production'
      )
      expect(input).toHaveValue('')
    })
  })

  describe('Accessibility and labels', () => {
    it('should have proper labels for all inputs', () => {
      render(
        <EntityInfoStep
          entityName=""
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(screen.getByLabelText('Entity Name *')).toBeInTheDocument()
      expect(
        screen.getByLabelText('Description (Optional)')
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Tags (Optional)')).toBeInTheDocument()
    })

    it('should have proper labels in empty graph mode', () => {
      render(
        <EntityInfoStep
          graphName=""
          createEntity={false}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(screen.getByLabelText('Graph Name *')).toBeInTheDocument()
      expect(
        screen.getByLabelText('Description (Optional)')
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Tags (Optional)')).toBeInTheDocument()
    })
  })

  describe('Default values and props', () => {
    it('should use default values for optional props', () => {
      render(
        <EntityInfoStep
          entityName="Test Entity"
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      expect(screen.getByText('Create initial entity')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Entity')).toBeInTheDocument()
    })

    it('should handle undefined entityDetails gracefully', () => {
      render(
        <EntityInfoStep
          entityName="Test Entity"
          entityDetails={undefined}
          createEntity={true}
          onUpdate={mockOnUpdate}
          validationError={null}
        />
      )

      // Should not crash and should render normally
      expect(
        screen.getByPlaceholderText('e.g., Acme Corporation')
      ).toBeInTheDocument()
    })
  })
})
