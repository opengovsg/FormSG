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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
            {t('features.publicForm.components.duplicatePaymentModal.title')}
          </ModalHeader>
          <ModalBody flexGrow={0}>
            <Stack>
              <Text>
                {t(
                  'features.publicForm.components.duplicatePaymentModal.description.existingPayment',
                )}
                &nbsp;
                <Link href={paymentUrl}>
                  {t(
                    'features.publicForm.components.duplicatePaymentModal.description.viewPreviousPayment',
                  )}
                </Link>
              </Text>
              <br />
              <Text>
                {t(
                  'features.publicForm.components.duplicatePaymentModal.description.confirm',
                )}
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup isFullWidth={isMobile}>
              <Button variant="clear" onClick={onClose}>
                {t(
                  'features.publicForm.components.duplicatePaymentModal.actions.cancel',
                )}
              </Button>
              <Button
                isLoading={isSubmitting}
                loadingText={t(
                  'features.publicForm.components.duplicatePaymentModal.actions.submitting',
                )}
                onClick={closeAndSubmit}
              >
                {t(
                  'features.publicForm.components.duplicatePaymentModal.actions.submit',
                )}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
