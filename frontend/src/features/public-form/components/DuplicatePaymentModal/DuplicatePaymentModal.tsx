import { MouseEvent, MouseEventHandler } from 'react'
import {
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import ButtonGroup from '~components/ButtonGroup'
import { ModalCloseButton } from '~components/Modal'

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
  const isMobile = useIsMobile()

  return (
    <>
      <Modal isOpen onClose={onClose} size={isMobile ? 'full' : undefined}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader pb={'2rem'} w="90%">
            Proceed to pay again?
          </ModalHeader>
          <ModalBody flexGrow={0}>
            <Stack>
              <Text>
                We noticed a successful payment made on this form by your email
                address.&nbsp;
                <Link href={paymentUrl}>View your previous payment ↪</Link>
              </Text>
              <br />
              <Text>Do you wish to proceed to make another payment?</Text>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup isFullWidth={isMobile}>
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
