import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { UserId } from '~shared/types'
import { Workspace, WorkspaceId } from '~shared/types/workspace'

import { userHandlers } from '~/mocks/msw/handlers/user'

import { getMobileViewParameters } from '~utils/storybook'

import {
  RenameWorkspaceModal,
  RenameWorkspaceModalProps,
} from './RenameWorkspaceModal'

export default {
  title: 'Pages/WorkspacePage/RenameWorkspaceModal',
  component: RenameWorkspaceModal,
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: userHandlers({ delay: 0 }),
  },
} as Meta

const Template: StoryFn<RenameWorkspaceModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })
  const mockWorkspace: Workspace = {
    _id: '' as WorkspaceId,
    title: 'ImAWorkspace',
    formIds: [],
    admin: '' as UserId,
  }

  return (
    <RenameWorkspaceModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
      activeWorkspace={mockWorkspace}
    />
  )
}
export const RenameWorkspace = Template.bind({})

export const RenameWorkspaceMobile = Template.bind({})
RenameWorkspaceMobile.parameters = getMobileViewParameters()
