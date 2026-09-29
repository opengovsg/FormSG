import { useTranslation } from 'react-i18next'
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

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

interface DeleteViewModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  isLoading?: boolean
  viewName: string
}

export const DeleteViewModal = ({
  isOpen,
  onClose,
  onDelete,
  isLoading,
  viewName,
}: DeleteViewModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { deleteViewTitle, deleteViewDescription } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.views',
    { returnObjects: true },
  )
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={!isLoading}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton isDisabled={isLoading} />
        <ModalHeader color="secondary.700">
          {deleteViewTitle.replace('{VIEW_NAME}', viewName)}
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Text textStyle="body-2" color="secondary.500">
            {deleteViewDescription}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button
              variant="clear"
              colorScheme="secondary"
              isDisabled={isLoading}
              onClick={onClose}
            >
              {t('features.common.cancel')}
            </Button>
            <Button
              colorScheme="danger"
              isLoading={isLoading}
              onClick={onDelete}
            >
              {t('features.common.delete')}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
