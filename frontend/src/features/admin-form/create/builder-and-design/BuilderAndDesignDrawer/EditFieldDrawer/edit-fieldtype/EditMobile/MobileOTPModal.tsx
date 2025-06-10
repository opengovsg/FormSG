import { Modal, Text, useBreakpointValue } from '@chakra-ui/react'

export interface MobileOTPModalProps {
  isOpen: boolean
  onClose: () => void
  smsUsed: number
}

export const MobileOTPModal = ({
  isOpen,
  onClose,
  smsUsed,
}: MobileOTPModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <Text>Hello World</Text>
    </Modal>
  )
}
