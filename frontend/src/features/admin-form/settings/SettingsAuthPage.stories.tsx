import { Meta, Story } from '@storybook/react'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from '~shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormSettings,
  MOCK_FORM_FIELDS_WITH_MYINFO,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { SettingsAuthPage } from './SettingsAuthPage'

const buildMswRoutes = (overrides?: Partial<FormSettings>) => [
  getAdminFormSettings({ overrides }),
  patchAdminFormSettings({ overrides }),
]

export default {
  title: 'Pages/AdminFormPage/Settings/AuthTab',
  component: SettingsAuthPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story = () => <SettingsAuthPage />
export const PrivateEmailNilAuthForm = Template.bind({})
PrivateEmailNilAuthForm.parameters = {
  msw: buildMswRoutes({ status: FormStatus.Private }),
}

export const PrivateStorageNilAuthForm = Template.bind({})
PrivateStorageNilAuthForm.parameters = {
  msw: buildMswRoutes({
    responseMode: FormResponseMode.Encrypt,
    status: FormStatus.Private,
  }),
}

export const PublicEmailNilAuthForm = Template.bind({})
PublicEmailNilAuthForm.parameters = {
  msw: buildMswRoutes({
    responseMode: FormResponseMode.Email,
    status: FormStatus.Public,
  }),
}

export const PublicStorageNilAuthForm = Template.bind({})
PublicStorageNilAuthForm.parameters = {
  msw: buildMswRoutes({
    responseMode: FormResponseMode.Encrypt,
    status: FormStatus.Public,
  }),
}

// purpose: tests that isNricMaskEnabled should not affect setting options available
export const PublicStorageNilAuthFormNricMaskingEnabled = Template.bind({})
PublicStorageNilAuthFormNricMaskingEnabled.parameters = {
  msw: buildMswRoutes({
    responseMode: FormResponseMode.Encrypt,
    status: FormStatus.Public,
    isNricMaskEnabled: true,
  }),
}

export const PrivateStorageCorppassForm = Template.bind({})
PrivateStorageCorppassForm.parameters = {
  msw: buildMswRoutes({
    status: FormStatus.Private,
    authType: FormAuthType.CP,
    responseMode: FormResponseMode.Encrypt,
    esrvcId: 'STORYBOOK-TEST',
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

export const PrivateEmailMyInfoWithoutMyInfoFieldsForm = Template.bind({})
PrivateEmailMyInfoWithoutMyInfoFieldsForm.parameters = {
  msw: [
    ...buildMswRoutes({
      status: FormStatus.Private,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
    }),
    ...createFormBuilderMocks({ form_fields: [] }),
  ],
}

export const PrivateEmailMyinfoForm = Template.bind({})
PrivateEmailMyinfoForm.parameters = {
  msw: [
    ...buildMswRoutes({
      status: FormStatus.Private,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
    }),
    ...createFormBuilderMocks({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
  ],
}

export const PublicEmailMyInfoForm = Template.bind({})
PublicEmailMyInfoForm.parameters = {
  msw: [
    ...buildMswRoutes({
      status: FormStatus.Public,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
    }),
    ...createFormBuilderMocks({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
  ],
}

export const PrivateEmailSingpassFormNricMaskingEnabled = Template.bind({})
PrivateEmailSingpassFormNricMaskingEnabled.parameters = {
  msw: buildMswRoutes({
    status: FormStatus.Private,
    authType: FormAuthType.SGID,
    isNricMaskEnabled: true,
  }),
}
export const PrivateEmailMyInfoFormNricMaskingEnabled = Template.bind({})
PrivateEmailMyInfoFormNricMaskingEnabled.parameters = {
  msw: [
    ...buildMswRoutes({
      status: FormStatus.Private,
      authType: FormAuthType.MyInfo,
      esrvcId: 'STORYBOOK-TEST',
      isNricMaskEnabled: true,
    }),
    ...createFormBuilderMocks({ form_fields: MOCK_FORM_FIELDS_WITH_MYINFO }),
  ],
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [getAdminFormSettings({ delay: 'infinite' })],
}
