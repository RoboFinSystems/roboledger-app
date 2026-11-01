'use client'

import { formatPeriod } from '@/components/FiscalCalendarSetupModal'
import type { ElementClassification } from '@/lib/ledger'
import { friendlyError, type FriendlyError } from '@/lib/ledger/errors'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  TextInput,
} from '@robosystems/core/ui'
import Link from 'next/link'
import { type FC, type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  type AccountDraft,
  activePatch,
  addPayload,
  type ChartAccount,
  codeTakenBy,
  type EditableChart,
  isReclassification,
  normalBalanceFor,
  parentOptions,
  updatePatch,
} from '../chartEditing'

const CLASSIFICATIONS: { value: ElementClassification; label: string }[] = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
]

const classificationLabel = (value: ElementClassification): string =>
  CLASSIFICATIONS.find((c) => c.value === value)?.label ?? value

const describe = (
  classification: ElementClassification,
  balance: 'debit' | 'credit'
): string => `${classificationLabel(classification)} (${balance})`

interface AccountEditorModalProps {
  graphId: string
  entityId: string | null
  chart: EditableChart
  /** The account to edit; null adds one. */
  account: ChartAccount | null
  /** Open on the retire / reactivate confirm rather than the form. */
  initialStep?: 'form' | 'retire'
  onClose: () => void
  /** After a write: what to tell the person. */
  onSaved: (notice: string) => void
}

type Step = 'form' | 'reclassify' | 'retire'

const draftOf = (account: ChartAccount | null): AccountDraft =>
  account
    ? {
        name: account.name,
        code: account.code ?? '',
        classification: account.classification,
        balanceType: account.balanceType,
        parentId: account.parentId ?? '',
      }
    : {
        name: '',
        code: '',
        classification: 'expense',
        balanceType: 'debit',
        parentId: '',
      }

/**
 * Add an account to the entity's chart, or rename, re-code, move, reclassify,
 * retire or reactivate one — every change through `update-taxonomy-block`.
 * A change of classification or normal balance alters how closed months
 * read, so it waits behind a confirm that says when it will be refused.
 */
