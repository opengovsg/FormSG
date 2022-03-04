import { useCallback } from 'react'
import { BiX } from 'react-icons/bi'
import { CloseButton } from '@chakra-ui/react'

import { useCreatePageSidebar } from '../../common/CreatePageSidebarContext'

export const CreatePageDrawerCloseButton = (): JSX.Element => {
  const { handleClose } = useCreatePageSidebar()

  const handleCloseDrawer = useCallback(() => {
    handleClose()
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
