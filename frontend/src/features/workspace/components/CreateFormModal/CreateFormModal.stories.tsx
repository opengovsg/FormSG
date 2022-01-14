/* eslint-disable @typescript-eslint/no-unused-vars */
import { MemoryRouter } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { userHandlers } from '~/mocks/msw/handlers/user'

import { fullScreenDecorator, LoggedInDecorator } from '~utils/storybook'

import { CreateFormModal, CreateFormModalProps } from './CreateFormModal'
import { CreateFormWizardProvider } from './CreateFormWizardContext'

export default {
  title: 'Pages/WorkspacePage/CreateFormModal',
  component: CreateFormModal,
  decorators: [
    (storyFn) => (
      <MemoryRouter>
        <CreateFormWizardProvider>{storyFn()}</CreateFormWizardProvider>
      </MemoryRouter>
    ),
    fullScreenDecorator,
    LoggedInDecorator,
  ],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: userHandlers({ delay: 0 }),
  },
} as Meta

const Template: Story<CreateFormModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <CreateFormModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
    />
  )
}
export const Default = Template.bind({})
Default.args = {}
Default.storyName = 'CreateFormModal'
