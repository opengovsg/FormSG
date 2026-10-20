import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { userHandlers } from '~/mocks/msw/handlers/user'

import { viewportModes } from '~utils/storybook'

import {
  CreateWorkspaceModal,
  CreateWorkspaceModalProps,
} from './CreateWorkspaceModal'

export default {
  title: 'Pages/WorkspacePage/CreateWorkspaceModal',
  component: CreateWorkspaceModal,
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    // Prevent flaky tests due to modal animating in.
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
CreateWorkspace.parameters = { argos: { modes: viewportModes('mobile') } }
