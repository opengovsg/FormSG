import { Meta, Story } from '@storybook/react'
import StoryRouter from 'storybook-react-router'

import { getPublicFormResponse } from '~/mocks/msw/handlers/public-form'

import { PublicFormPage } from './PublicFormPage'

export default {
  title: 'Pages/PublicFormPage',
  component: PublicFormPage,
  decorators: [StoryRouter()],
  parameters: {
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
