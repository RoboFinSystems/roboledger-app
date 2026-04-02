'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  extensions,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import type {
  PublishList,
  PublishListDetail,
} from '@robosystems/client/extensions'
import {
  Alert,
  Badge,
  Button,
  Card,
  Label,
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
  TextInput,
} from 'flowbite-react'
import Link from 'next/link'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiArrowLeft,
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiShare,
  HiUserGroup,
} from 'react-icons/hi'

const PublishListsContent: FC = function () {
  const { state: graphState } = useGraphContext()

  const [lists, setLists] = useState<PublishList[]>([])
  const [selectedList, setSelectedList] = useState<PublishListDetail | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create list modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Add member modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [newMemberGraphId, setNewMemberGraphId] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [addMemberError, setAddMemberError] = useState<string | null>(null)

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0]
    )
  }, [graphState.graphs, graphState.currentGraphId])

  const graphId = currentGraph?.graphId

  const loadLists = useCallback(async () => {
    if (!graphId) return
    try {
      setIsLoading(true)
      setError(null)
      const result = await extensions.reports.listPublishLists(graphId)
      setLists(result)
    } catch (err) {
      console.error('Failed to load publish lists:', err)
      setError('Failed to load publish lists.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId])

  const loadListDetail = useCallback(
    async (listId: string) => {
      if (!graphId) return
      try {
        const detail = await extensions.reports.getPublishList(graphId, listId)
        setSelectedList(detail)
      } catch (err) {
        console.error('Failed to load list detail:', err)
        setError('Failed to load list details.')
      }
    },
    [graphId]
  )

  useEffect(() => {
    loadLists()
  }, [loadLists])

  const handleCreateList = useCallback(async () => {
    if (!graphId || !newListName.trim()) return
    try {
      setIsCreating(true)
      await extensions.reports.createPublishList(
        graphId,
        newListName.trim(),
        newListDescription.trim() || undefined
      )
      setShowCreateModal(false)
      setNewListName('')
      setNewListDescription('')
      await loadLists()
    } catch (err) {
      console.error('Failed to create list:', err)
      setError('Failed to create publish list.')
    } finally {
      setIsCreating(false)
    }
  }, [graphId, newListName, newListDescription, loadLists])

  const handleDeleteList = useCallback(
    async (listId: string) => {
      if (!graphId) return
      try {
        await extensions.reports.deletePublishList(graphId, listId)
        if (selectedList?.id === listId) setSelectedList(null)
        await loadLists()
      } catch (err) {
        console.error('Failed to delete list:', err)
        setError('Failed to delete publish list.')
      }
    },
    [graphId, selectedList, loadLists]
  )

  const handleAddMember = useCallback(async () => {
    if (!graphId || !selectedList || !newMemberGraphId.trim()) return
    try {
      setIsAddingMember(true)
      setAddMemberError(null)
      await extensions.reports.addMembers(graphId, selectedList.id, [
        newMemberGraphId.trim(),
      ])
      setNewMemberGraphId('')
      setShowAddMemberModal(false)
      await loadListDetail(selectedList.id)
      await loadLists()
    } catch (err: any) {
      console.error('Failed to add member:', err)
      const msg = err?.message || 'Failed to add member.'
      setAddMemberError(msg)
    } finally {
      setIsAddingMember(false)
    }
  }, [graphId, selectedList, newMemberGraphId, loadListDetail, loadLists])

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      if (!graphId || !selectedList) return
      try {
        await extensions.reports.removeMember(
          graphId,
          selectedList.id,
          memberId
        )
        await loadListDetail(selectedList.id)
        await loadLists()
      } catch (err) {
        console.error('Failed to remove member:', err)
        setError('Failed to remove member.')
      }
    },
    [graphId, selectedList, loadListDetail, loadLists]
  )

  if (!currentGraph) {
    return (
      <PageLayout>
        <Card theme={customTheme.card}>
          <p className="text-gray-500 dark:text-gray-400">
            No graph selected. Select a graph to manage publish lists.
          </p>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader
        icon={HiShare}
        title="Publish Lists"
        description="Manage report distribution lists"
        gradient="from-orange-500 to-red-600"
        actions={
          <div className="flex gap-2">
            <Link href="/reports">
              <Button theme={customTheme.button} color="light">
                <HiArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Button>
            </Link>
            <Button
              theme={customTheme.button}
              color="primary"
              onClick={() => setShowCreateModal(true)}
            >
              <HiOutlinePlusCircle className="mr-2 h-5 w-5" />
              New List
            </Button>
          </div>
        }
      />

      {error && (
        <Alert
          theme={customTheme.alert}
          color="failure"
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List panel */}
        <Card theme={customTheme.card} className="lg:col-span-1">
          <h2 className="mb-4 text-lg font-bold dark:text-white">Your Lists</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : lists.length === 0 ? (
            <div className="py-8 text-center">
              <HiUserGroup className="mx-auto mb-3 h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No publish lists yet. Create one to start sharing reports.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => loadListDetail(list.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedList?.id === list.id
                      ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium dark:text-white">
                      {list.name}
                    </span>
                    <Badge color="gray" size="sm">
                      {list.memberCount}
                    </Badge>
                  </div>
                  {list.description && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {list.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Detail panel */}
        <Card theme={customTheme.card} className="lg:col-span-2">
          {selectedList ? (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold dark:text-white">
                    {selectedList.name}
                  </h2>
                  {selectedList.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedList.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    theme={customTheme.button}
                    size="sm"
                    color="primary"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <HiOutlinePlusCircle className="mr-1 h-4 w-4" />
                    Add Recipient
                  </Button>
                  <Button
                    theme={customTheme.button}
                    size="sm"
                    color="failure"
                    onClick={() => handleDeleteList(selectedList.id)}
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedList.members.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No recipients yet. Add graph IDs to this list.
                  </p>
                </div>
              ) : (
                <Table theme={customTheme.table}>
                  <TableHead>
                    <TableHeadCell>Graph ID</TableHeadCell>
                    <TableHeadCell>Organization</TableHeadCell>
                    <TableHeadCell>Added</TableHeadCell>
                    <TableHeadCell className="w-16"></TableHeadCell>
                  </TableHead>
                  <TableBody>
                    {selectedList.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium dark:text-white">
                              {member.targetGraphName || member.targetGraphId}
                            </span>
                            {member.targetGraphName && (
                              <span className="text-xs text-gray-400">
                                {member.targetGraphId}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.targetOrgName || (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(member.addedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            theme={customTheme.button}
                            size="xs"
                            color="failure"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <HiUserGroup className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                Select a list to view and manage its recipients.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Create list modal */}
      <Modal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="md"
      >
        <ModalHeader>Create Publish List</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <Label htmlFor="list-name">Name</Label>
              <TextInput
                id="list-name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. Series A Investors"
              />
            </div>
            <div>
              <Label htmlFor="list-desc">Description (optional)</Label>
              <TextInput
                id="list-desc"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Who receives reports via this list"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            theme={customTheme.button}
            color="purple"
            onClick={handleCreateList}
            disabled={isCreating || !newListName.trim()}
          >
            {isCreating ? <Spinner size="sm" className="mr-2" /> : null}
            Create
          </Button>
          <Button
            theme={customTheme.button}
            color="gray"
            onClick={() => setShowCreateModal(false)}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add member modal */}
      <Modal
        show={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false)
          setAddMemberError(null)
        }}
        size="md"
      >
        <ModalHeader>Add Recipient</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {addMemberError && (
              <Alert theme={customTheme.alert} color="failure">
                {addMemberError}
              </Alert>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the graph ID of the investor or entity you want to share
              reports with. They will receive a copy of any report you share to
              this list.
            </p>
            <div>
              <Label htmlFor="member-graph-id">Graph ID</Label>
              <TextInput
                id="member-graph-id"
                value={newMemberGraphId}
                onChange={(e) => setNewMemberGraphId(e.target.value)}
                placeholder="e.g. kg01abc123def456"
                className="font-mono"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            theme={customTheme.button}
            color="purple"
            onClick={handleAddMember}
            disabled={isAddingMember || !newMemberGraphId.trim()}
          >
            {isAddingMember ? <Spinner size="sm" className="mr-2" /> : null}
            Add
          </Button>
          <Button
            theme={customTheme.button}
            color="gray"
            onClick={() => {
              setShowAddMemberModal(false)
              setAddMemberError(null)
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </PageLayout>
  )
}

export default PublishListsContent
