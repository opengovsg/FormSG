import {
  Container,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

export type DeleteFormModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

export const DeleteFormModal = ({
  isOpen,
  onClose,
}: DeleteFormModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">
          <Container maxW="42.5rem" p={0}>
            Delete form
          </Container>
        </ModalHeader>
        <ModalBody whiteSpace="pre-line">
          <Container maxW="42.5rem" p={0}>
            eisnrioetnstienrstiens
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
