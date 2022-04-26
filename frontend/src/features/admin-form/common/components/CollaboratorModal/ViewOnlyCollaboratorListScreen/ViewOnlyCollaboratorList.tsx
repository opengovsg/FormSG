import {
  Skeleton,
  Stack,
  StackDivider,
  StackProps,
  Text,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'

import { useAdminFormCollaborators } from '~features/admin-form/common/queries'

import { DropdownRole } from '../constants'
import { permissionsToRole } from '../utils'

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

interface ViewOnlyCollaboratorRowProps extends StackProps {
  role: DropdownRole
  email: string | undefined
  isCurrentUser: boolean
  isLoading?: boolean
}

const ViewOnlyCollaboratorRow = ({
  role,
  isCurrentUser,
  email,
  isLoading,
  ...stackProps
}: ViewOnlyCollaboratorRowProps) => {
  return (
    <Stack
      p={{ base: '1.5rem', md: 0 }}
      w="100%"
      minH="3.5rem"
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'flex-start', md: 'center' }}
      spacing={{ base: '0.75rem', md: '2rem' }}
      bg={{ base: 'primary.100', md: 'white' }}
      {...stackProps}
    >
      <Skeleton
        isLoaded={!isLoading}
        flex={1}
        w="100%"
        // Required to allow flex to shrink
        minW={0}
      >
        <Stack direction="row" align="baseline">
          <CollaboratorText>{email}</CollaboratorText>
          {isCurrentUser ? (
            <Text as="span" textStyle="caption-1" color="neutral.600">
              (You)
            </Text>
          ) : null}
        </Stack>
      </Skeleton>
      <Skeleton isLoaded={!isLoading} textAlign="end">
        <Text textStyle="body-2" color="secondary.500">
          {role}
        </Text>
      </Skeleton>
    </Stack>
  )
}

export const ViewOnlyCollaboratorList = () => {
  const { collaborators, isLoading, form, isFormAdmin, user } =
    useAdminFormCollaborators()

  const isMobile = useIsMobile()

  return (
    <Stack
      borderY={{ md: '1px solid var(--chakra-colors-neutral-300)' }}
      spacing={0}
      align="flex-start"
      flex={1}
      divider={isMobile ? undefined : <StackDivider />}
    >
      <ViewOnlyCollaboratorRow
        email={form?.admin.email}
        role={DropdownRole.Owner}
        isLoading={isLoading}
        isCurrentUser={isFormAdmin}
      />
      {collaborators?.map((c, i) => (
        <ViewOnlyCollaboratorRow
          key={c.email}
          email={c.email}
          role={permissionsToRole(c)}
          isCurrentUser={c.email === user?.email}
          bg={{ base: i % 2 ? 'primary.100' : 'white', md: 'white' }}
        />
      ))}
    </Stack>
  )
}
