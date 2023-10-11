import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

export type FormPreviewModalProps = {
  isOpen: boolean
  onClose: () => void
  formId?: string
}

export const FormPreviewModal = ({
  isOpen,
  onClose,
  formId,
}: FormPreviewModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">Submit this form</ModalHeader>
        <ModalBody>
          <iframe
            title={formId}
            id={formId}
            src={`/${formId}`}
            width="100%"
            height="500px"
          ></iframe>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => window.open(`/${formId}`)}>
            Open form in a new page
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
