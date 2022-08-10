import { useNavigate } from 'react-router-dom'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'

import { ADMINFORM_PREVIEW_ROUTE, ADMINFORM_ROUTE } from '~constants/routes'

import { useWorkspaceRowsContext } from '../WorkspaceRowsContext'

type UseRowActionReturn = {
  handleEditForm: () => void
  handlePreviewForm: () => void
  handleDuplicateForm: () => void
  handleManageFormAccess: () => void
  handleDeleteForm: () => void
  handleShareForm: () => void
}

export const useRowAction = (
  formMeta: AdminDashboardFormMetaDto,
): UseRowActionReturn => {
  const navigate = useNavigate()

  const { onOpenDupeFormModal, onOpenShareFormModal } =
    useWorkspaceRowsContext()

  return {
    handleShareForm: () => onOpenShareFormModal(formMeta),
    handleEditForm: () => navigate(`${ADMINFORM_ROUTE}/${formMeta._id}`),
    handlePreviewForm: () =>
      window.open(
        `${window.location.origin}${ADMINFORM_ROUTE}/${formMeta._id}/${ADMINFORM_PREVIEW_ROUTE}`,
      ),
    handleDuplicateForm: () => onOpenDupeFormModal(formMeta),
    handleManageFormAccess: () =>
      console.log(`manage form access button clicked for ${formMeta._id}`),
    handleDeleteForm: () =>
      console.log(`delete form  button clicked for ${formMeta._id}`),
  }
}
