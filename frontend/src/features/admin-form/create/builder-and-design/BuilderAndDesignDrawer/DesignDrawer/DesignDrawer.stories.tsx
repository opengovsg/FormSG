import { Meta, StoryFn } from '@storybook/react'

import { FormColorTheme, FormLogoState, FormStartPage } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { CreatePageSidebarProvider } from '~features/admin-form/create/common'

import { DesignDrawer } from './DesignDrawer'

const DEFAULT_START_PAGE: FormStartPage = {
  logo: { state: FormLogoState.None },
  colorTheme: FormColorTheme.Blue,
  estTimeTaken: 15,
  paragraph:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
}

export default {
  title: 'Features/AdminForm/DesignDrawer',
  component: DesignDrawer,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
    EditFieldDrawerDecorator,
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: [...createFormBuilderMocks({}, 0)],
  },
  args: {
    startPage: DEFAULT_START_PAGE,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  startPage: FormStartPage
}

const Template: StoryFn<StoryArgs> = (args) => {
  return (
    <CreatePageSidebarProvider>
      <DesignDrawer {...args} />
    </CreatePageSidebarProvider>
  )
}

export const Default = Template.bind({})

export const WithEmptyParagraph = Template.bind({})
WithEmptyParagraph.args = {
  startPage: { ...DEFAULT_START_PAGE, paragraph: undefined },
}

export const WithEmptyTimeTaken = Template.bind({})
WithEmptyTimeTaken.args = {
  startPage: { ...DEFAULT_START_PAGE, estTimeTaken: undefined },
}
