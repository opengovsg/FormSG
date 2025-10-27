import { MouseEvent, MouseEventHandler } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import ButtonGroup from '~components/ButtonGroup'
import { ModalCloseButton } from '~components/Modal'

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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.publicForm.components.payment.modal',
  })
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
            {t('header')}
          </ModalHeader>
          <ModalBody flexGrow={0}>{t('body')}</ModalBody>
          <ModalFooter>
            <ButtonGroup isFullWidth={isMobile}>
              <Button variant="clear" onClick={onClose} isFullWidth={isMobile}>
                {t('buttons.cancel')}
              </Button>
              <Button
                isLoading={isSubmitting}
                loadingText={t('buttons.submitting')}
                onClick={closeAndSubmit}
                isFullWidth={isMobile}
              >
                {t('buttons.proceed')}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
