import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { FormId } from 'formsg-shared/types'

import { MOCK_USER, userHandlers } from '~/mocks/msw/handlers/user'

import { viewportModes } from '~utils/storybook'

import { DeleteFormModal, DeleteFormModalProps } from './DeleteFormModal'

export default {
  title: 'Pages/WorkspacePage/DeleteFormModal',
  component: DeleteFormModal,
  args: {
    formToDelete: {
      _id: 'mock-form-id' as FormId,
      title:
        'Mock form name with a, to be honest, too long for its own good name. So long that it overflows the screen.',
      admin: MOCK_USER,
    },
  },
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    // Prevent flaky tests due to modal animating in.
    msw: userHandlers({ delay: 0 }),
  },
} as Meta<DeleteFormModalProps>

const Template: StoryFn<DeleteFormModalProps> = (args) => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <DeleteFormModal
      {...args}
      {...modalProps}
      onClose={() => console.log('close modal')}
    />
  )
}
export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('mobile') } }
