import { Meta, Story } from '@storybook/react'

import { FormAuthType } from '~shared/types'

import { getPreviewFormResponse } from '~/mocks/msw/handlers/admin-form/preview-form'

import { ADMINFORM_BUILD_SUBROUTE } from '~constants/routes'
import { getMobileViewParameters, StoryRouter } from '~utils/storybook'

import { PreviewFormProvider } from '~features/admin-form/preview/PreviewFormProvider'

import { PreviewFormHeader as PreviewFormHeaderComponent } from './PreviewFormHeader'

export default {
  title: 'Features/AdminForm/PreviewFormHeader',
  parameters: {
    layout: 'fullscreen',
    msw: [getPreviewFormResponse()],
  },
  component: PreviewFormHeaderComponent,
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

const Template: Story = () => <PreviewFormHeaderComponent />

export const Desktop = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

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
