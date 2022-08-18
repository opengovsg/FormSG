import {
  ContextType,
  memo,
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
} from '@chakra-ui/react'
import type { History } from 'history'

import Button from '~components/Button'

interface Navigator extends BaseNavigator {
  block: History['block']
}

type NavigationContextWithBlock =
  | ContextType<typeof NavigationContext> & {
      navigator: Navigator
    }

interface NavigationPromptProps {
  title: string
  when: boolean
}
export const NavigationPrompt = memo(
  ({ when, title }: NavigationPromptProps) => {
    const navigationContext = useContext(
      NavigationContext,
    ) as NavigationContextWithBlock

    console.log('rendering why')

    const [showPrompt, setShowPrompt] = useState(false)
    const [currentPath, setCurrentPath] = useState('')

    const unblockRef = useRef<() => void>()

    function handleShowModal() {
      setShowPrompt(true)
    }

    function onCancel() {
      setShowPrompt(false)
    }

    useEffect(() => {
      unblockRef.current = navigationContext.navigator.block(({ location }) => {
        if (when) {
          setCurrentPath(location.pathname)
          handleShowModal()
          return false
        }
        return true
      })
      return () => {
        unblockRef.current && unblockRef.current()
      }
    }, [navigationContext.navigator, when])

    function handleConfirm() {
      if (unblockRef.current) {
        unblockRef.current()
      }
      setShowPrompt(false)
      navigationContext?.navigator.push(currentPath)
    }

    return (
      <Modal isOpen={showPrompt} onClose={onCancel}>
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>
          <ModalBody>
            There are unsaved changes. Are you sure want to leave this page?
          </ModalBody>
          <ModalFooter>
            <Button onClick={onCancel}>Stay on page</Button>
            <Button onClick={handleConfirm} autoFocus>
              Leave
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  },
)
