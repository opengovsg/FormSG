import { Text } from '@chakra-ui/react'

import Menu from '~components/Menu'

import { DropdownRole } from './AddCollaboratorInput'

export interface PermissionDropdownProps {
  value: DropdownRole
  onChange: (role: DropdownRole) => void
  isLoading: boolean

  buttonVariant?: 'outline' | 'clear'
}

export const PermissionDropdown = ({
  value,
  onChange,
  isLoading,
  buttonVariant = 'outline',
}: PermissionDropdownProps): JSX.Element => {
  return (
    <Menu>
      {({ isOpen }) => (
        <>
          <Menu.Button
            isDisabled={isLoading}
            variant={buttonVariant}
            colorScheme="secondary"
            isActive={isOpen}
          >
            {value}
          </Menu.Button>
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
