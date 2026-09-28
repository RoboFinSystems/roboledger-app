import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const replace = vi.fn()
const openConsoleDrawer = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))
vi.mock('@robosystems/core', () => ({
  openConsoleDrawer: () => openConsoleDrawer(),
}))

import ConsolePage from '../page'

describe('/console', () => {
  beforeEach(() => {
    replace.mockReset()
    openConsoleDrawer.mockReset()
  })

  it('opens the drawer and goes home', () => {
    render(<ConsolePage />)
    expect(openConsoleDrawer).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('/home')
  })
})
