import { Box, Text } from '@chakra-ui/react'

import Menu from '~components/Menu'

import { DropdownRole } from './AddCollaboratorInput'

export interface PermissionDropdownProps {
  value: DropdownRole
  onChange: (role: DropdownRole) => void
  isLoading: boolean
}

export const PermissionDropdown = ({
  value,
  onChange,
  isLoading,
}: PermissionDropdownProps): JSX.Element => {
  return (
    <Menu>
      {({ isOpen }) => (
        <>
          <Box>
            <Menu.Button
              isDisabled={isLoading}
              w="100%"
              minW="8rem"
              variant="outline"
              colorScheme="secondary"
              isActive={isOpen}
            >
              {value}
            </Menu.Button>
          </Box>
          <Menu.List defaultValue={value}>
            {Object.values(DropdownRole).map((role) => (
              <Menu.Item key={role} onClick={() => onChange(role)}>
                <Text
                  // Styling to hint to user the current active choice
                  fontWeight={role === value ? 500 : 400}
                >
                  {role}
                </Text>
              </Menu.Item>
            ))}
          </Menu.List>
        </>
      )}
    </Menu>
  )
}
