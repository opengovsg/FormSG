import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import Button from '~components/Button'

import { ContactNumberInput } from './components/ContactNumberInput'

export const EmergencyContactModal = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <Button onClick={onOpen}>Open</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700">Emergency contact</ModalHeader>
          <ModalBody whiteSpace="pre-line" pb="3.25rem">
            <Text textStyle="body-2" color="secondary.500">
              Update your mobile number and verify it so we can contact you in
              the unlikely case of an urgent form issue. This number can be
              changed at any time in your user settings.
            </Text>
            <ContactNumberInput />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
