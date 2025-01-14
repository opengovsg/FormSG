import { useMemo } from 'react'
import { Text } from '@chakra-ui/react'

import Menu from '~components/Menu'

import { DropdownRole } from '../constants'

export interface PermissionDropdownProps {
  value: DropdownRole
  onChange: (role: DropdownRole) => void
  isLoading: boolean
  allowTransferOwnership: boolean
  buttonVariant?: 'outline' | 'clear'
}

export const PermissionDropdown = ({
  value,
  onChange,
  isLoading,
  allowTransferOwnership,
  buttonVariant = 'outline',
}: PermissionDropdownProps): JSX.Element => {
  const availableRoles = useMemo(() => {
    return Object.values(DropdownRole).filter((role) => {
      // Either not owner role, or owner role and allowTransferOwnership is true.
      return role !== DropdownRole.Owner || allowTransferOwnership
    })
  }, [allowTransferOwnership])

  return (
    <Menu matchWidth>
      {({ isOpen }) => (
        <>
          <Menu.Button
            minW="7rem"
            isDisabled={isLoading}
            variant={buttonVariant}
            colorScheme="secondary"
            isActive={isOpen}
            iconSpacing="1.5rem"
          >
            {value}
          </Menu.Button>
          <Menu.List defaultValue={value}>
            {availableRoles.map((role) => (
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
