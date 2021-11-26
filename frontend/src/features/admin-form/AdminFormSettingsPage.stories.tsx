import { MemoryRouter, Route } from 'react-router'
import { Routes } from 'react-router-dom'
import { Meta, Story } from '@storybook/react'

import { FormResponseMode, FormStatus } from '~shared/types/form/form'

import {
  getAdminFormResponse,
  getAdminFormSettings,
  getAdminFormSubmissions,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

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
        <MemoryRouter initialEntries={['/12345/settings']}>
          <Routes>
            <Route path={'/:formId'} element={<AdminFormLayout />}>
              <Route path="settings" element={storyFn()} />
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
      getAdminFormResponse(),
      getAdminFormSettings(),
      getAdminFormSubmissions(),
      patchAdminFormSettings(),
    ],
  },
} as Meta

const Template: Story = () => <SettingsPage />
export const Desktop = Template.bind({})

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
    getAdminFormResponse({ responseMode: FormResponseMode.Encrypt }),
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
  ],
}
