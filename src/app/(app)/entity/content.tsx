'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  clients,
  PageLayout,
  useEntity,
  useGraphContext,
} from '@/lib/core'
import type { LedgerEntity } from '@robosystems/client/clients'
import type { UpdateEntityRequest } from '@robosystems/client/types'
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

  const [entity, setEntity] = useState<LedgerEntity | null>(null)
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
      const loaded = await clients.ledger.getEntity(graphId)
      if (loaded === null) {
        setError(
          'No entity found for this graph. The extensions database may not be initialized yet.'
        )
      } else {
        setEntity(loaded)
      }
    } catch (err) {
      console.error('Error loading entity:', err)
      setError('Failed to load entity details.')
    } finally {
      setLoading(false)
    }
  }, [graphId])

  useEffect(() => {
    loadEntity()
  }, [loadEntity])

  const startEditing = () => {
    if (!entity) return
    // formData keys are snake_case to match the UpdateEntityRequest body;
    // the display uses the camelCase shape returned by GraphQL.
    setFormData({
      name: entity.name || '',
      legal_name: entity.legalName || '',
      phone: entity.phone || '',
      website: entity.website || '',
      industry: entity.industry || '',
      entity_type: entity.entityType || '',
      state_of_incorporation: entity.stateOfIncorporation || '',
      fiscal_year_end: entity.fiscalYearEnd || '',
      tax_id: entity.taxId || '',
      lei: entity.lei || '',
      ticker: entity.ticker || '',
      exchange: entity.exchange || '',
      cik: entity.cik || '',
      sic: entity.sic || '',
      sic_description: entity.sicDescription || '',
      address_line1: entity.addressLine1 || '',
      address_city: entity.addressCity || '',
      address_state: entity.addressState || '',
      address_postal_code: entity.addressPostalCode || '',
      address_country: entity.addressCountry || '',
    })
    setSaveError(null)
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setSaveError(null)
  }

  // Map snake_case form keys back to the camelCase field on the loaded
  // entity, so we can detect which fields actually changed.
  const FORM_TO_ENTITY_KEY: Record<string, keyof LedgerEntity> = {
    name: 'name',
    legal_name: 'legalName',
    phone: 'phone',
    website: 'website',
    industry: 'industry',
    entity_type: 'entityType',
    state_of_incorporation: 'stateOfIncorporation',
    fiscal_year_end: 'fiscalYearEnd',
    tax_id: 'taxId',
    lei: 'lei',
    ticker: 'ticker',
    exchange: 'exchange',
    cik: 'cik',
    sic: 'sic',
    sic_description: 'sicDescription',
    address_line1: 'addressLine1',
    address_city: 'addressCity',
    address_state: 'addressState',
    address_postal_code: 'addressPostalCode',
    address_country: 'addressCountry',
  }

  const handleSave = async () => {
    if (!graphId || !entity) return
    setSaving(true)
    setSaveError(null)

    // Build update body — only send fields that changed (snake_case body).
    const updates: Record<string, string | null> = {}
    for (const [key, value] of Object.entries(formData)) {
      const entityKey = FORM_TO_ENTITY_KEY[key]
      const original = entityKey ? (entity[entityKey] as string) || '' : ''
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
      const updated = await clients.ledger.updateEntity(
        graphId,
        updates as UpdateEntityRequest
      )
      setEntity(updated)
      // Update the entity context so the dropdown reflects changes
      setCurrentEntity({
        identifier: updated.id || updated.uri || '',
        name: updated.name,
        parentEntityId: updated.parentEntityId,
        isParent: updated.isParent,
      })
      setEditing(false)
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to update entity.'
      )
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
                  value={entity.legalName}
                  field="legal_name"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Entity Type"
                  value={entity.entityType}
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
                  value={entity.addressLine1}
                  field="address_line1"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="City"
                  value={entity.addressCity}
                  field="address_city"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="State"
                  value={entity.addressState}
                  field="address_state"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Postal Code"
                  value={entity.addressPostalCode}
                  field="address_postal_code"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Country"
                  value={entity.addressCountry}
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
                  value={entity.stateOfIncorporation}
                  field="state_of_incorporation"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                />
                <EditableField
                  label="Fiscal Year End"
                  value={entity.fiscalYearEnd}
                  field="fiscal_year_end"
                  editing={editing}
                  formData={formData}
                  onChange={updateField}
                  placeholder="e.g., 1231"
                />
                <EditableField
                  label="Tax ID"
                  value={entity.taxId}
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
                  value={entity.sicDescription}
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
                {entity.createdAt && (
                  <div>
                    <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {new Date(entity.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {entity.updatedAt && (
                  <div>
                    <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Updated
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {new Date(entity.updatedAt).toLocaleDateString()}
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
