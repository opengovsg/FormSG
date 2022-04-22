import { useCallback, useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import {
  Skeleton,
  Spacer,
  Stack,
  StackDivider,
  StackProps,
  Text,
} from '@chakra-ui/react'

import { FormPermission } from '~shared/types/form/form'

import IconButton from '~components/IconButton'

import { useUser } from '~features/user/queries'

import { useMutateCollaborators } from '../../mutations'
import { useAdminForm, useAdminFormCollaborators } from '../../queries'

import { DropdownRole } from './AddCollaboratorInput'
import { PermissionDropdown } from './PermissionDropdown'
import { permissionsToRole, roleToPermission } from './utils'

type CollaboratorRowMeta = {
  email: string
  role: DropdownRole
}

const CollaboratorText = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text
      textStyle={{ base: 'subhead-1', md: 'body-2' }}
      color={{ base: 'secondary.700', md: 'secondary.500' }}
      isTruncated
    >
      {children}
    </Text>
  )
}

const CollaboratorRow = ({
  children,
  ...props
}: { children: React.ReactNode } & StackProps) => {
  return (
    <Stack
      p={{ base: '1.5rem', md: 0 }}
      w="100%"
      minH="3.5rem"
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'flex-start', md: 'center' }}
      spacing={{ base: '0.75rem', md: '0.5rem' }}
      {...props}
    >
      {children}
    </Stack>
  )
}

export const CollaboratorList = (): JSX.Element => {
  // Admin form data required for checking for duplicate emails.
  const { data: form } = useAdminForm()
  const { user } = useUser()
  const { data: collaborators } = useAdminFormCollaborators({
    enabled: !!form,
  })

  const { mutateUpdateCollaborator, mutateRemoveCollaborator } =
    useMutateCollaborators()

  const createCurrentUserHint = useCallback(
    (row: Pick<CollaboratorRowMeta, 'email'>) => {
      return row.email === user?.email ? (
        <Text as="span" textStyle="caption-1" color="neutral.600">
          (You)
        </Text>
      ) : null
    },
    [user?.email],
  )

  const list: CollaboratorRowMeta[] = useMemo(() => {
    return (
      collaborators?.map((c) => ({
        email: c.email,
        role: permissionsToRole(c),
      })) ?? []
    )
  }, [collaborators])

  const ownerRow = useMemo(() => {
    return (
      <CollaboratorRow bg={{ base: 'primary.100', md: 'white' }}>
        <Skeleton isLoaded={!!collaborators} flex={1}>
          <Stack
            direction="row"
            align="baseline" // Required to allow flex to shrink
            minW={0}
          >
            <CollaboratorText>{form?.admin.email}</CollaboratorText>
            {createCurrentUserHint({ email: form?.admin.email ?? '' })}
          </Stack>
        </Skeleton>
        <Skeleton isLoaded={!!collaborators}>
          <Stack
            direction="row"
            justify="space-between"
            flex={0}
            align="center"
          >
            <Text minW="6.25rem" textStyle="body-2" color="secondary.500">
              Owner
            </Text>
            <Spacer w={collaborators?.length ? '2.75rem' : 0} />
          </Stack>
        </Skeleton>
      </CollaboratorRow>
    )
  }, [collaborators, form?.admin.email, createCurrentUserHint])

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
    <Stack spacing={0} align="flex-start" flex={1} divider={<StackDivider />}>
      {ownerRow}
      {list.map((row, index) => (
        <CollaboratorRow
          key={row.email}
          bg={{ base: index % 2 ? 'primary.100' : 'white', md: 'white' }}
        >
          <Stack direction="row" flex={1} align="center" w="100%">
            <CollaboratorText>{row.email}</CollaboratorText>
            {createCurrentUserHint(row)}
          </Stack>
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
        </CollaboratorRow>
      ))}
    </Stack>
  )
}
