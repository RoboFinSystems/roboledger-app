import { Label, Radio, Textarea, TextInput } from 'flowbite-react'
import { customTheme } from '../../../theme'

interface GenericGraphStepProps {
  graphName: string
  description: string
  tags: string[]
  schemaType: 'empty' | 'custom'
  customSchema: string
  onGraphNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  onTagsChange: (tags: string[]) => void
  onSchemaTypeChange: (type: 'empty' | 'custom') => void
  onCustomSchemaChange: (schema: string) => void
}

export function GenericGraphStep({
  graphName,
  description,
  tags,
  schemaType,
  customSchema,
  onGraphNameChange,
  onDescriptionChange,
  onTagsChange,
  onSchemaTypeChange,
  onCustomSchemaChange,
}: GenericGraphStepProps) {
  const isValidJson = (str: string): boolean => {
    if (!str.trim()) return true
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="graphName">Graph Name</Label>
          <TextInput
            id="graphName"
            type="text"
            theme={customTheme.textInput}
            placeholder="e.g., Customer Analytics Graph"
            value={graphName}
            onChange={(e) => onGraphNameChange(e.target.value)}
            required
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            A descriptive name for your graph database
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            theme={customTheme.textarea}
            placeholder="Describe the purpose of this graph database..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="tags">Tags (Optional)</Label>
          <TextInput
            id="tags"
            type="text"
            theme={customTheme.textInput}
            placeholder="e.g., analytics, customers, production"
            value={tags.join(', ')}
            onChange={(e) =>
              onTagsChange(
                e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter((t) => t)
              )
            }
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comma-separated tags for organizing your graphs
          </p>
        </div>
      </div>

      {/* Schema Configuration */}
      <div className="space-y-4">
        <Label>Schema Type</Label>
        <div className="space-y-3">
          <div
            role="button"
            tabIndex={0}
            className={`cursor-pointer rounded-lg border p-4 transition-all ${
              schemaType === 'empty'
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            }`}
            onClick={() => onSchemaTypeChange('empty')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSchemaTypeChange('empty')
              }
            }}
          >
            <div className="flex items-start">
              <Radio
                name="schemaType"
                value="empty"
                checked={schemaType === 'empty'}
                onChange={() => onSchemaTypeChange('empty')}
                className="mt-1"
              />
              <div className="ml-3">
                <span className="font-medium text-gray-900 dark:text-white">
                  Empty Graph
                </span>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Start with a completely empty graph database
                </p>
              </div>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            className={`cursor-pointer rounded-lg border p-4 transition-all ${
              schemaType === 'custom'
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            }`}
            onClick={() => onSchemaTypeChange('custom')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSchemaTypeChange('custom')
              }
            }}
          >
            <div className="flex items-start">
              <Radio
                name="schemaType"
                value="custom"
                checked={schemaType === 'custom'}
                onChange={() => onSchemaTypeChange('custom')}
                className="mt-1"
              />
              <div className="ml-3">
                <span className="font-medium text-gray-900 dark:text-white">
                  Custom Schema
                </span>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Define your own schema with nodes and relationships
                </p>
              </div>
            </div>
          </div>
        </div>

        {schemaType === 'custom' && (
          <div>
            <Label htmlFor="customSchema">Schema Definition (JSON)</Label>
            <Textarea
              id="customSchema"
              theme={customTheme.textarea}
              placeholder={`{
  "name": "MyCustomSchema",
  "version": "1.0",
  "description": "Custom schema for my use case",
  "nodes": [
    {
      "name": "Person",
      "properties": {
        "name": "string",
        "age": "integer"
      }
    }
  ],
  "relationships": [
    {
      "name": "KNOWS",
      "from": "Person",
      "to": "Person"
    }
  ]
}`}
              value={customSchema}
              onChange={(e) => onCustomSchemaChange(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            {customSchema && (
              <p className="mt-1 text-sm">
                {isValidJson(customSchema) ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Valid JSON
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    ✗ Invalid JSON syntax
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
