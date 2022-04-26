import { useCallback } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'

import {
  AdminFormDto,
  FormPermission,
  FormPermissionsDto,
} from '~shared/types/form/form'

import { useToast } from '~hooks/useToast'

import { permissionsToRole } from './components/CollaboratorModal/utils'
import {
  transferFormOwner,
  updateFormCollaborators,
} from './AdminViewFormService'
import { adminFormKeys } from './queries'

export type MutateAddCollaboratorArgs = {
  newPermission: FormPermission
  currentPermissions: FormPermissionsDto
}

export type MutateRemoveCollaboratorArgs = {
  permissionToRemove: FormPermission
  currentPermissions: FormPermissionsDto
}

export const useMutateCollaborators = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const queryClient = useQueryClient()
  const toast = useToast({ status: 'success', isClosable: true })

  const updateFormData = useCallback(
    (newData: FormPermissionsDto) => {
      queryClient.setQueryData(adminFormKeys.collaborators(formId), newData)
      // Only update adminForm if it already has prior data.
      queryClient.setQueryData<AdminFormDto | undefined>(
        adminFormKeys.id(formId),
        (oldData) =>
          oldData
            ? {
                ...oldData,
                permissionList: newData,
              }
            : undefined,
      )
    },
    [formId, queryClient],
  )

  const handleSuccess = useCallback(
    ({
      newData,
      toastDescription,
    }: {
      newData: FormPermissionsDto
      toastDescription: React.ReactNode
    }) => {
      toast.closeAll()
      updateFormData(newData)

      // Show toast on success.
      toast({
        description: toastDescription,
      })
    },
    [toast, updateFormData],
  )

  const handleError = useCallback(
    (error: Error) => {
      toast.closeAll()
      toast({
        description: error.message,
        status: 'danger',
      })
    },
    [toast],
  )

  const mutateUpdateCollaborator = useMutation(
    ({
      permissionToUpdate,
      currentPermissions,
    }: {
      permissionToUpdate: FormPermission
      currentPermissions: FormPermissionsDto
    }) => {
      const index = currentPermissions.findIndex(
        (c) => c.email === permissionToUpdate.email,
      )
      if (index === -1)
        throw new Error(
          'Collaborator to update does not seem to exist. Refresh and try again.',
        )
      const permissionListToUpdate = currentPermissions.slice()
      // Replace old permissions with new permission.
      permissionListToUpdate[index] = permissionToUpdate

      return updateFormCollaborators(formId, permissionListToUpdate)
    },
    {
      onSuccess: (newData, { permissionToUpdate }) => {
        const toastDescription = `${
          permissionToUpdate.email
        } has been updated to the ${permissionsToRole(permissionToUpdate)} role`
        handleSuccess({ newData, toastDescription })
      },
      onError: handleError,
    },
  )

  const mutateAddCollaborator = useMutation(
    ({ newPermission, currentPermissions }: MutateAddCollaboratorArgs) => {
      const rebuiltPermissions = [newPermission].concat(currentPermissions)
      return updateFormCollaborators(formId, rebuiltPermissions)
    },
    {
      onSuccess: (newData, { newPermission }) => {
        const toastDescription = `${
          newPermission.email
        } has been added as a ${permissionsToRole(newPermission)}`
        handleSuccess({ newData, toastDescription })
      },
      onError: handleError,
    },
  )

  const mutateRemoveCollaborator = useMutation(
    ({
      permissionToRemove,
      currentPermissions,
    }: MutateRemoveCollaboratorArgs) => {
      const filteredList = currentPermissions.filter(
        (c) => c.email !== permissionToRemove.email,
      )
      return updateFormCollaborators(formId, filteredList)
    },
    {
      onSuccess: (newData, { permissionToRemove }) => {
        // TODO: Decide if we want to allow redo (via readding permission)
        const toastDescription = `${permissionToRemove.email} has been removed as a collaborator`
        handleSuccess({ newData, toastDescription })
      },
      onError: handleError,
    },
  )

  const mutateTransferFormOwnership = useMutation(
    (newOwnerEmail: string) => transferFormOwner(formId, newOwnerEmail),
    {
      onSuccess: (newData) => {
        toast.closeAll()
        // Show toast on success.
        toast({
          description: `${newData.form.admin.email} is now the owner of this form`,
        })

        // Update cached data.
        queryClient.setQueryData(
          adminFormKeys.collaborators(formId),
          newData.form.permissionList,
        )
        queryClient.setQueryData<AdminFormDto | undefined>(
          adminFormKeys.id(formId),
          newData.form,
        )
      },
      onError: handleError,
    },
  )

  return {
    mutateAddCollaborator,
    mutateUpdateCollaborator,
    mutateRemoveCollaborator,
    mutateTransferFormOwnership,
  }
}
