import { useCallback } from 'react'
import { BiX } from 'react-icons/bi'
import { CloseButton } from '@chakra-ui/react'

import { useBuilderDrawer } from '../BuilderDrawerContext'
import { clearActiveFieldSelector, useEditFieldStore } from '../editFieldStore'

export const BuilderDrawerCloseButton = (): JSX.Element => {
  const { handleClose } = useBuilderDrawer()
  const hasActiveField = useEditFieldStore(
    useCallback((state) => !!state.activeField, []),
  )
  const clearActiveField = useEditFieldStore(clearActiveFieldSelector)

  const handleDrawerClose = useCallback(() => {
    if (hasActiveField) {
      clearActiveField()
    }
    handleClose()
  }, [clearActiveField, handleClose, hasActiveField])

  return (
    <CloseButton
      zIndex={1}
      fontSize="1.5rem"
      w="1.5rem"
      h="1.5rem"
      variant="clear"
      colorScheme="neutral"
      children={<BiX />}
      onClick={handleDrawerClose}
    />
  )
}
