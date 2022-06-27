import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { userHandlers } from '~/mocks/msw/handlers/user'

import { getMobileViewParameters } from '~utils/storybook'

import {
  DeleteWorkspaceModal,
  DeleteWorkspaceModalProps,
} from '../WorkspaceModals/DeleteWorkspaceModal'

export default {
  title: 'Pages/WorkspacePage/DeleteWorkspaceModal',
  component: DeleteWorkspaceModal,
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: userHandlers({ delay: 0 }),
  },
} as Meta

const Template: Story<DeleteWorkspaceModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <DeleteWorkspaceModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
    />
  )
}
export const DeleteWorkspace = Template.bind({})

export const DeleteWorkspaceMobile = Template.bind({})
DeleteWorkspaceMobile.parameters = getMobileViewParameters()
