import { useCallback } from 'react'
import { BiX } from 'react-icons/bi'
import { CloseButton } from '@chakra-ui/react'

import { useBuilderDrawer } from '~features/admin-form-builder/BuilderDrawerContext'

export const BuilderDrawerCloseButton = (): JSX.Element => {
  const { handleClose } = useBuilderDrawer()

  const handleCloseDrawer = useCallback(() => {
    handleClose(/* clearActiveTab= */ true)
  }, [handleClose])

  return (
    <CloseButton
      zIndex={1}
      fontSize="1.5rem"
      w="1.5rem"
      h="1.5rem"
      variant="clear"
      colorScheme="neutral"
      children={<BiX />}
      onClick={handleCloseDrawer}
    />
  )
}
