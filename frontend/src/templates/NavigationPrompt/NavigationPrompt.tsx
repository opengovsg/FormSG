import {
  ContextType,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Navigator as BaseNavigator,
  UNSAFE_NavigationContext as NavigationContext,
} from 'react-router-dom'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from '@chakra-ui/react'
import type { History } from 'history'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

interface Navigator extends BaseNavigator {
  block: History['block']
}

type NavigationContextWithBlock =
  | ContextType<typeof NavigationContext> & {
      navigator: Navigator
    }

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
    const navigationContext = useContext(
      NavigationContext,
    ) as NavigationContextWithBlock

    const [showPrompt, setShowPrompt] = useState(false)
    const [currentPath, setCurrentPath] = useState('')

    const isMobile = useIsMobile()

    const unblockRef = useRef<() => void>()

    const handleShowModal = useCallback(() => {
      setShowPrompt(true)
    }, [])

    const onCancel = useCallback(() => {
      setShowPrompt(false)
    }, [])

    useEffect(() => {
      unblockRef.current = navigationContext.navigator.block((transaction) => {
        if (when) {
          setCurrentPath(transaction.location.pathname)
          handleShowModal()
          return false
        }
        unblockRef.current?.()
        transaction.retry()
        return true
      })
      return () => {
        unblockRef.current && unblockRef.current()
      }
    }, [handleShowModal, navigationContext.navigator, when])

    const handleConfirm = useCallback(() => {
      if (unblockRef.current) {
        unblockRef.current()
      }
      setShowPrompt(false)
      navigationContext?.navigator.push(currentPath)
    }, [currentPath, navigationContext?.navigator])

    return (
      <Modal isOpen={showPrompt} onClose={onCancel}>
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
                onClick={handleConfirm}
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
