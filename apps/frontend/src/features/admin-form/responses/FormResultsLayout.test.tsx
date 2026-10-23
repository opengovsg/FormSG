import { BiCog } from 'react-icons/bi'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { FormResultsLayout } from './FormResultsLayout'

const state = vi.hoisted(() => ({ labels: true, mobile: true, charts: true }))
vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: () => state.labels,
}))
vi.mock('~hooks/useIsMobile', () => ({ useIsMobile: () => state.mobile }))
vi.mock('./components/FormResultsNavbar/DashboardVersionToggle', () => ({
  DashboardVersionToggle: () => null,
}))
vi.mock('./components/FormResultsNavbar/useResultsTabs', () => ({
  useResultsTabs: () => [
    { label: 'Responses', path: '', icon: BiCog },
    { label: 'Feedback', path: 'feedback', icon: BiCog },
    ...(state.charts
      ? [{ label: 'Charts', path: 'charts', icon: BiCog, badgeText: 'Beta' }]
      : []),
  ],
}))
const Location = () => <output>{useLocation().pathname}</output>
const setup = () =>
  render(
    <MemoryRouter
      initialEntries={['/admin/form/61540ece3d4a6e50ac0cc6ff/results/feedback']}
    >
      <Location />
      <Routes>
        <Route
          path="/admin/form/:formId/results"
          element={<FormResultsLayout />}
        >
          <Route path="feedback" element={<div>Feedback content</div>} />
          <Route path="charts" element={<div>Charts content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('Results labelled navigation', () => {
  beforeEach(() => {
    state.labels = true
    state.mobile = true
    state.charts = true
  })
  it('selects the current route, switches from labels, and preserves content on collapse', async () => {
    setup()
    expect(screen.getByRole('tab', { name: 'Feedback' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.click(screen.getByText('Charts'))
    expect(
      screen.getByText('/admin/form/61540ece3d4a6e50ac0cc6ff/results/charts'),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Charts' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toHaveAttribute('data-dd-action-name', 'results.sidebar.toggle_collapse')
    await userEvent.click(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    )
    expect(screen.getByText('Charts content')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('data-dd-action-name', 'results.sidebar.toggle_collapse')
    await userEvent.click(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    )
    expect(screen.getByRole('tab', { name: 'Charts' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
  it('automatically switches the route with arrow keys', async () => {
    setup()
    screen.getByRole('tab', { name: 'Feedback' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(
      screen.getByText('/admin/form/61540ece3d4a6e50ac0cc6ff/results/charts'),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Charts' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
  it('preserves gated tabs when charts is unavailable', () => {
    state.charts = false
    setup()
    expect(screen.queryByText('Charts')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Feedback' })).toBeInTheDocument()
  })
  it('has no mobile collapse controls in the control variant', () => {
    state.labels = false
    setup()
    expect(
      screen.queryByRole('button', { name: 'Collapse sidebar' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
})
