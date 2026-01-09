import { useCallback, useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'

export const useNavigationPrompt = (when?: boolean) => {
  const [isPromptShown, setIsPromptShown] = useState(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when === true && currentLocation.pathname !== nextLocation.pathname,
  )

  const handleShowModal = useCallback(() => {
    setIsPromptShown(true)
  }, [])

  const onCancel = useCallback(() => {
    setIsPromptShown(false)
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  useEffect(() => {
    if (blocker.state === 'blocked') {
      handleShowModal()
    }
  }, [blocker.state, handleShowModal])

  const handleConfirm = useCallback(() => {
    setIsPromptShown(false)
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }, [blocker])

  return {
    isPromptShown,
    onCancel,
    onConfirm: handleConfirm,
  }
}
