import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { SettingsPage } from './SettingsPage'

const state = vi.hoisted(() => ({
  labels: true,
  mobile: true,
  multiLang: true,
  emailNavLabel: 'Emails',
}))
vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: () => state.labels,
}))
vi.mock('~hooks/useIsMobile', () => ({ useIsMobile: () => state.mobile }))
vi.mock('~features/user/queries', () => ({
  useUser: () => ({
    user: { betaFlags: { multiLangTranslation: state.multiLang } },
    isLoading: false,
  }),
}))
vi.mock('../common/queries', () => ({
  useAdminFormCollaborators: () => ({ hasEditAccess: true, isLoading: false }),
}))
vi.mock('./queries', () => ({
  useAdminFormSettings: () => ({ isLoading: false }),
}))
vi.mock('./SettingsGeneralPage', () => ({
  SettingsGeneralPage: () => <div>General content</div>,
}))
vi.mock('./SettingsAuthPage', () => ({
  SettingsAuthPage: () => <div>Singpass content</div>,
}))
vi.mock('./SettingsEmailsPage', () => ({
  SettingsEmailsPage: () => <div>Email notifications heading</div>,
}))
vi.mock('./SettingsWebhooksPage', () => ({
  SettingsWebhooksPage: () => <div>Webhooks content</div>,
}))
vi.mock('./SettingsPaymentsPage', () => ({
  SettingsPaymentsPage: () => <div>Payments content</div>,
}))
vi.mock('./SettingsMultiLangPage', () => ({
  SettingsMultiLangPage: () => <div>Multi-language heading</div>,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: () => ({
      general: { title: 'General' },
      singpass: { title: 'Singpass' },
      emailNotifications: { title: 'Email notifications' },
      webhooks: { title: 'Webhooks' },
      payments: { title: 'Payments' },
      tabs: {
        multiLanguage: 'Multi-language',
        newBadge: 'New',
        navLabels: { emails: state.emailNavLabel, multiLanguage: 'Multi-lang' },
      },
    }),
  }),
}))

const Location = () => <output>{useLocation().pathname}</output>
const setup = () =>
  render(
    <MemoryRouter initialEntries={['/admin/form/test/settings/general']}>
      <Location />
      <Routes>
        <Route
          path="/admin/form/:formId/settings/:settingsTab"
          element={<SettingsPage />}
        />
      </Routes>
    </MemoryRouter>,
  )

describe('Settings labelled navigation', () => {
  beforeEach(() => {
    state.labels = true
    state.mobile = true
    state.multiLang = true
    state.emailNavLabel = 'Emails'
  })
  it('switches from the label and keeps the current route and page when collapsed', async () => {
    setup()
    await userEvent.click(screen.getByRole('tab', { name: 'Emails' }))
    expect(screen.getByRole('tab', { name: 'Emails' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.getByText('/admin/form/test/settings/email-notifications'),
    ).toBeInTheDocument()
    expect(screen.getByText('Email notifications heading')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toHaveAttribute('data-dd-action-name', 'settings.sidebar.toggle_collapse')
    await userEvent.click(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    )
    expect(screen.getByText('Email notifications heading')).toBeInTheDocument()
    expect(
      screen.queryByRole('tab', { name: 'Emails' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('data-dd-action-name', 'settings.sidebar.toggle_collapse')
    await userEvent.click(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    )
    expect(screen.getByRole('tab', { name: 'Emails' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
  it('uses the translated nav label while preserving the heading and destination', async () => {
    state.emailNavLabel = 'Translated emails'
    setup()
    await userEvent.click(
      screen.getByRole('tab', { name: 'Translated emails' }),
    )
    expect(
      screen.getByText('/admin/form/test/settings/email-notifications'),
    ).toBeInTheDocument()
    expect(screen.getByText('Email notifications heading')).toBeInTheDocument()
  })
  it('moves focus with arrow keys and activates settings only on Enter', async () => {
    setup()
    screen.getByRole('tab', { name: 'General' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(
      screen.getByText('/admin/form/test/settings/general'),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Singpass' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(
      screen.getByText('/admin/form/test/settings/singpass'),
    ).toBeInTheDocument()
  })
  it('shortens only the labelled navigation and preserves the language gate', () => {
    state.multiLang = false
    setup()
    expect(
      screen.queryByRole('tab', { name: 'Multi-lang' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Emails' })).toBeInTheDocument()
  })
  it('preserves the control labels and mobile navigation when the flag is off', () => {
    state.labels = false
    setup()
    expect(screen.getByText('Email notifications')).toBeInTheDocument()
    expect(screen.getByText('Multi-language')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Collapse sidebar' }),
    ).not.toBeInTheDocument()
  })
})
