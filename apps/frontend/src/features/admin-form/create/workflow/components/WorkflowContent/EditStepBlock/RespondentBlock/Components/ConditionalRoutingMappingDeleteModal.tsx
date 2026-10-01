import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

import { workflowNs } from '~/i18n/locales/features/admin-form/sidebar/workflow'

import { NextAndBackButtonGroup } from '~components/Button/NextAndBackButtonGroup'

interface ConditionalRoutingMappingDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  handleDelete: () => void
}

export const ConditionalRoutingMappingDeleteModal = ({
  isOpen,
  onClose,
  handleDelete,
}: ConditionalRoutingMappingDeleteModalProps) => {
  const { t } = useTranslation(workflowNs)
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          {t('conditionalRouting.modals.deleteMapping.title')}
        </ModalHeader>
        <ModalBody>
          {t('conditionalRouting.modals.deleteMapping.description')}
        </ModalBody>
        <ModalFooter>
          <NextAndBackButtonGroup
            nextButtonLabel={t(
              'conditionalRouting.modals.deleteMapping.confirm',
            )}
            backButtonLabel={t(
              'conditionalRouting.modals.deleteMapping.cancel',
            )}
            handleBack={onClose}
            handleNext={handleDelete}
            nextButtonColorScheme="danger"
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
