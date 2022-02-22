import { useCallback } from 'react'
import { BiX } from 'react-icons/bi'
import { CloseButton } from '@chakra-ui/react'

import { useCreatePageDrawer } from '~features/admin-form-builder/CreatePageDrawerContext'

export const CreatePageDrawerCloseButton = (): JSX.Element => {
  const { handleClose } = useCreatePageDrawer()

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
