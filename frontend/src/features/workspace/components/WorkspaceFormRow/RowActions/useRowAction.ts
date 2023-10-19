import { useCallback, useMemo } from 'react'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'
import { Workspace } from '~shared/types/workspace'

import { ADMINFORM_PREVIEW_ROUTE, ADMINFORM_ROUTE } from '~constants/routes'

import { useUser } from '~features/user/queries'
import { useWorkspaceMutations } from '~features/workspace/mutations'

import { useWorkspaceRowsContext } from '../WorkspaceRowsContext'

type UseRowActionReturn = {
  adminFormLink: string
  previewFormLink: string
  handleDuplicateForm: () => void
  handleCollaborators: () => void
  handleDeleteForm: () => void
  handleShareForm: () => void
  handleRemoveFormFromWorkspaces: () => void
  handleMoveForm: (destWorkspaceId: string, destWorkspaceTitle: string) => void
  isFormAdmin: boolean
}

export const useRowAction = (
  formMeta: AdminDashboardFormMetaDto,
): UseRowActionReturn => {
  const { user } = useUser()
  const { moveWorkspaceMutation, removeFormFromWorkspacesMutation } =
    useWorkspaceMutations()

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

  const handleMoveForm = useCallback(
    async (destWorkspaceId: string, destWorkspaceTitle: string) => {
      await moveWorkspaceMutation.mutateAsync({
        formIds: [formMeta._id.toString()],
        destWorkspaceId,
        destWorkspaceTitle,
      })
    },
    [formMeta, moveWorkspaceMutation],
  )

  const handleRemoveFormFromWorkspaces = useCallback(async () => {
    await removeFormFromWorkspacesMutation.mutateAsync({
      formId: formMeta._id.toString(),
    })
  }, [formMeta, removeFormFromWorkspacesMutation])

  return {
    adminFormLink,
    previewFormLink,
    handleShareForm,
    handleDuplicateForm,
    handleCollaborators,
    handleDeleteForm,
    handleWorkspaceClick,
    handleRemoveFormFromWorkspaces,
    handleMoveForm,
    isFormAdmin,
  }
}
