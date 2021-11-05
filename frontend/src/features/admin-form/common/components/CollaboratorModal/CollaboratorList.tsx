/* eslint-disable @typescript-eslint/no-unused-vars */
import { Fragment, useMemo } from 'react'
import { BiTrash } from 'react-icons/bi'
import { Divider, Flex, Grid, Spacer, Stack, Text } from '@chakra-ui/react'

import { FormPermission } from '~shared/types/form/form'

import IconButton from '~components/IconButton'

import { useAdminForm, useAdminFormCollaborators } from '../../queries'

import { DropdownRole } from './AddCollaboratorInput'
import { PermissionDropdown } from './PermissionDropdown'
import { permissionsToRole } from './utils'

export const CollaboratorList = (): JSX.Element => {
  // Admin form data required for checking for duplicate emails.
  const { data: form } = useAdminForm()
  const { isLoading, data: collaborators } = useAdminFormCollaborators({
    enabled: !!form,
  })

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
      <>
        <Text
          textStyle="body-2"
          color="secondary.900"
          alignSelf="center"
          isTruncated
        >
          {form?.admin.email}
        </Text>
        <Text textStyle="body-2" color="secondary.300" px="1rem" py="0.5rem">
          Owner
        </Text>
        {/* Spacer required for 3 column grid layout */}
        <Spacer />
        <Divider gridColumn="1 / -1" />
      </>
    )
  }, [form?.admin.email])

  return (
    <Grid templateColumns="1fr auto auto" maxH="12.5rem" overflowY="auto">
      {ownerRow}
      {list.map((row) => (
        <Fragment key={row.email}>
          <Text
            textStyle="body-2"
            color="secondary.900"
            alignSelf="center"
            isTruncated
          >
            {row.email}
          </Text>
          <PermissionDropdown
            buttonVariant="clear"
            value={row.role}
            isLoading={false}
            onChange={(e) => console.log(e)}
          />
          <IconButton
            icon={<BiTrash />}
            variant="clear"
            aria-label="Remove collaborator"
            colorScheme="danger"
          />
          <Divider gridColumn="1 / -1" />
        </Fragment>
      ))}
    </Grid>
  )
}
