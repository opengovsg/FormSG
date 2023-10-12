import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
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
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">Submit form</ModalHeader>
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
            Open form in a new tab
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
