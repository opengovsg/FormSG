import { useTranslation } from 'react-i18next'
import { Stack, StackProps, Text } from '@chakra-ui/react'

import { DropdownRole } from '../constants'

export interface ViewOnlyPermissionProps extends StackProps {
  role: DropdownRole
}

/** View only permission display counterpart of PermissionDropdown component */
export const ViewOnlyPermission = ({
  role,
  children,
  ...stackProps
}: ViewOnlyPermissionProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.collaborator.roles',
  })

  const getRoleLabel = (role: DropdownRole): string => {
    switch (role) {
      case DropdownRole.Owner:
        return t('owner')
      case DropdownRole.Editor:
        return t('editor')
      case DropdownRole.Viewer:
        return t('viewer')
    }
  }

  return (
    <Stack
      direction="row"
      justify="space-between"
      flex={0}
      align="center"
      {...stackProps}
    >
      <Text
        // Same width as permissions dropdown menu button for alignment
        minW="6.25rem"
        textStyle="body-2"
        color="secondary.500"
      >
        {getRoleLabel(role)}
      </Text>
      {children}
    </Stack>
  )
}
