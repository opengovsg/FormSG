import { useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import { Skeleton, Spacer, Stack, StackDivider, Text } from '@chakra-ui/react'

import { FormPermission } from '~shared/types/form/form'

import IconButton from '~components/IconButton'

import { useMutateCollaborators } from '../../mutations'
import { useAdminForm, useAdminFormCollaborators } from '../../queries'

import { DropdownRole } from './AddCollaboratorInput'
import { PermissionDropdown } from './PermissionDropdown'
import { permissionsToRole, roleToPermission } from './utils'

export const CollaboratorList = (): JSX.Element => {
  // Admin form data required for checking for duplicate emails.
  const { data: form } = useAdminForm()
  const { data: collaborators } = useAdminFormCollaborators({
    enabled: !!form,
  })

  const { mutateUpdateCollaborator, mutateRemoveCollaborator } =
    useMutateCollaborators()

  const list = useMemo(() => {
    return (
      collaborators?.map((c) => ({
        email: c.email,
        role: permissionsToRole(c),
      })) ?? []
    )
  }, [collaborators])

  const ownerRow = useMemo(() => {
    return (
      <Stack
        direction="row"
        justify="space-between"
        align="center"
        minH="3.5rem"
      >
        <Skeleton isLoaded={!!collaborators} alignSelf="center" py="0.5rem">
          <Text textStyle="body-2" color="secondary.900" isTruncated>
            {form?.admin.email}
          </Text>
        </Skeleton>
        <Skeleton isLoaded={!!collaborators}>
          <Text textStyle="body-2" color="secondary.300" p="0.25rem">
            Owner
          </Text>
          <Spacer />
        </Skeleton>
      </Stack>
    )
  }, [collaborators, form?.admin.email])

  const handleUpdateRole =
    (row: typeof list[number]) => (newRole: DropdownRole) => {
      // Should not happen since this function cannot be invoked without the
      // collaborators being loaded, but guarding just in case.
      // Or when role to update is already the current role.
      if (!collaborators || row.role === newRole) return
      const permissionToUpdate: FormPermission = {
        email: row.email,
        ...roleToPermission(newRole),
      }
      return mutateUpdateCollaborator.mutate({
        permissionToUpdate,
        currentPermissions: collaborators,
      })
    }

  const handleRemoveCollaborator = (row: typeof list[number]) => () => {
    if (!collaborators) return
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
  }

  return (
    <Stack spacing={0} divider={<StackDivider />}>
      {ownerRow}
      {list.map((row) => (
        <Stack
          minH="3.5rem"
          direction="row"
          justify="space-between"
          align="center"
          key={row.email}
        >
          <Text
            textStyle="body-2"
            color="secondary.900"
            alignSelf="center"
            isTruncated
          >
            {row.email}
          </Text>
          <Stack direction="row" align="center">
            <PermissionDropdown
              buttonVariant="clear"
              value={row.role}
              isLoading={
                mutateUpdateCollaborator.isLoading ||
                mutateRemoveCollaborator.isLoading
              }
              onChange={handleUpdateRole(row)}
            />
            <IconButton
              icon={<BiTrash />}
              isLoading={
                mutateRemoveCollaborator.isLoading &&
                mutateRemoveCollaborator.variables?.permissionToRemove.email ===
                  row.email
              }
              isDisabled={
                mutateUpdateCollaborator.isLoading ||
                mutateRemoveCollaborator.isLoading
              }
              variant="clear"
              aria-label="Remove collaborator"
              colorScheme="danger"
              onClick={handleRemoveCollaborator(row)}
            />
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
