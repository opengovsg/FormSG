import { useNavigate } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'

import { FormId } from '~shared/types/form/form'

import { ADMINFORM_PREVIEW_ROUTE, ADMINFORM_ROUTE } from '~constants/routes'

import { useWorkspaceRowsContext } from '../WorkspaceRowsContext'

type UseRowActionDropdownReturn = {
  handleEditForm: () => void
  handlePreviewForm: () => void
  handleDuplicateForm: () => void
  handleManageFormAccess: () => void
  handleDeleteForm: () => void
  shareFormModalDisclosure: ReturnType<typeof useDisclosure>
}

export const useRowActionDropdown = (
  formId: FormId,
): UseRowActionDropdownReturn => {
  const navigate = useNavigate()

  const shareFormModalDisclosure = useDisclosure()
  const { onOpenDupeFormModal } = useWorkspaceRowsContext()

  return {
    shareFormModalDisclosure,
    handleEditForm: () => navigate(`${ADMINFORM_ROUTE}/${formId}`),
    handlePreviewForm: () =>
      window.open(
        `${window.location.origin}${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_PREVIEW_ROUTE}`,
      ),
    handleDuplicateForm: () => onOpenDupeFormModal(formId),
    handleManageFormAccess: () =>
      console.log(`manage form access button clicked for ${formId}`),
    handleDeleteForm: () =>
      console.log(`delete form  button clicked for ${formId}`),
  }
}
