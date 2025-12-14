import {
  Button,
  Dropdown,
  DropdownItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import React from 'react'
import {
  HiCheckCircle,
  HiDotsVertical,
  HiExclamationCircle,
  HiKey,
  HiTrash,
} from 'react-icons/hi'
import type { ApiKey } from '../types'

export interface ApiKeyTableProps {
  apiKeys: ApiKey[]
  onRevokeKey: (keyId: string) => void
  theme?: any
  formatDate?: (date: Date | string | null | undefined) => string
}

const defaultFormatDate = (date: Date | string | null | undefined) => {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const ApiKeyTable: React.FC<ApiKeyTableProps> = ({
  apiKeys = [],
  onRevokeKey,
  theme,
  formatDate = defaultFormatDate,
}) => {
  // Defensive check to ensure apiKeys is always an array
  const safeApiKeys = Array.isArray(apiKeys) ? apiKeys : []

  return (
    <div className="overflow-x-auto">
      <Table className="table-fixed">
        <TableHead>
          <TableHeadCell className="w-[40%]">Name</TableHeadCell>
          <TableHeadCell className="w-[15%] whitespace-nowrap">
            Created
          </TableHeadCell>
          <TableHeadCell className="w-[15%] whitespace-nowrap">
            Last Used
          </TableHeadCell>
          <TableHeadCell className="w-[15%] whitespace-nowrap">
            Status
          </TableHeadCell>
          <TableHeadCell className="w-[15%] text-right">Actions</TableHeadCell>
        </TableHead>
        <TableBody className="divide-y">
          {safeApiKeys.map((key) => (
            <TableRow key={key.id} className="dark:border-zinc-700">
              <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                <div className="flex min-w-0 items-center gap-2">
                  <HiKey className="h-5 w-5 shrink-0 text-zinc-600 dark:text-zinc-400" />
                  <span className="truncate" title={key.name}>
                    {key.name}
                  </span>
                  {key.isSystem && (
                    <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      System
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                {formatDate(key.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                {formatDate(key.lastUsedAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {key.isActive ? (
                  <div className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-100">
                    <HiCheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-800 dark:text-red-100">
                    <HiExclamationCircle className="mr-1 h-3 w-3" />
                    Revoked
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex justify-end">
                  <Dropdown
                    theme={theme?.dropdown}
                    label=""
                    dismissOnClick={true}
                    renderTrigger={() => (
                      <Button
                        theme={theme?.button}
                        size="sm"
                        pill
                        className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                      >
                        <HiDotsVertical className="h-4 w-4" />
                      </Button>
                    )}
                  >
                    <DropdownItem
                      onClick={() => onRevokeKey(key.id)}
                      disabled={!key.isActive || key.isSystem}
                      icon={HiTrash}
                      className="hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      Revoke
                    </DropdownItem>
                  </Dropdown>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
