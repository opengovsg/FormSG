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

import { FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE } from '~shared/constants/'

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
          Only one submission per NRIC/FIN/UEN allowed
        </ModalHeader>
        <ModalBody flexGrow={0}>
          <Stack>
            <Text>{FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE}</Text>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup isFullWidth={isMobile}>
            <Button
              loadingText="Logging out"
              isDisabled={!handleLogout}
              onClick={singpassLogoutAndRedirectToFormLogin}
            >
              Back to Singpass log in
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
