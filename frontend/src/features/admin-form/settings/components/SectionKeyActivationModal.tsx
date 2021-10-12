import {
  Container,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react'

export type SectionKeyActivationModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

export const SectionKeyActivationModal = ({
  onClose,
  isOpen,
}: SectionKeyActivationModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalContent>
        <ModalCloseButton />
        <ModalBody whiteSpace="pre-line">
          <Container maxW="42.5rem">
            <Text as="h1" textStyle="h2" color="secondary.500">
              Activate your form
            </Text>
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
