import { MouseEventHandler } from 'react'
import {
  Button,
  ButtonGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

type FormPaymentModalProps = {
  onSubmit: MouseEventHandler<HTMLButtonElement> | undefined
  onClose: () => void
  isSubmitting: boolean
}

export const FormPaymentModal = ({
  onSubmit,
  onClose,
  isSubmitting,
}: FormPaymentModalProps): JSX.Element => {
  return (
    <>
      <Modal isOpen onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>You are about to make payment</ModalHeader>
          <ModalBody whiteSpace="pre-line">
            {
              'Please ensure that your form information is accurate. You will not be able to edit your form after you proceed.'
            }
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="clear" onClick={onClose}>
                Cancel
              </Button>
              <Button
                isLoading={isSubmitting}
                loadingText="Submitting"
                onClick={onSubmit}
              >
                Proceed to pay
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
