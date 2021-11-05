import { MemoryRouter, Route } from 'react-router'
import { Meta, Story } from '@storybook/react'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from '~shared/types/form'

import {
  getAdminFormSettings,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import { SettingsAuthPage } from './SettingsAuthPage'

const buildMswRoutes = (overrides?: Partial<FormSettings>) => [
  getAdminFormSettings({ overrides }),
  patchAdminFormSettings({ overrides }),
]

export default {
  title: 'Pages/AdminFormPage/Settings/AuthTab',
  component: SettingsAuthPage,
  decorators: [
    (storyFn) => {
      // MemoryRouter is used so react-router-dom#Link components can work
      // (and also to force the initial tab the page renders to be the settings tab).
      return (
        <MemoryRouter initialEntries={['/admin/form/1234/settings']}>
          <Route path="/admin/form/:formId">{storyFn()}</Route>
        </MemoryRouter>
      )
    },
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story = () => <SettingsAuthPage />
export const PrivateEmailForm = Template.bind({})
PrivateEmailForm.parameters = {
  msw: buildMswRoutes({ status: FormStatus.Private }),
}

export const PrivateStorageForm = Template.bind({})

PrivateStorageForm.parameters = {
  msw: buildMswRoutes({
    responseMode: FormResponseMode.Encrypt,
    status: FormStatus.Private,
  }),
}

export const PublicEmailSingpassForm = Template.bind({})
PublicEmailSingpassForm.parameters = {
  msw: buildMswRoutes({
    status: FormStatus.Public,
    authType: FormAuthType.SP,
    esrvcId: 'STORYBOOK-TEST',
  }),
}

export const PrivateStorageCorppassForm = Template.bind({})
PrivateStorageCorppassForm.parameters = {
  msw: buildMswRoutes({
    status: FormStatus.Private,
    authType: FormAuthType.CP,
    responseMode: FormResponseMode.Encrypt,
  }),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [getAdminFormSettings({ delay: 'infinite' })],
}
