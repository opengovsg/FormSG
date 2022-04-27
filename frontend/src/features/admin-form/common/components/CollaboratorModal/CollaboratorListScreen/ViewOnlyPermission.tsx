import { Stack, Text } from '@chakra-ui/react'

import { DropdownRole } from '../constants'

export interface ViewOnlyPermissionProps {
  role: DropdownRole
  children: React.ReactNode
}

/** View only permission display counterpart of PermissionDropdown component */
export const ViewOnlyPermission = ({
  role,
  children,
}: ViewOnlyPermissionProps): JSX.Element => {
  return (
    <Stack direction="row" justify="space-between" flex={0} align="center">
      <Text
        // Same width as permissions dropdown menu button for alignment
        minW="6.25rem"
        textAlign="start"
        textStyle="body-2"
        color="secondary.500"
      >
        {role}
      </Text>
      {children}
    </Stack>
  )
}