const AccountEditorModal: FC<AccountEditorModalProps> = ({
  graphId,
  entityId,
  chart,
  account,
  initialStep = 'form',
  onClose,
  onSaved,
}) => {
  const [draft, setDraft] = useState<AccountDraft>(() => draftOf(account))
  const [step, setStep] = useState<Step>(account ? initialStep : 'form')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<FriendlyError | null>(null)
  // How far the books are closed, for the reclassification confirm:
  // undefined until the calendar answers, null when no month is closed.
  const [closedThrough, setClosedThrough] = useState<string | null | undefined>(
    undefined
  )

  useEffect(() => {
    if (!account) return
    let cancelled = false
    clients.ledger
      .getFiscalCalendar(graphId, { entityId })
      .then((calendar) => {
        if (!cancelled) setClosedThrough(calendar?.closedThrough ?? null)
      })
      .catch((err: unknown) => {
        console.error('Error loading fiscal calendar:', err)
      })
    return () => {
      cancelled = true
    }
  }, [account, graphId, entityId])

  const parents = useMemo(
    () => parentOptions(chart, draft.classification, account),
    [chart, draft.classification, account]
  )
  const codeClash = codeTakenBy(chart, draft.code, account)
  // A retired account's code may have been taken since; reactivating it
  // then would put two active accounts on one code.
  const reactivateClash =
    account && !account.isActive
      ? codeTakenBy(chart, account.code ?? '', account)
      : null
  const activeChildren = account
    ? chart.accounts.filter(
        (other) => other.parentId === account.id && other.isActive
      ).length
    : 0
  const patch = account ? updatePatch(chart, account, draft) : null
  const reclassifying = !!account && isReclassification(account, draft)
  const canSave =
    draft.name.trim() !== '' && !codeClash && (account ? !!patch : true)

  const set = <K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const run = async (
    body: Parameters<typeof clients.ledger.updateTaxonomyBlock>[1],
    notice: string
  ) => {
    setSaving(true)
    setError(null)
    try {
      await clients.ledger.updateTaxonomyBlock(graphId, body)
      onSaved(notice)
    } catch (err) {
      setError(
        friendlyError(
          err instanceof Error ? err.message : 'The chart could not be saved.'
        )
      )
      setSaving(false)
    }
  }

  const save = () => {
    const name = draft.name.trim()
    if (!account) {
      void run(addPayload(chart, draft), `Added ${name}.`)
      return
    }
    if (!patch) return
    void run(
      { taxonomy_id: chart.taxonomyId, elements_to_update: [patch] },
      reclassifying
        ? `${name} is now ${describe(draft.classification, draft.balanceType)}.`
        : `Saved ${name}.`
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSave || saving) return
    if (reclassifying && step === 'form') {
      setStep('reclassify')
      return
    }
    save()
  }

  const title = !account
    ? 'Add account'
    : step === 'retire'
      ? account.isActive
        ? `Retire ${account.name}`
        : `Reactivate ${account.name}`
      : step === 'reclassify'
        ? `Reclassify ${account.name}`
        : `Edit ${account.name}`

  return (
    <Modal show onClose={() => !saving && onClose()} size="lg">
      <ModalHeader>{title}</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            {error && (
              <Alert color="failure">
                {error.message}
                {error.link && (
                  <>
                    {' '}
                    <Link href={error.link.href} className="underline">
                      {error.link.label}
                    </Link>
                  </>
                )}
              </Alert>
            )}

            {step === 'retire' && account && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {account.isActive
                  ? 'Its history stays and its statements still read it. It leaves the account pickers and the chart, and new postings to it are refused. You can reactivate it.'
                  : 'It returns to the chart and the account pickers, and takes postings again.'}
                {account.isActive && activeChildren > 0 && (
                  <>
                    {' '}
                    {activeChildren === 1
                      ? 'Its 1 sub-account stays active and shows at the top level of the chart.'
                      : `Its ${activeChildren} sub-accounts stay active and show at the top level of the chart.`}
                  </>
                )}
              </p>
            )}

            {step === 'retire' && reactivateClash && account && (
              <Alert color="warning">
                {reactivateClash.name} uses {account.code} now. Go back and give
                this account another code before reactivating it.
              </Alert>
            )}

            {step === 'reclassify' && account && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  From{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {describe(account.classification, account.balanceType)}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {describe(draft.classification, draft.balanceType)}
                  </span>
                  . Every statement that reads this account reads it the new
                  way, open months and the live statements alike.
                </p>
                <p>
                  {closedThrough === null
                    ? 'No month is closed yet, so nothing stops the change.'
                    : `${
                        closedThrough
                          ? `The books are closed through ${formatPeriod(closedThrough)}. `
                          : ''
                      }If ${account.name} has posted lines in a closed month, the change is refused until those months are reopened, latest first — closed months keep the answer they closed with.`}
                </p>
              </div>
            )}

            {step === 'form' && (
              <>
                <div>
                  <Label htmlFor="account-name" className="mb-1 block">
                    Name
                  </Label>
                  <TextInput
                    id="account-name"
                    sizing="sm"
                    value={draft.name}
                    disabled={saving}
                    onChange={(e) => set('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account-code" className="mb-1 block">
                    Code (optional)
                  </Label>
                  <TextInput
                    id="account-code"
                    sizing="sm"
                    className="max-w-40"
                    value={draft.code}
                    disabled={saving}
                    onChange={(e) => set('code', e.target.value)}
                  />
                  {codeClash && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {codeClash.name} already uses {draft.code.trim()}.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="account-classification"
                      className="mb-1 block"
                    >
                      Classification
                    </Label>
                    <Select
                      id="account-classification"
                      sizing="sm"
                      value={draft.classification}
                      disabled={saving}
                      onChange={(e) => {
                        const classification = e.target
                          .value as ElementClassification
                        // Back on its own class, the account keeps what it
                        // had; a parent of another class no longer fits.
                        const own =
                          account?.classification === classification
                            ? account
                            : null
                        setDraft((current) => ({
                          ...current,
                          classification,
                          balanceType:
                            own?.balanceType ??
                            normalBalanceFor(classification),
                          parentId: own?.parentId ?? '',
                        }))
                      }}
                    >
                      {CLASSIFICATIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="account-balance" className="mb-1 block">
                      Normal balance
                    </Label>
                    <Select
                      id="account-balance"
                      sizing="sm"
                      value={draft.balanceType}
                      disabled={saving}
                      onChange={(e) =>
                        set(
                          'balanceType',
                          e.target.value === 'credit' ? 'credit' : 'debit'
                        )
                      }
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </Select>
                    {draft.balanceType !==
                      normalBalanceFor(draft.classification) && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        A contra account: it offsets the{' '}
                        {classificationLabel(
                          draft.classification
                        ).toLowerCase()}{' '}
                        accounts it sits with.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="account-parent" className="mb-1 block">
                    Sub-account of
                  </Label>
                  <Select
                    id="account-parent"
                    sizing="sm"
                    value={draft.parentId}
                    disabled={saving}
                    onChange={(e) => set('parentId', e.target.value)}
                  >
                    <option value="">None (top level)</option>
                    {parents.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.code ? `${parent.code} ` : ''}
                        {parent.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {step === 'retire' && account ? (
            <Button
              color={account.isActive ? 'failure' : 'blue'}
              disabled={saving || !!reactivateClash}
              onClick={() =>
                void run(
                  activePatch(chart, account, !account.isActive),
                  account.isActive
                    ? `Retired ${account.name}.`
                    : `Reactivated ${account.name}.`
                )
              }
            >
              {saving
                ? 'Saving…'
                : account.isActive
                  ? 'Retire account'
                  : 'Reactivate account'}
            </Button>
          ) : (
            <Button type="submit" color="blue" disabled={!canSave || saving}>
              {saving
                ? 'Saving…'
                : !account
                  ? 'Add account'
                  : step === 'reclassify'
                    ? 'Reclassify'
                    : reclassifying
                      ? 'Review change'
                      : 'Save'}
            </Button>
          )}
          <Button
            color="light"
            disabled={saving}
            onClick={() => (step === 'form' ? onClose() : setStep('form'))}
          >
            {step === 'form' ? 'Cancel' : 'Back'}
          </Button>
          {account && step === 'form' && (
            <Button
              color="light"
              className="ml-auto"
              disabled={saving}
              onClick={() => {
                setError(null)
                setStep('retire')
              }}
            >
              {account.isActive ? 'Retire…' : 'Reactivate…'}
            </Button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default AccountEditorModal
