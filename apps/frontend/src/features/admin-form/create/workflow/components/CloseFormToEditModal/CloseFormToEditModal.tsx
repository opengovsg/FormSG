import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { ADMINFORM_ROUTE, ADMINFORM_SETTINGS_SUBROUTE } from '~constants/routes'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

const COPY_KEY =
  'features.adminForm.sidebar.workflow.conditionalRouting.modals.closeFormFirstToEdit'

export interface CloseFormToEditModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CloseFormToEditModal = ({
  isOpen,
  onClose,
}: CloseFormToEditModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const navigate = useNavigate()
  const modalSize = useBreakpointValue({ base: 'mobile', md: 'md' })

  const handleGoToSettings = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SUBROUTE}`)
  }, [navigate, formId])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">
          {t(`${COPY_KEY}.title`)}
        </ModalHeader>
        <ModalBody>
          <Text textStyle="body-2" color="secondary.500">
            {t(`${COPY_KEY}.description`)}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              {t(`${COPY_KEY}.cancel`)}
            </Button>
            <Button onClick={handleGoToSettings}>
              {t(`${COPY_KEY}.confirm`)}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
