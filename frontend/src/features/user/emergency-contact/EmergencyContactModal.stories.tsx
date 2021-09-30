import { useDisclosure } from '@chakra-ui/hooks'
import { Meta, Story } from '@storybook/react'

import { authHandlers } from '~/mocks/msw/handlers/auth'

import Button from '~components/Button'

import { EmergencyContactModal } from './EmergencyContactModal'

export default {
  title: 'Features/User/EmergencyContactModal',
  component: EmergencyContactModal,
  decorators: [],
  parameters: {
    layout: 'fullscreen',
    msw: authHandlers,
  },
} as Meta

const Template: Story = () => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <>
      <Button onClick={modalProps.onOpen}>Open modal</Button>
      <EmergencyContactModal {...modalProps} />
    </>
  )
}
export const Default = Template.bind({})
