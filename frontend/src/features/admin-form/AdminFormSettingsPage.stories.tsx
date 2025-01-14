import { MemoryRouter, Route } from 'react-router'
import { Routes } from 'react-router-dom'
import { Meta, StoryFn } from '@storybook/react'

import {
  FormAuthType,
  FormResponseMode,
  FormStatus,
} from '~shared/types/form/form'

import {
  createFormBuilderMocks,
  getAdminFormCollaborators,
  getAdminFormSettings,
  getAdminFormSubmissions,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'
import { getUser } from '~/mocks/msw/handlers/user'

import { ADMINFORM_ROUTE, ADMINFORM_SETTINGS_SUBROUTE } from '~constants/routes'
import formsgSdk from '~utils/formSdk'
import { viewports } from '~utils/storybook'

import { AdminFormLayout } from './common/AdminFormLayout'
import { SettingsPage } from './settings/SettingsPage'

export default {
  title: 'Pages/AdminFormPage/Settings',
  component: SettingsPage,
  decorators: [
    (storyFn) => {
      // MemoryRouter is used so react-router-dom#Link components can work
      // (and also to force the initial tab the page renders to be the settings tab).
      return (
        <MemoryRouter
          initialEntries={[
            `${ADMINFORM_ROUTE}/61540ece3d4a6e50ac0cc6ff/${ADMINFORM_SETTINGS_SUBROUTE}`,
          ]}
        >
          <Routes>
            <Route
              path={`${ADMINFORM_ROUTE}/:formId`}
              element={<AdminFormLayout />}
            >
              <Route path={ADMINFORM_SETTINGS_SUBROUTE} element={storyFn()} />
            </Route>
          </Routes>
        </MemoryRouter>
      )
    },
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: [
      ...createFormBuilderMocks(),
      getAdminFormSettings(),
      getAdminFormSubmissions(),
      patchAdminFormSettings(),
      getUser(),
      getAdminFormCollaborators(),
    ],
  },
} as Meta

const Template: StoryFn = () => <SettingsPage />
export const Desktop = Template.bind({})

export const PreventActivation = Template.bind({})
PreventActivation.parameters = {
  msw: [
    ...createFormBuilderMocks(),
    getAdminFormSubmissions(),
    patchAdminFormSettings(),
    getAdminFormSettings({
      overrides: {
        status: FormStatus.Private,
        authType: FormAuthType.SP,
        esrvcId: '',
      },
    }),
    getUser(),
    getAdminFormCollaborators(),
  ],
}

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

const storageModeKeypair = formsgSdk.crypto.generate()

export const StorageModeSettings = Template.bind({})
StorageModeSettings.parameters = {
  docs: {
    storyDescription: `The passing secret key is ${storageModeKeypair.secretKey}`,
  },
  msw: [
    ...createFormBuilderMocks({ responseMode: FormResponseMode.Encrypt }),
    getAdminFormSettings({
      mode: FormResponseMode.Encrypt,
      overrides: {
        status: FormStatus.Private,
        publicKey: storageModeKeypair.publicKey,
      },
    }),
    getAdminFormSubmissions(),
    patchAdminFormSettings({
      mode: FormResponseMode.Encrypt,
      overrides: { publicKey: storageModeKeypair.publicKey },
    }),
    getUser(),
    getAdminFormCollaborators(),
  ],
}
