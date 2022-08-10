import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'

import { ADMINFORM_PREVIEW_ROUTE, ADMINFORM_ROUTE } from '~constants/routes'

import { useUser } from '~features/user/queries'

import { useWorkspaceRowsContext } from '../WorkspaceRowsContext'

type UseRowActionDropdownReturn = {
  handleEditForm: () => void
  handlePreviewForm: () => void
  handleDuplicateForm: () => void
  handleManageFormAccess: () => void
  handleDeleteForm: () => void
  handleShareForm: () => void
  isFormAdmin: boolean
}

export const useRowActionDropdown = (
  formMeta: AdminDashboardFormMetaDto,
): UseRowActionDropdownReturn => {
  const navigate = useNavigate()
  const { user } = useUser()

  const { onOpenDupeFormModal, onOpenShareFormModal, onOpenDeleteFormModal } =
    useWorkspaceRowsContext()

  const isFormAdmin = useMemo(
    () => !!user && !!formMeta && user.email === formMeta.admin.email,
    [formMeta, user],
  )

  const handleShareForm = useCallback(
    () => onOpenShareFormModal(formMeta),
    [formMeta, onOpenShareFormModal],
  )

  const handleEditForm = useCallback(
    () => navigate(`${ADMINFORM_ROUTE}/${formMeta._id}`),
    [formMeta, navigate],
  )

  const handlePreviewForm = useCallback(() => {
    return window.open(
      `${window.location.origin}${ADMINFORM_ROUTE}/${formMeta._id}/${ADMINFORM_PREVIEW_ROUTE}`,
    )
  }, [formMeta])

  const handleDuplicateForm = useCallback(
    () => onOpenDupeFormModal(formMeta),
    [formMeta, onOpenDupeFormModal],
  )

  const handleManageFormAccess = useCallback(
    () => console.log(`manage form access button clicked for ${formMeta._id}`),
    [formMeta],
  )

  const handleDeleteForm = useCallback(() => {
    if (!isFormAdmin) return
    return onOpenDeleteFormModal(formMeta)
  }, [formMeta, isFormAdmin, onOpenDeleteFormModal])

  return {
    handleShareForm,
    handleEditForm,
    handlePreviewForm,
    handleDuplicateForm,
    handleManageFormAccess,
    handleDeleteForm,
    isFormAdmin,
  }
}
