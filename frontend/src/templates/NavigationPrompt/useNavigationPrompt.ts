import { useCallback, useEffect, useState } from 'react'
import { BlockerFunction, useBlocker } from 'react-router-dom'

export const useNavigationPrompt = (when?: boolean) => {
  const [isPromptShown, setIsPromptShown] = useState(false)

  const shouldBlock = useCallback<BlockerFunction>(() => {
    return when ?? false
  }, [when])

  const blocker = useBlocker(shouldBlock)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setIsPromptShown(true)
    } else if (blocker.state === 'proceeding') {
      setIsPromptShown(false)
    }
  }, [blocker.state])

  const onCancel = useCallback(() => {
    setIsPromptShown(false)
    blocker.reset && blocker.reset()
  }, [blocker])

  const handleConfirm = useCallback(() => {
    blocker.proceed && blocker.proceed()
    setIsPromptShown(false)
  }, [blocker])

  return {
    isPromptShown,
    onCancel,
    onConfirm: handleConfirm,
  }
}
