import { customTheme, SDK } from '@/lib/core'
import { Alert, Label, Select, Spinner } from 'flowbite-react'
import { useEffect, useState, type FC } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'

interface SchemaExtensionSelectorProps {
  selectedExtensions: string[]
  onExtensionsChange: (extensions: string[]) => void
  disabled?: boolean
}

const SchemaExtensionSelector: FC<SchemaExtensionSelectorProps> = ({
  selectedExtensions,
  onExtensionsChange,
  disabled = false,
}) => {
  const [extensions, setExtensions] = useState<SDK.AvailableExtension[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Call the available extensions endpoint using the SDK
        const response = await SDK.getAvailableExtensions()

        if (response.data) {
          setExtensions(response.data.extensions)
        }
      } catch (err) {
        console.error('Failed to fetch extensions:', err)
        setError('Failed to load available extensions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExtensions()
  }, [])

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    )
    onExtensionsChange(selectedValues)
  }

  if (error) {
    return (
      <Alert theme={customTheme.alert} color="failure">
        <HiExclamationCircle className="h-4 w-4" />
        <span className="font-medium">Error!</span> {error}
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <Label theme={customTheme.label} htmlFor="extensions">
          Schema Extensions <span className="text-gray-500">(Optional)</span>
        </Label>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
            <Spinner size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Loading extensions...
            </span>
          </div>
        ) : (
          <Select
            id="extensions"
            theme={customTheme.select}
            multiple
            value={selectedExtensions}
            onChange={handleSelectionChange}
            disabled={disabled}
            size={Math.min(extensions.length + 1, 6)} // Show up to 6 options
          >
            {extensions.map((extension) => (
              <option key={extension.name} value={extension.name}>
                {extension.description || extension.name}
              </option>
            ))}
          </Select>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Hold Ctrl/Cmd to select multiple extensions. Leave empty for base
          schema only.
          {selectedExtensions.length > 0 && (
            <span className="ml-2 font-medium">
              Selected: {selectedExtensions.join(', ')}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

export default SchemaExtensionSelector
