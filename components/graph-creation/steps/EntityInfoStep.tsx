import { Alert, Label, Textarea, TextInput, ToggleSwitch } from 'flowbite-react'
import { HiInformationCircle } from 'react-icons/hi'
import { customTheme } from '../../../theme'
import type { EntityCreate } from '../types'

interface EntityInfoStepProps {
  entityName: string
  entityDetails?: Partial<EntityCreate>
  createEntity?: boolean
  graphName?: string // For when not creating entity
  entityDescription?: string
  entityTags?: string[]
  requireInitialEntity?: boolean // Hide toggle if true
  onUpdate: (updates: {
    entityName?: string
    entityDetails?: Partial<EntityCreate>
    createEntity?: boolean
    graphName?: string
    entityDescription?: string
    entityTags?: string[]
  }) => void
  validationError: string | null
}

export function EntityInfoStep({
  entityName,
  entityDetails,
  createEntity = true,
  graphName = '',
  entityDescription = '',
  entityTags = [],
  requireInitialEntity = false,
  onUpdate,
  validationError,
}: EntityInfoStepProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    onUpdate({
      entityName: name,
    })
  }

  const handleDetailChange = (field: keyof EntityCreate, value: string) => {
    onUpdate({
      entityDetails: {
        ...entityDetails,
        [field]: value || undefined,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
        <div className="flex">
          <HiInformationCircle className="text-primary-400 h-5 w-5" />
          <div className="ml-3">
            <p className="text-primary-800 dark:text-primary-200 text-sm">
              {createEntity ? (
                <>
                  Enter the entity name for your knowledge graph. The entity is
                  the core of your graph - it can be a company, nonprofit, fund,
                  or individual. The entity name becomes your graph name.
                </>
              ) : (
                <>
                  You've chosen to create an empty entity graph. The graph will
                  use the entity schema structure but won't contain any initial
                  data. You can add entities and data after creation.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {!requireInitialEntity && (
        <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
          <ToggleSwitch
            checked={createEntity}
            label="Create initial entity"
            onChange={(checked) => onUpdate({ createEntity: checked })}
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {createEntity
              ? 'An initial entity node will be created with the details below'
              : 'Start with an empty graph structure (recommended for data imports)'}
          </p>
        </div>
      )}

      {validationError && createEntity && (
        <Alert color="failure" icon={HiInformationCircle}>
          <span className="font-medium">Validation Error!</span>{' '}
          {validationError}
        </Alert>
      )}

      {!createEntity ? (
        <div className="grid gap-6">
          <div>
            <Label htmlFor="graphName">Graph Name *</Label>
            <TextInput
              theme={customTheme.textInput}
              id="graphName"
              type="text"
              placeholder="e.g., My Entity Graph"
              value={graphName}
              onChange={(e) => onUpdate({ graphName: e.target.value })}
              required
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A unique name for your entity graph
            </p>
          </div>

          <div>
            <Label htmlFor="entityDescription">Description (Optional)</Label>
            <Textarea
              id="entityDescription"
              theme={customTheme.textarea}
              placeholder="Describe the purpose of this graph database..."
              value={entityDescription}
              onChange={(e) => onUpdate({ entityDescription: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="entityTags">Tags (Optional)</Label>
            <TextInput
              id="entityTags"
              type="text"
              theme={customTheme.textInput}
              placeholder="e.g., analytics, customers, production"
              value={entityTags.join(', ')}
              onChange={(e) =>
                onUpdate({
                  entityTags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter((t) => t),
                })
              }
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comma-separated tags for organizing your graphs
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <div>
            <Label htmlFor="entityName">Entity Name *</Label>
            <TextInput
              theme={customTheme.textInput}
              id="entityName"
              type="text"
              placeholder="e.g., Acme Corporation"
              value={entityName}
              onChange={handleNameChange}
              required
              color={validationError ? 'failure' : undefined}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The primary entity name for your knowledge graph
            </p>
          </div>

          <div>
            <Label htmlFor="entityDescription">Description (Optional)</Label>
            <Textarea
              id="entityDescription"
              theme={customTheme.textarea}
              placeholder="Describe the purpose of this entity graph..."
              value={entityDescription}
              onChange={(e) => onUpdate({ entityDescription: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="entityTags">Tags (Optional)</Label>
            <TextInput
              id="entityTags"
              type="text"
              theme={customTheme.textInput}
              placeholder="e.g., consulting, professional-services, production"
              value={entityTags.join(', ')}
              onChange={(e) =>
                onUpdate({
                  entityTags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter((t) => t),
                })
              }
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comma-separated tags for organizing your graphs
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
