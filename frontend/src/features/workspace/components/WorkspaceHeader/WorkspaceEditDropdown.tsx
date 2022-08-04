import { BiDotsHorizontalRounded } from 'react-icons/bi'
import { MenuButton, useDisclosure } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import { DeleteWorkspaceModal } from '../WorkspaceModals/DeleteWorkspaceModal'
import { RenameWorkspaceModal } from '../WorkspaceModals/RenameWorkspaceModal'

export const WorkspaceEditDropdown = (): JSX.Element => {
  const renameModal = useDisclosure()
  const deleteModal = useDisclosure()

  return (
    <>
      <RenameWorkspaceModal
        onClose={renameModal.onClose}
        isOpen={renameModal.isOpen}
      />
      <DeleteWorkspaceModal
        onClose={deleteModal.onClose}
        isOpen={deleteModal.isOpen}
      />

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
              <Menu.Item onClick={renameModal.onOpen}>
                Rename workspace
              </Menu.Item>
              <Menu.Item onClick={deleteModal.onOpen}>
                Delete workspace
              </Menu.Item>
            </Menu.List>
          </>
        )}
      </Menu>
    </>
  )
}
