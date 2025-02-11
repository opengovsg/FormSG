import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

import { NextAndBackButtonGroup } from '~components/Button'

interface FormSaveDraftModalProps {
  onClose: () => void
  isOpen: boolean
  onSave: () => void
}

export const FormSaveDraftModal: React.FC<FormSaveDraftModalProps> = ({
  onClose,
  isOpen,
  onSave,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Save your responses?</ModalHeader>
        <ModalBody>
          Your responses will be saved to your device which you can continue
          from later.
        </ModalBody>
        <ModalFooter>
          <NextAndBackButtonGroup
            backButtonLabel="No, don't save"
            nextButtonLabel="Yes, save them"
            handleBack={onClose}
            handleNext={onSave}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
