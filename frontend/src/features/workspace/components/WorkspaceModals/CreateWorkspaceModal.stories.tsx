import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { userHandlers } from '~/mocks/msw/handlers/user'

import { getMobileViewParameters } from '~utils/storybook'

import {
  CreateWorkspaceModal,
  CreateWorkspaceModalProps,
} from './CreateWorkspaceModal'

export default {
  title: 'Pages/WorkspacePage/CreateWorkspaceModal',
  component: CreateWorkspaceModal,
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: userHandlers({ delay: 0 }),
  },
} as Meta

const Template: StoryFn<CreateWorkspaceModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <CreateWorkspaceModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
    />
  )
}

export const CreateWorkspace = Template.bind({})

export const CreateWorkspaceMobile = Template.bind({})
CreateWorkspaceMobile.parameters = getMobileViewParameters()
