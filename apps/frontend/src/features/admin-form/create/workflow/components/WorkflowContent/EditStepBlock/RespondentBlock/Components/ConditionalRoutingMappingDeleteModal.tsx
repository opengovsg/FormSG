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
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          {t(
            'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteMapping.title',
          )}
        </ModalHeader>
        <ModalBody>
          {t(
            'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteMapping.description',
          )}
        </ModalBody>
        <ModalFooter>
          <NextAndBackButtonGroup
            nextButtonLabel={t(
              'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteMapping.confirm',
            )}
            backButtonLabel={t(
              'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteMapping.cancel',
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
