'use client'

import {
  customTheme,
  PageLayout,
  useApiError,
  useGraphContext,
  useOrg,
  useServiceOfferings,
  useToast,
} from '@/lib/core'
import * as SDK from '@robosystems/client'
import { format } from 'date-fns'
import {
  Alert,
  Badge,
  Button,
  Card,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Tabs,
} from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  HiBookOpen,
  HiCheckCircle,
  HiClock,
  HiCreditCard,
  HiCurrencyDollar,
  HiDatabase,
  HiDocumentText,
  HiDownload,
  HiExclamationCircle,
  HiInformationCircle,
  HiTerminal,
  HiXCircle,
} from 'react-icons/hi'

export function BillingContent() {
  const { currentOrg } = useOrg()
  const { state: graphState, setCurrentGraph } = useGraphContext()
  const { offerings, isLoading: offeringsLoading } = useServiceOfferings()
  const { handleApiError } = useApiError()
  const { showError, showSuccess } = useToast()
  const router = useRouter()

  // Organization-level billing
  const [billingCustomer, setBillingCustomer] =
    useState<SDK.BillingCustomer | null>(null)
  const [orgSubscriptions, setOrgSubscriptions] = useState<
    SDK.GraphSubscriptionResponse[]
  >([])
  const [upcomingInvoice, setUpcomingInvoice] =
    useState<SDK.UpcomingInvoice | null>(null)
  const [invoices, setInvoices] = useState<SDK.Invoice[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrg?.id) {
      loadBillingData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id])

  const loadBillingData = async () => {
    if (!currentOrg?.id) return

    try {
      setLoading(true)
      setError(null)

      // Load organization billing data in parallel
      const [customerRes, subscriptionsRes, upcomingInvoiceRes, invoicesRes] =
        await Promise.allSettled([
          SDK.getOrgBillingCustomer({ path: { org_id: currentOrg.id } }),
          SDK.listOrgSubscriptions({ path: { org_id: currentOrg.id } }),
          SDK.getOrgUpcomingInvoice({ path: { org_id: currentOrg.id } }),
          SDK.listOrgInvoices({ path: { org_id: currentOrg.id } }),
        ])

      if (customerRes.status === 'fulfilled' && customerRes.value.data) {
        setBillingCustomer(customerRes.value.data)
      }

      if (
        subscriptionsRes.status === 'fulfilled' &&
        subscriptionsRes.value.data
      ) {
        setOrgSubscriptions(subscriptionsRes.value.data || [])
      }

      if (
        upcomingInvoiceRes.status === 'fulfilled' &&
        upcomingInvoiceRes.value.data
      ) {
        setUpcomingInvoice(upcomingInvoiceRes.value.data)
      }

      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data) {
        setInvoices(invoicesRes.value.data.invoices || [])
      }
    } catch (err) {
      const errorMsg = 'Failed to load billing data'
      setError(errorMsg)
      handleApiError(err, errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (loading || offeringsLoading) {
    return (
      <div className="mx-auto flex h-96 max-w-7xl items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  const billingEnabled = offerings?.billingEnabled ?? true
  const hasPaymentMethod =
    billingCustomer?.has_payment_method ||
    billingCustomer?.invoice_billing_enabled ||
    false

  return (
    <PageLayout>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
            <HiCreditCard className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              Billing & Subscriptions
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage subscription and payments
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      {!billingEnabled && (
        <Alert color="info" icon={HiInformationCircle}>
          <div>
            <h3 className="font-semibold">Billing Disabled</h3>
            <p className="text-sm">
              Payment processing is currently disabled on this instance. Contact
              your administrator for more information.
            </p>
          </div>
        </Alert>
      )}

      <Tabs
        aria-label="Billing tabs"
        theme={customTheme.tabs}
        variant="underline"
      >
        <Tabs.Item active title="Overview" icon={HiCurrencyDollar}>
          <OverviewTab
            billingCustomer={billingCustomer}
            upcomingInvoice={upcomingInvoice}
            hasPaymentMethod={hasPaymentMethod}
            billingEnabled={billingEnabled}
            router={router}
            currentOrg={currentOrg}
            subscriptions={orgSubscriptions}
            showError={showError}
          />
        </Tabs.Item>

        <Tabs.Item title="Subscriptions" icon={HiDatabase}>
          <SubscriptionsTab
            subscriptions={orgSubscriptions}
            graphs={graphState.graphs}
            offerings={offerings}
            router={router}
            onRefresh={loadBillingData}
            setCurrentGraph={setCurrentGraph}
          />
        </Tabs.Item>

        <Tabs.Item title="Invoices" icon={HiDocumentText}>
          <InvoicesTab invoices={invoices} loading={false} />
        </Tabs.Item>
      </Tabs>
    </PageLayout>
  )
}

// Overview Tab
function OverviewTab({
  billingCustomer,
  upcomingInvoice,
  hasPaymentMethod,
  billingEnabled,
  router,
  currentOrg,
  subscriptions,
  showError,
}: {
  billingCustomer: SDK.BillingCustomer | null
  upcomingInvoice: SDK.UpcomingInvoice | null
  hasPaymentMethod: boolean
  billingEnabled: boolean
  router: any
  currentOrg: SDK.OrgResponse | null
  subscriptions: SDK.GraphSubscriptionResponse[]
  showError: (message: string) => void
}) {
  const [managingPayment, setManagingPayment] = useState(false)

  const handleManagePayment = async () => {
    if (!currentOrg?.id) return

    try {
      setManagingPayment(true)
      const response = await SDK.createPortalSession({
        path: { org_id: currentOrg.id },
      })

      if (response.error) {
        throw new Error(
          typeof response.error === 'object' && 'detail' in response.error
            ? String(response.error.detail)
            : 'Failed to create portal session'
        )
      }

      if (response.data?.portal_url) {
        window.location.href = response.data.portal_url
      }
    } catch (error) {
      console.error('Failed to open payment portal:', error)
      showError('Failed to open payment management portal. Please try again.')
      setManagingPayment(false)
    }
  }
  // Calculate billing type
  const getBillingType = () => {
    if (!billingEnabled) return 'Disabled'
    if (billingCustomer?.invoice_billing_enabled) return 'Enterprise'
    return 'Self-Service'
  }

  const billingType = getBillingType()

  // Count subscriptions by type
  const graphSubs = subscriptions.filter((s) => s.resource_type === 'graph')
  const repoSubs = subscriptions.filter((s) => s.resource_type === 'repository')

  return (
    <div className="space-y-6">
      {/* Customer Profile */}
      <Card theme={customTheme.card}>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white">
                {currentOrg?.name || 'Organization'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Billing &amp; Subscription Management
              </p>
            </div>
            <Badge color={billingEnabled ? 'green' : 'gray'}>
              {billingType}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-3 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Billing Type
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {billingType}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active Graphs
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {graphSubs.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Repository Access
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {repoSubs.length}
              </p>
            </div>
          </div>

          {/* Billing contact information - properties not yet available in SDK */}
        </div>
      </Card>

      {/* Payment Method Status */}
      {billingEnabled && (
        <Card theme={customTheme.card}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`rounded-full p-3 ${
                  hasPaymentMethod
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {hasPaymentMethod ? (
                  <HiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <HiXCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Payment Method
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {billingCustomer?.invoice_billing_enabled
                    ? 'Invoice billing enabled'
                    : hasPaymentMethod
                      ? `${billingCustomer?.payment_methods?.[0]?.brand || 'Card'} ending in ${billingCustomer?.payment_methods?.[0]?.last4 || '****'}`
                      : 'No payment method on file'}
                </p>
              </div>
            </div>
            {!billingCustomer?.invoice_billing_enabled && (
              <Button
                color="blue"
                size="sm"
                onClick={handleManagePayment}
                disabled={managingPayment}
              >
                <HiCreditCard className="mr-2 h-4 w-4" />
                {managingPayment
                  ? 'Opening...'
                  : hasPaymentMethod
                    ? 'Manage Payment Methods'
                    : 'Add Payment Method'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Upcoming Invoice */}
      {upcomingInvoice && (
        <Card theme={customTheme.card}>
          <h3 className="font-heading mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Invoice
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Period:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {upcomingInvoice.period_start && upcomingInvoice.period_end
                  ? `${format(new Date(upcomingInvoice.period_start), 'MMM d')} - ${format(new Date(upcomingInvoice.period_end), 'MMM d, yyyy')}`
                  : 'N/A'}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Amount Due:
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  ${((upcomingInvoice.amount_due || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
            {upcomingInvoice.line_items &&
              upcomingInvoice.line_items.length > 0 && (
                <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Line Items:
                  </p>
                  <div className="space-y-1">
                    {upcomingInvoice.line_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.description}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${((item.amount || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </Card>
      )}
    </div>
  )
}

// Subscriptions Tab
function SubscriptionsTab({
  subscriptions,
  graphs,
  offerings,
  router,
  onRefresh,
  setCurrentGraph,
}: {
  subscriptions: SDK.GraphSubscriptionResponse[]
  graphs: SDK.GraphInfo[]
  offerings: any
  router: any
  onRefresh: () => void
  setCurrentGraph: (graph: string | any) => Promise<void>
}) {
  const { currentOrg } = useOrg()
  const { showSuccess, showError } = useToast()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<SDK.GraphSubscriptionResponse | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const activeSubscriptions = subscriptions.filter((s) => {
    if (s.status === 'active') {
      return true
    }
    if (s.status === 'canceled' && s.current_period_end) {
      const endsAt = new Date(s.current_period_end)
      const now = new Date()
      return endsAt > now
    }
    return false
  })

  const graphSubscriptions = activeSubscriptions.filter(
    (s) => s.resource_type === 'graph'
  )
  const repositorySubscriptions = activeSubscriptions.filter(
    (s) => s.resource_type === 'repository'
  )

  const handleOpenConsole = async (repositoryId: string) => {
    await setCurrentGraph(repositoryId)
    router.push('/console')
  }

  const handleCancelClick = (subscription: SDK.GraphSubscriptionResponse) => {
    setSubscriptionToCancel(subscription)
    setShowCancelModal(true)
  }

  const getSubscriptionBadge = (
    subscription: SDK.GraphSubscriptionResponse
  ) => {
    if (subscription.status === 'active') {
      return <Badge color="success">Active</Badge>
    }
    if (subscription.status === 'canceled') {
      return (
        <Badge color="warning" className="text-center">
          <div className="flex flex-col">
            <span>Cancelling</span>
            {subscription.current_period_end && (
              <span className="text-xs">
                Ends{' '}
                {format(new Date(subscription.current_period_end), 'MMM d')}
              </span>
            )}
          </div>
        </Badge>
      )
    }
    return <Badge color="gray">{subscription.status}</Badge>
  }

  const handleCancelConfirm = async () => {
    if (!subscriptionToCancel || !currentOrg?.id) return

    try {
      setCancelling(true)
      const response = await SDK.cancelOrgSubscription({
        path: {
          org_id: currentOrg.id,
          subscription_id: subscriptionToCancel.id,
        },
      })

      if (response.error) {
        throw new Error(
          typeof response.error === 'object' && 'detail' in response.error
            ? String(response.error.detail)
            : 'Failed to cancel subscription'
        )
      }

      showSuccess(
        `Subscription cancelled. Access will remain active until ${subscriptionToCancel.current_period_end ? format(new Date(subscriptionToCancel.current_period_end), 'MMM d, yyyy') : 'the end of the billing period'}.`
      )
      setShowCancelModal(false)
      setSubscriptionToCancel(null)
      onRefresh()
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      showError(
        error instanceof Error
          ? error.message
          : 'Failed to cancel subscription. Please try again.'
      )
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Graph Subscriptions */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white">
          Graph Subscriptions
        </h2>
        {graphSubscriptions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {graphSubscriptions.map((sub) => {
              const graph = graphs.find((g) => g.graphId === sub.resource_id)
              return (
                <Card key={sub.id} theme={customTheme.card}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
                          {graph?.graphName || sub.resource_id}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {sub.plan_display_name}
                        </p>
                      </div>
                      {getSubscriptionBadge(sub)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        ${(sub.base_price_cents / 100).toFixed(2)}/
                        {sub.billing_interval}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Since{' '}
                        {sub.started_at
                          ? format(new Date(sub.started_at), 'MMM yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => router.push(`/dashboard`)}
                          className="flex-1"
                        >
                          <HiDatabase className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        color="gray"
                        onClick={() => handleCancelClick(sub)}
                        className="w-full"
                        disabled={sub.status === 'canceled'}
                      >
                        <HiXCircle className="mr-2 h-4 w-4" />
                        {sub.status === 'canceled'
                          ? 'Cancellation Scheduled'
                          : 'Cancel Subscription'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card theme={customTheme.card}>
            <div className="py-12 text-center">
              <HiDatabase className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                No Active Graph Subscriptions
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Graph subscriptions will appear here once created
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Repository Subscriptions */}
      {repositorySubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white">
            Repository Subscriptions
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {repositorySubscriptions.map((sub) => (
              <Card key={sub.id} theme={customTheme.card}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
                        {sub.resource_id.toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {sub.plan_display_name}
                      </p>
                    </div>
                    {getSubscriptionBadge(sub)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      ${(sub.base_price_cents / 100).toFixed(2)}/
                      {sub.billing_interval}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Since{' '}
                      {sub.started_at
                        ? format(new Date(sub.started_at), 'MMM yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="gray"
                        onClick={() => handleOpenConsole(sub.resource_id)}
                        className="flex-1"
                      >
                        <HiTerminal className="mr-2 h-4 w-4" />
                        Console
                      </Button>
                      <Button
                        size="sm"
                        color="gray"
                        onClick={() =>
                          router.push(
                            `/repositories/${sub.resource_id}/getting-started`
                          )
                        }
                        className="flex-1"
                      >
                        <HiBookOpen className="mr-2 h-4 w-4" />
                        Getting Started
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      color="gray"
                      onClick={() => handleCancelClick(sub)}
                      className="w-full"
                      disabled={sub.status === 'canceled'}
                    >
                      <HiXCircle className="mr-2 h-4 w-4" />
                      {sub.status === 'canceled'
                        ? 'Cancellation Scheduled'
                        : 'Cancel Subscription'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        show={showCancelModal}
        onClose={() => !cancelling && setShowCancelModal(false)}
        size="md"
      >
        <ModalHeader>Cancel Subscription</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <HiExclamationCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Are you sure you want to cancel this subscription?
                </h3>
                {subscriptionToCancel && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium">
                      {subscriptionToCancel.resource_type === 'graph'
                        ? graphs.find(
                            (g) =>
                              g.graphId === subscriptionToCancel.resource_id
                          )?.graphName || subscriptionToCancel.resource_id
                        : subscriptionToCancel.resource_id.toUpperCase()}
                    </p>
                    <p className="mt-1">
                      {subscriptionToCancel.plan_display_name}
                    </p>
                    <p className="mt-1">
                      $
                      {(subscriptionToCancel.base_price_cents / 100).toFixed(2)}
                      /{subscriptionToCancel.billing_interval}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Alert color="warning" icon={HiInformationCircle}>
              <p className="text-sm">
                Your subscription will be cancelled, but you'll continue to have
                access until the end of your current billing period
                {subscriptionToCancel?.current_period_end &&
                  ` (${format(new Date(subscriptionToCancel.current_period_end), 'MMMM d, yyyy')})`}
                .
              </p>
            </Alert>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex w-full gap-3">
            <button
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
              className="flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
            >
              <span className="flex flex-col">
                <span>Keep</span>
                <span>Subscription</span>
              </span>
            </button>
            <button
              onClick={handleCancelConfirm}
              disabled={cancelling}
              className="flex flex-1 items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
            >
              {cancelling ? (
                'Cancelling...'
              ) : (
                <span className="flex flex-col">
                  <span>Yes, Cancel</span>
                  <span>Subscription</span>
                </span>
              )}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// Invoices Tab
function InvoicesTab({
  invoices,
  loading,
}: {
  invoices: SDK.Invoice[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card theme={customTheme.card}>
        <div className="py-12 text-center">
          <HiClock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            No Invoices Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your billing history will appear here once you have invoices
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card theme={customTheme.card}>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableHeadCell>Invoice</TableHeadCell>
            <TableHeadCell>Date</TableHeadCell>
            <TableHeadCell>Amount</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>
              <span className="sr-only">Actions</span>
            </TableHeadCell>
          </TableHead>
          <TableBody className="divide-y">
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {invoice.number || invoice.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {invoice.created
                    ? format(new Date(invoice.created), 'MMM d, yyyy')
                    : 'N/A'}
                </TableCell>
                <TableCell className="font-medium">
                  ${((invoice.amount_due || 0) / 100).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    color={
                      invoice.status === 'paid'
                        ? 'success'
                        : invoice.status === 'open'
                          ? 'warning'
                          : 'failure'
                    }
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {invoice.invoice_pdf && (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500"
                      title="Download PDF"
                    >
                      <HiDownload className="h-5 w-5" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
