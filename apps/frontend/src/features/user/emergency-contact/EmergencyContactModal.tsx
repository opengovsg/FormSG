import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { ContactNumberInput } from './components/ContactNumberInput'

interface EmergencyContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export const EmergencyContactModal = ({
  isOpen,
  onClose,
}: EmergencyContactModalProps): JSX.Element => {
  const { t } = useTranslation()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">
          {t('features.user.emergencyContact.modal.header')}
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap" pb="3.25rem">
          <Text textStyle="body-2" color="secondary.500">
            {t('features.user.emergencyContact.modal.description')}
          </Text>
          <ContactNumberInput />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
