'use client'

import { customTheme, useUserLimits } from '@/lib/core'
import type { GraphInfo } from '@robosystems/client'
import { getGraphs } from '@robosystems/client'
import {
  Badge,
  Button,
  Card,
  Dropdown,
  DropdownDivider,
  DropdownItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from 'flowbite-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  HiCog,
  HiDatabase,
  HiDotsVertical,
  HiExternalLink,
  HiPencil,
  HiPlus,
  HiRefresh,
  HiSearch,
  HiTrash,
} from 'react-icons/hi'

interface GraphDatabase {
  id: string
  name: string
  role: string
  isSelected: boolean
}

export function GraphsContent() {
  const [graphs, setGraphs] = useState<GraphDatabase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const { limits, remainingGraphs, canCreateGraph } = useUserLimits()

  useEffect(() => {
    fetchGraphs()
  }, [])

  const fetchGraphs = async () => {
    setLoading(true)
    try {
      const response = await getGraphs()

      if (response.data?.graphs) {
        const mappedGraphs: GraphDatabase[] = response.data.graphs.map(
          (graph: GraphInfo) => ({
            id: graph.graphId,
            name: graph.graphName,
            role: graph.role,
            isSelected: graph.isSelected,
          })
        )

        setGraphs(mappedGraphs)
      }
    } catch (error) {
      console.error('Failed to fetch graphs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGraphs = graphs.filter((graph) => {
    const matchesSearch =
      graph.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      graph.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || graph.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'purple'
      case 'member':
        return 'info'
      case 'viewer':
        return 'gray'
      default:
        return 'gray'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Graph Databases
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your graph databases and monitor credit usage
          </p>
          {limits && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {graphs.length} of {limits.max_graphs} graphs used
            </p>
          )}
        </div>
        {canCreateGraph ? (
          <Button href="/graphs/new" as={Link}>
            <HiPlus className="mr-2 h-5 w-5" />
            Create Graph
          </Button>
        ) : (
          <Button
            color="gray"
            disabled
            title={`Graph limit reached (${limits?.max_graphs || 0} max)`}
          >
            <HiPlus className="mr-2 h-5 w-5" />
            Create Graph (Limit Reached)
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Card theme={customTheme.card}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Graphs
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {graphs.length}
              </p>
            </div>
            <HiDatabase className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          </div>
        </Card>

        <Card theme={customTheme.card}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Admin Access
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {graphs.filter((g) => g.role.toLowerCase() === 'admin').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 p-2 dark:bg-purple-900">
              <div className="h-6 w-6 rounded-full bg-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <TextInput
            icon={HiSearch}
            placeholder="Search graphs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Dropdown
            label={`Role: ${selectedRole === 'all' ? 'All' : selectedRole}`}
            color="gray"
          >
            <DropdownItem onClick={() => setSelectedRole('all')}>
              All Roles
            </DropdownItem>
            <DropdownItem onClick={() => setSelectedRole('admin')}>
              Admin
            </DropdownItem>
            <DropdownItem onClick={() => setSelectedRole('member')}>
              Member
            </DropdownItem>
            <DropdownItem onClick={() => setSelectedRole('viewer')}>
              Viewer
            </DropdownItem>
          </Dropdown>
        </div>
        <Button color="gray" onClick={fetchGraphs}>
          <HiRefresh className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Graphs Table */}
      <div className="overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell>Graph Database</TableHeadCell>
            <TableHeadCell>Role</TableHeadCell>
            <TableHeadCell>
              <span className="sr-only">Actions</span>
            </TableHeadCell>
          </TableHead>
          <TableBody className="divide-y">
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Loading graphs...
                </TableCell>
              </TableRow>
            ) : filteredGraphs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No graphs found
                </TableCell>
              </TableRow>
            ) : (
              filteredGraphs.map((graph) => {
                return (
                  <TableRow
                    key={graph.id}
                    className="bg-white dark:border-gray-700 dark:bg-zinc-800"
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{graph.name}</span>
                          {graph.isSelected && (
                            <Badge color="success" size="xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {graph.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge color={getRoleBadgeColor(graph.role)}>
                        {graph.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dropdown
                        label=""
                        renderTrigger={() => (
                          <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                            <HiDotsVertical className="h-5 w-5" />
                          </button>
                        )}
                        placement="bottom-end"
                      >
                        <DropdownItem
                          icon={HiExternalLink}
                          href={`/graphs/${graph.id}`}
                          as={Link}
                        >
                          Open Dashboard
                        </DropdownItem>
                        <DropdownItem
                          icon={HiCog}
                          href={`/graphs/${graph.id}/settings`}
                          as={Link}
                        >
                          Settings
                        </DropdownItem>
                        <DropdownItem
                          icon={HiPencil}
                          href={`/graphs/${graph.id}/schema`}
                          as={Link}
                        >
                          Schema Editor
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem
                          icon={HiTrash}
                          className="text-red-600 dark:text-red-500"
                          disabled={graph.role.toLowerCase() !== 'admin'}
                        >
                          Delete Graph
                        </DropdownItem>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
