import { useDisclosure } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { FormId } from '~shared/types'

import { MOCK_USER, userHandlers } from '~/mocks/msw/handlers/user'

import { getMobileViewParameters } from '~utils/storybook'

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
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
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

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()
