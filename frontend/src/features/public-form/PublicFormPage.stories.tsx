import { Meta, Story } from '@storybook/react'

import { getPublicFormResponse } from '~/mocks/msw/handlers/public-form'

import { StoryRouter } from '~utils/storybook'

import { PublicFormPage } from './PublicFormPage'

export default {
  title: 'Pages/PublicFormPage',
  component: PublicFormPage,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: [getPublicFormResponse({ delay: 0 })],
  },
} as Meta

const Template: Story = () => <PublicFormPage />
export const Default = Template.bind({})

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [getPublicFormResponse({ delay: 'infinite' })],
}
