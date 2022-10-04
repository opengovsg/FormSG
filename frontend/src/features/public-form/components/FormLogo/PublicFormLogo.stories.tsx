import { MemoryRouter } from 'react-router-dom'
import { Meta, Story } from '@storybook/react'

import { FormLogoState } from '~shared/types/form/form_logo'

import { envHandlers } from '~/mocks/msw/handlers/env'
import {
  getCustomLogoResponse,
  getPublicFormResponse,
} from '~/mocks/msw/handlers/public-form'

import { PublicFormProvider } from '~features/public-form/PublicFormProvider'

import { FormSectionsProvider } from '../FormFields/FormSectionsContext'

import { PublicFormLogo } from './PublicFormLogo'

export default {
  title: 'Pages/PublicFormPage/PublicFormLogo',
  component: PublicFormLogo,
  decorators: [
    (storyFn) => (
      <MemoryRouter initialEntries={['/12345']}>
        <PublicFormProvider formId="61540ece3d4a6e50ac0cc6ff">
          <FormSectionsProvider>{storyFn()}</FormSectionsProvider>
        </PublicFormProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
  },
} as Meta

const Template: Story = () => <PublicFormLogo />

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [
    getPublicFormResponse({
      delay: 'infinite',
    }),
  ],
}

export const NoLogo = Template.bind({})
NoLogo.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test title',
        },
      },
      delay: 0,
    }),
  ],
}

export const CustomLogo = Template.bind({})
CustomLogo.parameters = {
  msw: [
    ...envHandlers,
    getCustomLogoResponse(),
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test title',
          startPage: {
            logo: {
              state: FormLogoState.Custom,
              fileId: 'mockFormLogo',
            },
          },
        },
      },
      delay: 0,
    }),
  ],
}
