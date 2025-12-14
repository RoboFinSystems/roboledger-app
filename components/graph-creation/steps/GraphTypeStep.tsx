import { Card } from 'flowbite-react'
import { HiDatabase, HiOfficeBuilding } from 'react-icons/hi'
import { customTheme } from '../../../theme'

interface GraphTypeStepProps {
  selectedType: 'entity' | 'generic'
  onTypeChange: (type: 'entity' | 'generic') => void
}

export function GraphTypeStep({
  selectedType,
  onTypeChange,
}: GraphTypeStepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card
        theme={customTheme.card}
        className={`cursor-pointer transition-all ${
          selectedType === 'entity'
            ? 'ring-2 ring-blue-500 dark:ring-blue-400'
            : 'hover:shadow-lg dark:hover:shadow-zinc-700/50'
        }`}
        onClick={() => onTypeChange('entity')}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <HiOfficeBuilding className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Entity Graph
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create a knowledge graph for a specific entity with financial and
            business schemas
          </p>
        </div>
      </Card>

      <Card
        theme={customTheme.card}
        className={`cursor-pointer transition-all ${
          selectedType === 'generic'
            ? 'ring-2 ring-orange-500 dark:ring-orange-400'
            : 'hover:shadow-lg dark:hover:shadow-zinc-700/50'
        }`}
        onClick={() => onTypeChange('generic')}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <HiDatabase className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Generic Graph
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create a general-purpose knowledge graph with custom schemas
          </p>
        </div>
      </Card>
    </div>
  )
}
