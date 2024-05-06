import { MouseEvent, MouseEventHandler } from 'react'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'
import { Button, ModalCloseButton } from '@opengovsg/design-system-react'

import { useIsMobile } from '~hooks/useIsMobile'
import { ButtonGroup } from '~components/ButtonGroup'

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
  // We need to dismiss the FormPaymentModal to release the scroll lock that affects the captcha
  const closeAndSubmit = (event: MouseEvent<HTMLButtonElement>) => {
    onClose()
    if (onSubmit) {
      onSubmit(event)
    }
  }

  const isMobile = useIsMobile()

  return (
    <>
      <Modal isOpen onClose={onClose} size={isMobile ? 'full' : undefined}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader pb={'2rem'} w="90%">
            You are about to make payment
          </ModalHeader>
          <ModalBody flexGrow={0}>
            Please ensure that your form information is accurate. You will not
            be able to edit your form after you proceed.
          </ModalBody>
          <ModalFooter>
            <ButtonGroup isFullWidth={isMobile}>
              <Button variant="clear" onClick={onClose} isFullWidth={isMobile}>
                Cancel
              </Button>
              <Button
                isLoading={isSubmitting}
                loadingText="Submitting"
                onClick={closeAndSubmit}
                isFullWidth={isMobile}
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
