import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { ContactNumberInput } from './components/ContactNumberInput'

interface EmergencyContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export const EmergencyContactModal = ({
  isOpen,
  onClose,
}: EmergencyContactModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">Emergency contact</ModalHeader>
        <ModalBody whiteSpace="pre-wrap" pb="3.25rem">
          <Text textStyle="body-2" color="secondary.500">
            Update your mobile number and verify it so we can contact you in the
            unlikely case of an urgent form issue. This number can be changed at
            any time in your user settings.
          </Text>
          <ContactNumberInput />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
