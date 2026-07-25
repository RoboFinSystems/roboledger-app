import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PlanWindowControl from '../components/PlanWindowControl'

const renderControl = (
  overrides: Partial<Parameters<typeof PlanWindowControl>[0]> = {}
) => {
  const props = {
    history: '12' as const,
    forecast: 'all' as const,
    onHistoryChange: vi.fn(),
    onForecastChange: vi.fn(),
    forecastEnabled: true,
    ...overrides,
  }
  render(<PlanWindowControl {...props} />)
  return props
}

describe('PlanWindowControl', () => {
  it('renders two labeled groups with independent selections', () => {
    renderControl()
    const history = screen.getByTestId('plan-window-history')
    const forecast = screen.getByTestId('plan-window-forecast')
    expect(within(history).getByText('12M')).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(within(forecast).getByText('All')).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('routes clicks to the matching side', () => {
    const props = renderControl()
    fireEvent.click(
      within(screen.getByTestId('plan-window-history')).getByText('3M')
    )
    fireEvent.click(
      within(screen.getByTestId('plan-window-forecast')).getByText('6M')
    )
    expect(props.onHistoryChange).toHaveBeenCalledWith('3')
    expect(props.onForecastChange).toHaveBeenCalledWith('6')
    expect(props.onHistoryChange).not.toHaveBeenCalledWith('6')
  })

  it('color-codes the active states to the column families', () => {
    renderControl()
    const historyActive = within(
      screen.getByTestId('plan-window-history')
    ).getByText('12M')
    const forecastActive = within(
      screen.getByTestId('plan-window-forecast')
    ).getByText('All')
    expect(historyActive.className).toContain('bg-gray-600')
    expect(forecastActive.className).toContain('bg-primary-600')
  })

  it('disables the forecast group on the actuals view', () => {
    const props = renderControl({ forecastEnabled: false })
    const forecast = screen.getByTestId('plan-window-forecast')
    const button = within(forecast).getByText('12M')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(props.onForecastChange).not.toHaveBeenCalled()
    // The history side stays live.
    fireEvent.click(
      within(screen.getByTestId('plan-window-history')).getByText('6M')
    )
    expect(props.onHistoryChange).toHaveBeenCalledWith('6')
  })
})
