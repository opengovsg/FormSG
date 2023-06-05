import { useCallback, useMemo } from 'react'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'

import { ADMINFORM_PREVIEW_ROUTE, ADMINFORM_ROUTE } from '~constants/routes'

import { useUser } from '~features/user/queries'

import { useWorkspaceRowsContext } from '../WorkspaceRowsContext'

type UseRowActionReturn = {
  adminFormLink: string
  previewFormLink: string
  handleDuplicateForm: () => void
  handleCollaborators: () => void
  handleDeleteForm: () => void
  handleShareForm: () => void
  isFormAdmin: boolean
}

export const useRowAction = (
  formMeta: AdminDashboardFormMetaDto,
): UseRowActionReturn => {
  const { user } = useUser()

  const {
    onOpenDupeFormModal,
    onOpenShareFormModal,
    onOpenCollabModal,
    onOpenDeleteFormModal,
  } = useWorkspaceRowsContext()

  const isFormAdmin = useMemo(
    () => !!user && !!formMeta && user.email === formMeta.admin.email,
    [formMeta, user],
  )

  const adminFormLink = useMemo(
    () => `${ADMINFORM_ROUTE}/${formMeta._id}`,
    [formMeta],
  )

  const previewFormLink = useMemo(
    () => `${ADMINFORM_ROUTE}/${formMeta._id}/${ADMINFORM_PREVIEW_ROUTE}`,
    [formMeta],
  )

  const handleShareForm = useCallback(
    () => onOpenShareFormModal(formMeta),
    [formMeta, onOpenShareFormModal],
  )

  const handleDuplicateForm = useCallback(
    () => onOpenDupeFormModal(formMeta),
    [formMeta, onOpenDupeFormModal],
  )

  const handleCollaborators = useCallback(
    () => onOpenCollabModal(formMeta),
    [formMeta, onOpenCollabModal],
  )

  const handleDeleteForm = useCallback(() => {
    if (!isFormAdmin) return
    return onOpenDeleteFormModal(formMeta)
  }, [formMeta, isFormAdmin, onOpenDeleteFormModal])

  return {
    adminFormLink,
    previewFormLink,
    handleShareForm,
    handleDuplicateForm,
    handleCollaborators,
    handleDeleteForm,
    isFormAdmin,
  }
}
