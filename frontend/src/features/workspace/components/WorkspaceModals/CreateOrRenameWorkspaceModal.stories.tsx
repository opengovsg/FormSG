import { MemoryRouter } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { userHandlers } from '~/mocks/msw/handlers/user'

import {
  fullScreenDecorator,
  getMobileViewParameters,
  LoggedInDecorator,
} from '~utils/storybook'

import {
  CreateOrRenameWorkspaceModal,
  CreateOrRenameWorkspaceModalProps,
} from '../WorkspaceModals/CreateOrRenameWorkspaceModal'

export default {
  title: 'Pages/WorkspacePage/CreateOrRenameWorkspaceModal',
  component: CreateOrRenameWorkspaceModal,
  decorators: [
    (storyFn) => <MemoryRouter>{storyFn()}</MemoryRouter>,
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

const Template: Story<CreateOrRenameWorkspaceModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <CreateOrRenameWorkspaceModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
    />
  )
}
export const CreateWorkspace = Template.bind({})
CreateWorkspace.args = { isCreatingWorkspace: true }

export const RenameWorkspace = Template.bind({})

export const CreateWorkspaceMobile = Template.bind({})
CreateWorkspaceMobile.parameters = getMobileViewParameters()
CreateWorkspaceMobile.args = { isCreatingWorkspace: true }

export const RenameWorkspaceMobile = Template.bind({})
RenameWorkspaceMobile.parameters = getMobileViewParameters()
