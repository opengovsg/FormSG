import { useCallback, useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import { Spacer, Stack, StackDivider } from '@chakra-ui/react'

import { FormPermission } from '~shared/types/form/form'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton, { IconButtonProps } from '~components/IconButton'

import { useMutateCollaborators } from '../../../mutations'
import { useAdminFormCollaborators } from '../../../queries'
import { useCollaboratorWizard } from '../CollaboratorWizardContext'
import { DropdownRole } from '../constants'
import { permissionsToRole, roleToPermission } from '../utils'

import { CollaboratorRow } from './CollaboratorRow'
import { PermissionDropdown } from './PermissionDropdown'
import { ViewOnlyPermission } from './ViewOnlyPermission'

type CollaboratorRowMeta = {
  email: string
  role: DropdownRole
}

const RemoveCollaboratorButton = (
  props: Pick<IconButtonProps, 'isDisabled' | 'isLoading' | 'onClick'>,
) => {
  return (
    <IconButton
      icon={<BiTrash />}
      variant="clear"
      colorScheme="danger"
      aria-label="Remove collaborator"
      {...props}
    />
  )
}

export const CollaboratorList = (): JSX.Element => {
  const isMobile = useIsMobile()
  // Admin form data required for checking for duplicate emails.
  const {
    handleForwardToTransferOwnership,
    handleForwardToRemoveSelf,
    formId,
  } = useCollaboratorWizard()
  const { collaborators, user, isFormAdmin, form, isLoading, hasEditAccess } =
    useAdminFormCollaborators(formId)

  const { mutateUpdateCollaborator, mutateRemoveCollaborator } =
    useMutateCollaborators()

  const areMutationsLoading = useMemo(
    () =>
      mutateRemoveCollaborator.isLoading || mutateUpdateCollaborator.isLoading,
    [mutateRemoveCollaborator.isLoading, mutateUpdateCollaborator.isLoading],
  )

  const list: CollaboratorRowMeta[] = useMemo(() => {
    return (
      collaborators?.map((c) => ({
        email: c.email,
        role: permissionsToRole(c),
      })) ?? []
    )
  }, [collaborators])

  const handleUpdateRole = useCallback(
    (row: (typeof list)[number]) => (newRole: DropdownRole) => {
      // Should not happen since this function cannot be invoked without the
      // collaborators being loaded, but guarding just in case.
      // Or when role to update is already the current role.
      if (!collaborators || areMutationsLoading || row.role === newRole) return

      if (newRole === DropdownRole.Owner) {
        return handleForwardToTransferOwnership(row.email)
      }

      const permissionToUpdate: FormPermission = {
        email: row.email,
        ...roleToPermission(newRole),
      }
      return mutateUpdateCollaborator.mutate({
        permissionToUpdate,
        currentPermissions: collaborators,
      })
    },
    [
      areMutationsLoading,
      collaborators,
      handleForwardToTransferOwnership,
      mutateUpdateCollaborator,
    ],
  )

  const handleRemoveCollaborator = useCallback(
    (row: (typeof list)[number]) => () => {
      if (!collaborators || areMutationsLoading) return

      if (row.email === user?.email) {
        return handleForwardToRemoveSelf()
      }

      // May seem redundant since we already have the email, but this may prevent
      // issues arising from desync between `list` and `collaborators`.
      const permissionToRemove: FormPermission = {
        email: row.email,
        ...roleToPermission(row.role),
      }
      return mutateRemoveCollaborator.mutate({
        permissionToRemove,
        currentPermissions: collaborators,
      })
    },
    [
      areMutationsLoading,
      collaborators,
      handleForwardToRemoveSelf,
      mutateRemoveCollaborator,
      user?.email,
    ],
  )

  return (
    <Stack
      spacing={0}
      align="flex-start"
      flex={1}
      divider={isMobile ? undefined : <StackDivider />}
      borderY={{ md: '1px solid var(--chakra-colors-neutral-300)' }}
    >
      <CollaboratorRow
        email={form?.admin.email}
        isCurrentUser={isFormAdmin}
        isLoading={isLoading}
      >
        <ViewOnlyPermission
          role={DropdownRole.Owner}
          textAlign={{ md: !collaborators?.length ? 'end' : undefined }}
        >
          {collaborators?.length ? <Spacer w="2.75rem" /> : null}
        </ViewOnlyPermission>
      </CollaboratorRow>
      {list.map((row) => {
        const isCurrentUser = row.email === user?.email
        return (
          <CollaboratorRow
            email={row.email}
            isCurrentUser={isCurrentUser}
            key={row.email}
            isLoading={isLoading}
          >
            {hasEditAccess ? (
              <Stack
                w="100%"
                direction="row"
                justify="space-between"
                flex={0}
                align="center"
              >
                <PermissionDropdown
                  buttonVariant="clear"
                  value={row.role}
                  allowTransferOwnership={isFormAdmin}
                  isLoading={areMutationsLoading}
                  onChange={handleUpdateRole(row)}
                />
                <RemoveCollaboratorButton
                  isLoading={
                    areMutationsLoading &&
                    mutateRemoveCollaborator.variables?.permissionToRemove
                      .email === row.email
                  }
                  isDisabled={areMutationsLoading}
                  onClick={handleRemoveCollaborator(row)}
                />
              </Stack>
            ) : (
              <ViewOnlyPermission role={row.role}>
                {isCurrentUser ? (
                  <RemoveCollaboratorButton
                    isDisabled={areMutationsLoading}
                    onClick={handleForwardToRemoveSelf}
                  />
                ) : (
                  <Spacer w="2.75rem" />
                )}
              </ViewOnlyPermission>
            )}
          </CollaboratorRow>
        )
      })}
    </Stack>
  )
}
