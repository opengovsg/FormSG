import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Stack,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'

export interface UnsavedChangesModalProps extends Omit<ModalProps, 'children'> {
  onConfirm: () => void
  onCancel: () => void
  /** Modal header title. Defaults to `"You have unsaved changes"` */
  title?: string
  /**
   * Modal body content.
   * Defaults to `"Are you sure you want to leave? Your changes will be lost."`
   */
  description?: string
  /** Text to display for the confirmation button. Defaults to `"Yes, discard changes"` */
  confirmButtonText?: string
  /** Text to display for the cancel button. Defaults to `"No, stay on page"` */
  cancelButtonText?: string
}

export const UnsavedChangesModal = ({
  onConfirm,
  onCancel,
  isOpen,
  onClose,
  returnFocusOnClose = false,
  title = 'You have unsaved changes',
  description = 'Are you sure you want to leave? Your changes will be lost.',
  confirmButtonText = 'Yes, discard changes',
  cancelButtonText = 'No, stay on page',
  ...modalProps
}: UnsavedChangesModalProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      returnFocusOnClose={returnFocusOnClose}
      {...modalProps}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700" pr="4rem">
          {title}
        </ModalHeader>
        <ModalBody color="secondary.500" textStyle="body-2">
          {description}
        </ModalBody>
        <ModalFooter>
          <Stack
            spacing="1rem"
            w="100%"
            direction={{ base: 'column', md: 'row-reverse' }}
          >
            <Button
              isFullWidth={isMobile}
              colorScheme="danger"
              onClick={onConfirm}
              autoFocus
            >
              {confirmButtonText}
            </Button>
            <Button
              colorScheme="secondary"
              variant="clear"
              isFullWidth={isMobile}
              onClick={onCancel}
            >
              {cancelButtonText}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
