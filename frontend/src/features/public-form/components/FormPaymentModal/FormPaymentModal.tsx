import { MouseEvent, MouseEventHandler } from 'react'
import {
  ButtonGroup,
  ButtonGroupProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

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
  const props = { size: isMobile ? 'full' : undefined }
  const responsiveProps: ButtonGroupProps = isMobile
    ? {
        flexDir: 'column-reverse',
        w: '100%',
        spacing: 0,
        pt: '2rem',
        rowGap: '0.75rem',
      }
    : {}

  return (
    <>
      <Modal {...props} isOpen onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          {!isMobile && <ModalCloseButton />}
          <ModalHeader>You are about to make payment</ModalHeader>
          <ModalBody flexGrow={0}>
            Please ensure that your form information is accurate. You will not
            be able to edit your form after you proceed.
          </ModalBody>
          <ModalFooter>
            <ButtonGroup {...responsiveProps}>
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
