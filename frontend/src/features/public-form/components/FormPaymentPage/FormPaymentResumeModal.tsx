import { useNavigate } from 'react-router-dom'
import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  useDisclosure,
} from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import { useBrowserStm } from '~hooks/payments'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { usePublicFormContext } from '../../PublicFormContext'

/**
 * This component is split up so that input changes will not rerender the
 * entire FormFields component leading to terrible performance.
 */
export const PublicFormPaymentResumeModal = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { form, formId } = usePublicFormContext()

  const [lastPaymentMemory, , clearPaymentMemory] = useBrowserStm(formId)

  const isPaymentEnabled =
    form?.responseMode === FormResponseMode.Encrypt &&
    form?.payments_field?.enabled

  const { isOpen, onClose } = useDisclosure({
    defaultIsOpen: Boolean(lastPaymentMemory && isPaymentEnabled),
  })

  const navigate = useNavigate()
  if (!isOpen) {
    return <></>
  }
  const onSubmit = () => {
    if (!lastPaymentMemory) {
      onClose()
      return
    }
    navigate(`payment/${lastPaymentMemory.paymentId}`)
  }

  const handleStartOver = () => {
    clearPaymentMemory()
    onClose()
  }
  return (
    <Stack px={{ base: '1rem', md: 0 }} pt="2.5rem" pb="4rem">
      <Modal
        isOpen
        onClose={() => {
          // do nothing, prevent dismissal through backdrop touch
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Restore previous session?</ModalHeader>
          <ModalBody whiteSpace="pre-line">
            We noticed an incomplete session on this form. You can restore your
            previous session and complete payment.
          </ModalBody>
          <ModalFooter>
            <ButtonGroup flexWrap={'wrap'} justifyContent="end">
              <Button
                variant="clear"
                onClick={handleStartOver}
                isFullWidth={isMobile}
              >
                Start over again
              </Button>
              <Button onClick={onSubmit} isFullWidth={isMobile}>
                Restore previous session
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  )
}
