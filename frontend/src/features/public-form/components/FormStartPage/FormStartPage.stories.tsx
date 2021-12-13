import { Meta, Story } from '@storybook/react'

import { FormColorTheme } from '~shared/types/form/form'
import { FormLogoState } from '~shared/types/form/form_logo'

import { envHandlers } from '~/mocks/msw/handlers/env'
import {
  getCustomLogoResponse,
  getPublicFormResponse,
} from '~/mocks/msw/handlers/public-form'

import { StoryRouter } from '~utils/storybook'

import { PublicFormProvider } from '~features/public-form/PublicFormContext'

import {
  MiniHeader as MiniHeaderComponent,
  MiniHeaderProps,
} from './FormHeader'
import { FormStartPage } from './FormStartPage'

export default {
  title: 'Pages/PublicFormPage/FormStartPage',
  component: FormStartPage,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
    (storyFn) => <PublicFormProvider>{storyFn()}</PublicFormProvider>,
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
  },
} as Meta

const Template: Story = () => <FormStartPage />
export const NoLogo = Template.bind({})
NoLogo.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        title: 'storybook test title',
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
        title: 'storybook test title',
        startPage: {
          logo: {
            state: FormLogoState.Custom,
            fileId: 'mockFormLogo',
          },
        },
      },
      delay: 0,
    }),
  ],
}

export const NoEstimatedTime = Template.bind({})
NoEstimatedTime.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        title: 'storybook no estimated time',
        startPage: {
          estTimeTaken: 0,
        },
      },
      delay: 0,
    }),
  ],
}

export const ColorThemeBrown = Template.bind({})
ColorThemeBrown.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        title: 'storybook test brown theme',
        startPage: {
          colorTheme: FormColorTheme.Brown,
        },
      },
      delay: 0,
    }),
  ],
}
export const ColorThemeGreen = Template.bind({})
ColorThemeGreen.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        title: 'storybook test green theme',
        startPage: {
          colorTheme: FormColorTheme.Green,
        },
      },
      delay: 0,
    }),
  ],
}

export const ColorThemeGrey = Template.bind({})
ColorThemeGrey.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        title: 'storybook test grey theme',
        startPage: {
          colorTheme: FormColorTheme.Grey,
        },
      },
      delay: 0,
    }),
  ],
}

export const ColorThemeOrange = Template.bind({})
ColorThemeOrange.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        title: 'storybook test orange theme',
        startPage: {
          colorTheme: FormColorTheme.Orange,
        },
      },
      delay: 0,
    }),
  ],
}

export const ColorThemeRed = Template.bind({})
ColorThemeRed.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        title: 'storybook test red theme',
        startPage: {
          colorTheme: FormColorTheme.Red,
        },
      },
      delay: 0,
    }),
  ],
}

export const MiniHeader: Story<MiniHeaderProps> = (args) => (
  <MiniHeaderComponent {...args} />
)
MiniHeader.args = {
  isOpen: true,
}
MiniHeader.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        title: 'storybook test title',
      },
      delay: 0,
    }),
  ],
}
