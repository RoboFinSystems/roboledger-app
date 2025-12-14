import { SDK, useEntityCreationTask } from '@/lib/core'
import React from 'react'

// Mock implementation that matches the old CreateEntityModal behavior for tests
export default function CreateEntityGraphModal({
  buttonSize = 'sm',
  buttonText = 'Create Knowledge Graph',
  showIcon = true,
}: {
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg'
  buttonText?: string
  showIcon?: boolean
}) {
  const [isOpen, setOpen] = React.useState(false)
  const { isLoading, error, createEntityWithGraph, reset } =
    useEntityCreationTask()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    const result = await createEntityWithGraph({
      name,
      uri: name.toLowerCase().replace(/\s+/g, '-'),
    })

    if (result?.graph_id) {
      await SDK.selectGraph({ path: { graph_id: result.graph_id } })
      // Entities will be loaded by the EntityContext
    }

    setOpen(false)
    window.location.reload()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}>{buttonText}</button>
      {isOpen && (
        <div data-testid="modal">
          <h3>Create New Knowledge Graph</h3>
          {isLoading ? (
            <div>Creating Knowledge Graph</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div>Error! {error}</div>}
              <input
                name="name"
                placeholder="e.g., Acme Corporation"
                required
              />
              <button type="submit">Create</button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
