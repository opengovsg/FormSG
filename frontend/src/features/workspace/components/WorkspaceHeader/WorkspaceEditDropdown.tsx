import { BiDotsHorizontalRounded } from 'react-icons/bi'
import { MenuButton } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

export const WorkspaceEditDropdown = (): JSX.Element => {
  return (
    <Menu placement="bottom-start">
      {({ isOpen }) => (
        <>
          <MenuButton
            as={IconButton}
            _active={{ bg: 'secondary.100' }}
            isActive={isOpen}
            aria-label="Edit Workspace"
            icon={<BiDotsHorizontalRounded />}
            variant="clear"
            colorScheme="secondary"
          />
          <Menu.List>
            <Menu.Item onClick={() => console.log('Click')}>
              Rename workspace
            </Menu.Item>
            <Menu.Item onClick={() => console.log('Click')}>
              Delete workspace
            </Menu.Item>
          </Menu.List>
        </>
      )}
    </Menu>
  )
}
