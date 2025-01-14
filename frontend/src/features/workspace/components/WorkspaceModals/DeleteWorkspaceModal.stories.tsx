import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { FormId, UserId } from '~shared/types'
import { Workspace, WorkspaceId } from '~shared/types/workspace'

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

const Template: StoryFn<DeleteWorkspaceModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  const mockWorkspace: Workspace = {
    _id: '' as WorkspaceId,
    title: 'ImAWorkspace',
    formIds: ['' as FormId],
    admin: '' as UserId,
  }

  return (
    <DeleteWorkspaceModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
      activeWorkspace={mockWorkspace}
    />
  )
}
export const DeleteWorkspace = Template.bind({})

export const DeleteWorkspaceMobile = Template.bind({})
DeleteWorkspaceMobile.parameters = getMobileViewParameters()
