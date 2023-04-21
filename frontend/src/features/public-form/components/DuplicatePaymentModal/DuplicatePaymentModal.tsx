import { MouseEvent, MouseEventHandler } from 'react'
import {
  Button,
  ButtonGroup,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

import { getPaymentPageUrl } from '~features/public-form/utils/urls'

type DuplicatePaymentModalProps = {
  onSubmit: MouseEventHandler<HTMLButtonElement> | undefined
  onClose: () => void
  isSubmitting: boolean
  formId: string
  paymentId: string
}

export const DuplicatePaymentModal = ({
  onSubmit,
  onClose,
  isSubmitting,
  formId,
  paymentId,
}: DuplicatePaymentModalProps): JSX.Element => {
  const paymentUrl = getPaymentPageUrl(formId, paymentId)

  // We need to dismiss the Modal to release the scroll lock that affects the captcha
  const closeAndSubmit = (event: MouseEvent<HTMLButtonElement>) => {
    onClose()
    if (onSubmit) {
      onSubmit(event)
    }
  }
  return (
    <>
      <Modal isOpen onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Proceed to pay again?</ModalHeader>
          <ModalBody>
            We noticed a successful payment made on this form by your email
            address.
            <Link href={paymentUrl}>View your previous payment</Link>
            {'\n'}Do you wish to proceed to make another payment?
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="clear" onClick={onClose}>
                Cancel
              </Button>
              <Button
                isLoading={isSubmitting}
                loadingText="Submitting"
                onClick={closeAndSubmit}
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
