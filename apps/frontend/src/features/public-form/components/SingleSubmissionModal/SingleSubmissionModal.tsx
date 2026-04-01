import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'

import { FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE } from 'formsg-shared/constants'

import { useIsMobile } from '~hooks/useIsMobile'
import ButtonGroup from '~components/ButtonGroup'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'
import { getPublicFormUrl } from '~features/public-form/utils/urls'

interface SingleSubmissionModalProps {
  formId: string
  onClose: () => void
  isOpen: boolean
}

export const SingleSubmissionModal = ({
  formId,
  isOpen,
  onClose,
}: SingleSubmissionModalProps) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const { handleLogout } = usePublicFormContext()

  const singpassLogoutAndRedirectToFormLogin = () => {
    if (!handleLogout) return
    handleLogout()
    navigate(getPublicFormUrl(formId))
  }

  return (
    <Modal
      isOpen={isOpen && !!handleLogout}
      onClose={onClose}
      size={isMobile ? 'full' : undefined}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader pb={'2rem'} w="90%">
          {t('features.publicForm.components.singleSubmissionModal.title')}
        </ModalHeader>
        <ModalBody flexGrow={0}>
          <Stack>
            <Text>{FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE}</Text>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup isFullWidth={isMobile}>
            <Button
              loadingText={t(
                'features.publicForm.components.singleSubmissionModal.logoutLoading',
              )}
              isDisabled={!handleLogout}
              onClick={singpassLogoutAndRedirectToFormLogin}
            >
              {t(
                'features.publicForm.components.singleSubmissionModal.backToLogin',
              )}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
