import { Alert, Badge, Card } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'
import { fetchGraphTiers, type GraphTier } from '../../../lib/graph-tiers'
import { customTheme } from '../../../theme'
import type { GraphFormData } from '../types'

interface ReviewStepProps {
  formData: GraphFormData
  showTier: boolean
}

export function ReviewStep({ formData, showTier }: ReviewStepProps) {
  const [tiers, setTiers] = useState<GraphTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (showTier && formData.selectedTier) {
      setError(null)
      fetchGraphTiers(false)
        .then((response) => setTiers(response.tiers))
        .catch((err) => {
          console.error('Failed to load tiers for review:', err)
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load tier information for review'
          )
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [showTier, formData.selectedTier])

  const getTierInfo = () => {
    if (!showTier || !formData.selectedTier) return null
    return tiers.find((t) => t.tier === formData.selectedTier) || null
  }

  const tierInfo = getTierInfo()

  return (
    <div className="space-y-6">
      <Alert color="warning" icon={HiExclamationCircle}>
        <div>
          <span className="font-medium">Important:</span> Creating a graph will
          immediately allocate the selected monthly credits to your account.
        </div>
      </Alert>

      {error && (
        <Alert theme={customTheme.alert} color="failure">
          <p className="font-semibold">Failed to load tier information</p>
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      <div className="space-y-4">
        <Card theme={customTheme.card}>
          <div className="space-y-4">
            <h4 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
              <HiCheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Graph Configuration
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Graph Type
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formData.graphType === 'entity'
                    ? 'Entity Graph'
                    : 'Generic Graph'}
                </p>
              </div>

              {formData.graphType === 'entity' ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {formData.createEntity ? 'Entity Name' : 'Graph Name'}
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formData.createEntity
                        ? formData.entityName
                        : formData.graphName}
                    </p>
                  </div>

                  {formData.entityDescription && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Description
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {formData.entityDescription}
                      </p>
                    </div>
                  )}

                  {formData.entityTags && formData.entityTags.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Tags
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.entityTags.map((tag) => (
                          <Badge key={tag} color="gray" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Schema Extensions
                    </p>
                    <div className="mt-1">
                      {formData.selectedExtensions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedExtensions.map((ext) => (
                            <Badge key={ext} color="gray" size="sm">
                              {ext}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">
                          None (base schema only)
                        </span>
                      )}
                    </div>
                  </div>

                  {!formData.createEntity && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Initial Entity
                      </p>
                      <span className="text-gray-600 dark:text-gray-400">
                        None - Empty graph structure
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Graph Name
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formData.genericGraphName}
                    </p>
                  </div>

                  {formData.genericGraphDescription && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Description
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {formData.genericGraphDescription}
                      </p>
                    </div>
                  )}

                  {formData.genericGraphTags &&
                    formData.genericGraphTags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Tags
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {formData.genericGraphTags.map((tag) => (
                            <Badge key={tag} color="gray" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Schema Type
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formData.genericSchemaType === 'empty'
                        ? 'Empty Graph'
                        : 'Custom Schema'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {showTier && tierInfo && (
          <Card theme={customTheme.card}>
            <div className="space-y-4">
              <h4 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                <HiCheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Subscription Details
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Selected Tier
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {tierInfo.display_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Monthly Price
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    ${tierInfo.monthly_price || 0}/month
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Monthly Credits
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {tierInfo.monthly_credits.toLocaleString()} credits
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {formData.entityDetails &&
          Object.keys(formData.entityDetails).length > 0 && (
            <Card theme={customTheme.card}>
              <div className="space-y-4">
                <h4 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                  <HiCheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  Additional Entity Details
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                  {formData.entityDetails.cik && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        CIK
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {formData.entityDetails.cik}
                      </p>
                    </div>
                  )}
                  {formData.entityDetails.ein && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        EIN
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {formData.entityDetails.ein}
                      </p>
                    </div>
                  )}
                  {formData.entityDetails.sic && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        SIC Code
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {formData.entityDetails.sic}
                      </p>
                    </div>
                  )}
                  {formData.entityDetails.state_of_incorporation && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        State of Incorporation
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {formData.entityDetails.state_of_incorporation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
      </div>
    </div>
  )
}
