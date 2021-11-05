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
import { updateFormCollaborators } from './AdminViewFormService'
import { adminFormKeys } from './queries'

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

  const mutateAddCollaborator = useMutation(
    ({
      newPermission,
      currentPermissions,
    }: {
      newPermission: FormPermission
      currentPermissions: FormPermissionsDto
    }) => {
      const rebuiltPermissions = [newPermission].concat(currentPermissions)
      return updateFormCollaborators(formId, rebuiltPermissions)
    },
    {
      onSuccess: (newData, { newPermission }) => {
        toast.closeAll()
        updateFormData(newData)

        // Show toast on success.
        toast({
          description: `${
            newPermission.email
          } has been added as a ${permissionsToRole(newPermission)}`,
        })
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({
          description: error.message,
          status: 'danger',
        })
      },
    },
  )

  return {
    mutateAddCollaborator,
  }
}
