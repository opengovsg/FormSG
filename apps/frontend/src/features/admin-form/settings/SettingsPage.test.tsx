import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { SettingsLink } from '../create/builder-and-design/BuilderAndDesignDrawer/FieldListDrawer/field-panels/LoginIdentityFieldSection'

import { SettingsPage } from './SettingsPage'

const state = vi.hoisted(() => ({
  mobile: true,
  multiLang: true,
  emailNavLabel: 'Emails',
}))
vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: () => true,
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
  useAdminForm: () => ({ data: undefined }),
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
    t: (key: string) =>
      key === 'features.common.betaBadgeLabel'
        ? 'Beta'
        : {
            general: { title: 'General' },
            singpass: { title: 'Singpass', loginTitle: 'Login' },
            emailNotifications: { title: 'Email notifications' },
            webhooks: { title: 'Webhooks' },
            payments: { title: 'Payments' },
            tabs: {
              multiLanguage: 'Multi-language',
              newBadge: 'New',
              navLabels: {
                emails: state.emailNavLabel,
                multiLanguage: 'Multi-lang',
              },
            },
          },
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
    state.mobile = true
    state.multiLang = true
    state.emailNavLabel = 'Emails'
  })
  it('clips the page shell so focus can scroll only the settings content', () => {
    setup()
    expect(screen.getByTestId('settings-content')).toHaveStyle({
      overflowY: 'auto',
    })
    expect(screen.getByTestId('settings-shell')).toHaveStyle({
      overflow: 'clip',
    })
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
    expect(screen.getByRole('tab', { name: 'Login' })).toHaveFocus()
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
  it('marks only the Multi-lang tab as Beta', () => {
    setup()
    expect(
      within(screen.getByRole('tab', { name: 'Multi-lang' })).getByText('Beta'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Beta')).toHaveLength(1)
  })
})

it('opens Singpass settings from the Create palette Settings link', async () => {
  render(
    <MemoryRouter initialEntries={['/admin/form/test']}>
      <Location />
      <Routes>
        <Route path="/admin/form/:formId">
          <Route index element={<SettingsLink>Settings</SettingsLink>} />
          <Route path="settings" element={<SettingsPage />}>
            <Route path=":settingsTab" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  await userEvent.click(screen.getByRole('link', { name: 'Settings' }))
  expect(
    screen.getByText('/admin/form/test/settings/singpass'),
  ).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Login' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(screen.getByText('Singpass content')).toBeInTheDocument()
})
