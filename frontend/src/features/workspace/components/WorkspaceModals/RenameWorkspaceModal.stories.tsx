import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

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

const Template: Story<RenameWorkspaceModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <RenameWorkspaceModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
    />
  )
}
export const RenameWorkspace = Template.bind({})

export const RenameWorkspaceMobile = Template.bind({})
RenameWorkspaceMobile.parameters = getMobileViewParameters()
