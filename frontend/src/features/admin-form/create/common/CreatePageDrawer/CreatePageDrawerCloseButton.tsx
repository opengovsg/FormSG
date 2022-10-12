import { useCallback } from 'react'
import { BiX } from 'react-icons/bi'
import { CloseButton } from '@chakra-ui/react'

import {
  isDirtySelector,
  useDirtyFieldStore,
} from '../../builder-and-design/useDirtyFieldStore'
import { useCreatePageSidebar } from '../CreatePageSidebarContext'

export const CreatePageDrawerCloseButton = (): JSX.Element => {
  const isDirty = useDirtyFieldStore(isDirtySelector)
  const { handleClose } = useCreatePageSidebar()

  const handleCloseDrawer = useCallback(() => {
    handleClose(isDirty)
  }, [handleClose, isDirty])

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
