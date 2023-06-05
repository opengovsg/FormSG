import {
  ContextType,
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
import type { History } from 'history'

interface Navigator extends BaseNavigator {
  block: History['block']
}

type NavigationContextWithBlock =
  | ContextType<typeof NavigationContext> & {
      navigator: Navigator
    }

export const useNavigationPrompt = (when?: boolean) => {
  const navigationContext = useContext(
    NavigationContext,
  ) as NavigationContextWithBlock

  const [isPromptShown, setIsPromptShown] = useState(false)
  const [targetPath, setTargetPath] = useState<string>()

  const unblockRef = useRef<() => void>()

  const handleShowModal = useCallback(() => {
    setIsPromptShown(true)
  }, [])

  const onCancel = useCallback(() => {
    setIsPromptShown(false)
  }, [])

  useEffect(() => {
    if (!when) return
    unblockRef.current = navigationContext.navigator.block((transaction) => {
      setTargetPath(transaction.location.pathname)
      handleShowModal()
      return false
    })
    return () => {
      unblockRef.current && unblockRef.current()
    }
  }, [handleShowModal, navigationContext.navigator, when])

  const handleConfirm = useCallback(() => {
    if (unblockRef.current) {
      unblockRef.current()
    }
    setIsPromptShown(false)
    if (targetPath !== undefined) {
      navigationContext?.navigator.push(targetPath)
    }
  }, [targetPath, navigationContext?.navigator])

  return {
    isPromptShown,
    onCancel,
    onConfirm: handleConfirm,
  }
}
