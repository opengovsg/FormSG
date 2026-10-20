import { Meta, StoryFn } from '@storybook/react-vite'

import { FormAuthType } from 'formsg-shared/types'

import { getPreviewFormResponse } from '~/mocks/msw/handlers/admin-form/preview-form'

import { ADMINFORM_BUILD_SUBROUTE } from '~constants/routes'
import { StoryRouter, viewportModes } from '~utils/storybook'

import { PreviewFormProvider } from '~features/admin-form/preview/PreviewFormProvider'

import { PreviewFormBanner as PreviewFormBannerComponent } from './PreviewFormBanner'

export default {
  title: 'Features/AdminForm/PreviewFormBanner',
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    msw: [getPreviewFormResponse()],
  },
  component: PreviewFormBannerComponent,
  decorators: [
    (storyFn) => (
      <PreviewFormProvider formId="61540ece3d4a6e50ac0cc6ff">
        {storyFn()}
      </PreviewFormProvider>
    ),
    StoryRouter({
      initialEntries: [ADMINFORM_BUILD_SUBROUTE],
      path: ADMINFORM_BUILD_SUBROUTE,
    }),
  ],
} as Meta

const Template: StoryFn = () => <PreviewFormBannerComponent />

export const Desktop = Template.bind({})
Desktop.parameters = { argos: { modes: viewportModes('mobile') } }

export const WithAuthenticatedForm = Template.bind({})
WithAuthenticatedForm.parameters = {
  msw: [
    getPreviewFormResponse({
      overrides: {
        form: {
          authType: FormAuthType.SP,
        },
      },
    }),
  ],
}
