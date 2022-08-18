import { memo } from 'react'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useNavigationPrompt } from './useNavigationPrompt'

interface NavigationPromptProps {
  /** Whether modal should appear. */
  when: boolean
  /** Modal header title. Defaults to `"Discard changes?"` */
  title?: string
  /**
   * Modal body content.
   * Defaults to `"You have unsaved changes that will be lost. Are you sure you want to discard them?"`
   */
  description?: string
  /** Text to display for the confirmation button. Defaults to `"Yes, discard changes"` */
  confirmButtonText?: string
  /** Text to display for the cancel button. Defaults to `"No, stay on page"` */
  cancelButtonText?: string
}
export const NavigationPrompt = memo(
  ({
    when,
    title = 'Discard changes?',
    description = 'You have unsaved changes that will be lost. Are you sure you want to discard them?',
    confirmButtonText = 'Yes, discard changes',
    cancelButtonText = 'No, stay on page',
  }: NavigationPromptProps) => {
    const { isPromptShown, onCancel, onConfirm } = useNavigationPrompt(when)
    const isMobile = useIsMobile()

    return (
      <Modal isOpen={isPromptShown} onClose={onCancel}>
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
  },
)
