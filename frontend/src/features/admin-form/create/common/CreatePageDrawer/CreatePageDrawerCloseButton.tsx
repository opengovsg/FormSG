import { useCallback } from 'react'
import { useIsMutating } from 'react-query'
import { BiX } from 'react-icons/bi'
import { CloseButton } from '@chakra-ui/react'

import {
  isDirtySelector,
  useDirtyFieldStore,
} from '../../builder-and-design/useDirtyFieldStore'
import {
  isDirtySelector as isWorkflowDirtySelector,
  useDirtyWorkflowStore,
} from '../../workflow/useDirtyWorkflowStore'
import { useCreatePageSidebar } from '../CreatePageSidebarContext'
import { adminFormKeys } from '~features/admin-form/common/queries'

export const CreatePageDrawerCloseButton = (): JSX.Element => {
  const isDirty = useDirtyFieldStore(isDirtySelector)
  const isWorkflowDirty = useDirtyWorkflowStore(isWorkflowDirtySelector)
  const { handleClose } = useCreatePageSidebar()
  const isMutating = useIsMutating({ mutationKey: adminFormKeys.base }) // ADD THIS LINE

  const handleCloseDrawer = useCallback(() => {
    handleClose(isDirty || isWorkflowDirty)
  }, [handleClose, isDirty, isWorkflowDirty])

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
      isDisabled={isMutating > 0} // ADD THIS LINE
    />
  )
}
