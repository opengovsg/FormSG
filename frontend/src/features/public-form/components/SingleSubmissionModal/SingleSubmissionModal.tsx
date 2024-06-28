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

import { useIsMobile } from '~hooks/useIsMobile'
import ButtonGroup from '~components/ButtonGroup'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'
import { getPublicFormResponseSingpassLoginUrl } from '~features/public-form/utils/urls'

interface SingleSubmissionModalProps {
  formId: string
  onClose: () => void
  isOpen: boolean
}

// TODO: check if need to handle preview behavior
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
    navigate(getPublicFormResponseSingpassLoginUrl(formId))
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
          Only one submission per NRIC/FIN allowed
        </ModalHeader>
        <ModalBody flexGrow={0}>
          <Stack>
            <Text>
              You have already submitted a response using this NRIC/FIN. If you
              think this is a mistake, please contact the agency that gave you
              the form link.
            </Text>
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
