import { MemoryRouter } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { FormId } from '~shared/types'

import { MOCK_USER, userHandlers } from '~/mocks/msw/handlers/user'

import { DeleteFormModal, DeleteFormModalProps } from './DeleteFormModal'

export default {
  title: 'Pages/WorkspacePage/DeleteFormModal',
  component: DeleteFormModal,
  // decorators: [(storyFn) => <MemoryRouter>{storyFn()}</MemoryRouter>],
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
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: userHandlers({ delay: 0 }),
  },
} as Meta<DeleteFormModalProps>

const Template: Story<DeleteFormModalProps> = (args) => {
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
