'use client'

import { PageHeader } from '@/components/PageHeader'
import { customTheme, PageLayout, useEntity, useGraphContext } from '@/lib/core'
import type { LedgerEntityResponse } from '@robosystems/client'
import * as SDK from '@robosystems/client'
import {
  Alert,
  Badge,
  Button,
  Card,
  Label,
  Spinner,
  TextInput,
} from 'flowbite-react'
import { type FC, useCallback, useEffect, useState } from 'react'
import { HiOfficeBuilding, HiPencil, HiSave, HiX } from 'react-icons/hi'

const EntityInfoPageContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const { currentEntity, setCurrentEntity } = useEntity()
  const graphId = graphState.currentGraphId

  const [entity, setEntity] = useState<LedgerEntityResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const loadEntity = useCallback(async () => {
    if (!graphId) return
    setLoading(true)
    setError(null)
    try {
      const response = await SDK.getLedgerEntity({
        path: { graph_id: graphId },
      })
      if (response.data) {
        setEntity(response.data as LedgerEntityResponse)
      }
    } catch (err: any) {
      const status = err?.status || err?.response?.status
      if (status === 404) {
        setError(
          'No entity found for this graph. The extensions database may not be initialized yet.'
        )
      } else {
        setError('Failed to load entity details.')
      }
    } finally {
      setLoading(false)
    }
  }, [graphId])

  useEffect(() => {
    loadEntity()
  }, [loadEntity])

  const startEditing = () => {
    if (!entity) return
    setFormData({
      name: entity.name || '',
      legal_name: entity.legal_name || '',
      phone: entity.phone || '',
      website: entity.website || '',
      industry: entity.industry || '',
      entity_type: entity.entity_type || '',
      state_of_incorporation: entity.state_of_incorporation || '',
      fiscal_year_end: entity.fiscal_year_end || '',
      tax_id: entity.tax_id || '',
      lei: entity.lei || '',
      ticker: entity.ticker || '',
      exchange: entity.exchange || '',
      cik: entity.cik || '',
      sic: entity.sic || '',
      sic_description: entity.sic_description || '',
      address_line1: entity.address_line1 || '',
      address_city: entity.address_city || '',
      address_state: entity.address_state || '',
      address_postal_code: entity.address_postal_code || '',
      address_country: entity.address_country || '',
    })
    setSaveError(null)
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!graphId || !entity) return
    setSaving(true)
    setSaveError(null)

    // Build update body — only send fields that changed
    const updates: Record<string, string | null> = {}
    for (const [key, value] of Object.entries(formData)) {
      const original = (entity as any)[key] || ''
      if (value !== original) {
        updates[key] = value || null
      }
    }

    if (Object.keys(updates).length === 0) {
      setEditing(false)
      setSaving(false)
      return
    }

    try {
      const response = await SDK.updateLedgerEntity({
        path: { graph_id: graphId },
        body: updates as any,
      })
      if (response.data) {
        const updated = response.data as LedgerEntityResponse
        setEntity(updated)
        // Update the entity context so the dropdown reflects changes
        setCurrentEntity({
          identifier: updated.id || updated.uri || '',
          name: updated.name,
          parentEntityId: updated.parent_entity_id,
          isParent: updated.is_parent,
        })
        setEditing(false)
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update entity.')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <PageLayout>
      <PageHeader
        icon={HiOfficeBuilding}
        title="Entity Details"
        description={
          entity?.name ||
          currentEntity?.name ||
          'View entity information and settings'
        }
        gradient="from-indigo-500 to-purple-600"
      />

      <div className="space-y-6">
        {loading ? (
          <Card theme={customTheme.card}>
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-3 text-gray-500 dark:text-gray-400">
                Loading entity...
              </span>
            </div>
          </Card>
        ) : error ? (
          <Card theme={customTheme.card}>
            <div className="py-8 text-center">
              <HiOfficeBuilding className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          </Card>
        ) : !entity ? (
          <Card theme={customTheme.card}>
            <div className="py-8 text-center">
              <HiOfficeBuilding className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                No Entity Selected
              </h3>
              <p className="mb-4 text-gray-500 dark:text-gray-400">
                Please select an entity from the Entity selector in the header
                to view its details.
              </p>
              {!graphId && (
                <Alert
                  theme={customTheme.alert}
                  color="info"
                  className="mt-4 text-left"
                >
                  <span className="font-medium">No graph selected.</span> Please
                  select a graph first.
                </Alert>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Header with edit button */}
            <div className="flex items-center justify-end">
              {editing ? (
                <div className="flex gap-2">
                  <Button
                    theme={customTheme.button}
                    color="gray"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <HiX className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    theme={customTheme.button}
                    color="success"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <HiSave className="mr-1 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              ) : (
                <Button
                  theme={customTheme.button}
                  color="gray"
                  size="sm"
                  onClick={startEditing}
                >
                  <HiPencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            {saveError && (
              <Alert theme={customTheme.alert} color="failure">
                {saveError}
              </Alert>
            )}

            {/* Basic Information */}
            <Card theme={customTheme.card}>
              <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Basic Information
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <EditableField
                  label="Name"
                  value={entity.name}
                  field="name"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Legal Name"
                  value={entity.legal_name}
                  field="legal_name"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Entity Type"
                  value={entity.entity_type}
                  field="entity_type"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                  placeholder="e.g., corporation, llc, partnership"
                />
                <EditableField
                  label="Industry"
                  value={entity.industry}
                  field="industry"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </dt>
                  <dd>
                    <Badge
                      color={entity.status === 'active' ? 'success' : 'gray'}
                      size="sm"
                    >
                      {entity.status || 'active'}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Source
                  </dt>
                  <dd>
                    <Badge color="info" size="sm">
                      {entity.source || 'native'}
                    </Badge>
                  </dd>
                </div>
              </div>
            </Card>

            {/* Contact & Address */}
            <Card theme={customTheme.card}>
              <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contact & Address
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <EditableField
                  label="Phone"
                  value={entity.phone}
                  field="phone"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Website"
                  value={entity.website}
                  field="website"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Address"
                  value={entity.address_line1}
                  field="address_line1"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="City"
                  value={entity.address_city}
                  field="address_city"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="State"
                  value={entity.address_state}
                  field="address_state"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Postal Code"
                  value={entity.address_postal_code}
                  field="address_postal_code"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Country"
                  value={entity.address_country}
                  field="address_country"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
              </div>
            </Card>

            {/* Financial & Regulatory */}
            <Card theme={customTheme.card}>
              <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Financial & Regulatory
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <EditableField
                  label="State of Incorporation"
                  value={entity.state_of_incorporation}
                  field="state_of_incorporation"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Fiscal Year End"
                  value={entity.fiscal_year_end}
                  field="fiscal_year_end"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                  placeholder="e.g., 1231"
                />
                <EditableField
                  label="Tax ID"
                  value={entity.tax_id}
                  field="tax_id"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="LEI"
                  value={entity.lei}
                  field="lei"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Ticker"
                  value={entity.ticker}
                  field="ticker"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Exchange"
                  value={entity.exchange}
                  field="exchange"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="CIK"
                  value={entity.cik}
                  field="cik"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="SIC Code"
                  value={entity.sic}
                  field="sic"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="SIC Description"
                  value={entity.sic_description}
                  field="sic_description"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                  className="sm:col-span-2"
                />
              </div>
            </Card>

            {/* Metadata */}
            <Card theme={customTheme.card}>
              <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Metadata
                </h2>
              </div>
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Entity ID
                  </dt>
                  <dd className="font-mono text-sm text-gray-900 dark:text-white">
                    {entity.id}
                  </dd>
                </div>
                {entity.uri && (
                  <div>
                    <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      URI
                    </dt>
                    <dd className="font-mono text-sm text-gray-900 dark:text-white">
                      {entity.uri}
                    </dd>
                  </div>
                )}
                {entity.created_at && (
                  <div>
                    <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {new Date(entity.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {entity.updated_at && (
                  <div>
                    <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Updated
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {new Date(entity.updated_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  )
}

function EditableField({
  label,
  value,
  field,
  editing,
  formData,
  onChange,
  placeholder,
  className,
}: {
  label: string
  value?: string | null
  field: string
  editing: boolean
  formData: Record<string, string>
  onChange: (field: string, value: string) => void
  placeholder?: string
  className?: string
}) {
  if (editing) {
    return (
      <div className={className}>
        <Label
          htmlFor={field}
          className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          {label}
        </Label>
        <TextInput
          id={field}
          value={formData[field] || ''}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          sizing="sm"
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="text-base text-gray-900 dark:text-white">
        {value || <span className="text-gray-400 dark:text-gray-500">--</span>}
      </dd>
    </div>
  )
}

export default EntityInfoPageContent
