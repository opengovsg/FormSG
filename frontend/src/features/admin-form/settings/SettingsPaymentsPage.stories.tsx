import { Meta, StoryFn } from '@storybook/react'

import { FormResponseMode, FormSettings } from '~shared/types'

import {
  getAdminFormSettings,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { SettingsPaymentsPage } from './SettingsPaymentsPage'

const buildEncryptModeMswRoutes = (overrides?: Partial<FormSettings>) => [
  getAdminFormSettings({ overrides, mode: FormResponseMode.Encrypt }),
  patchAdminFormSettings({ overrides, mode: FormResponseMode.Encrypt }),
]

export default {
  title: 'Pages/AdminFormPage/Settings/PaymentsTab',
  component: SettingsPaymentsPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    msw: buildEncryptModeMswRoutes(),
  },
} as Meta

const Template: StoryFn = () => <SettingsPaymentsPage />
export const IsSingleSubmissionEnabledWithoutEmailNotifications = Template.bind(
  {},
)
IsSingleSubmissionEnabledWithoutEmailNotifications.parameters = {
  msw: buildEncryptModeMswRoutes({ isSingleSubmission: true, emails: [] }),
}

export const IsSingleSubmissionEnabledWithEmailNotifications = Template.bind({})
IsSingleSubmissionEnabledWithEmailNotifications.parameters = {
  msw: buildEncryptModeMswRoutes({
    isSingleSubmission: true,
    emails: ['dummy@dummy.com'],
  }),
}

export const IsSingleSubmissionDisabledWithoutEmailNotifications =
  Template.bind({})
IsSingleSubmissionDisabledWithoutEmailNotifications.parameters = {
  msw: buildEncryptModeMswRoutes({ isSingleSubmission: false, emails: [] }),
}
