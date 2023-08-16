import { BiDotsHorizontalRounded } from 'react-icons/bi'
import { MenuButton, useDisclosure } from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import { DeleteWorkspaceModal } from '../WorkspaceModals/DeleteWorkspaceModal'
import { RenameWorkspaceModal } from '../WorkspaceModals/RenameWorkspaceModal'

export const WorkspaceEditDropdown = (): JSX.Element => {
  const { activeWorkspace, setCurrentWorkspace } = useWorkspaceContext()
  const renameModal = useDisclosure()
  const deleteModal = useDisclosure()

  return (
    <>
      <RenameWorkspaceModal
        onClose={renameModal.onClose}
        isOpen={renameModal.isOpen}
        activeWorkspace={activeWorkspace}
      />
      <DeleteWorkspaceModal
        onClose={deleteModal.onClose}
        isOpen={deleteModal.isOpen}
        activeWorkspace={activeWorkspace}
        setCurrentWorkspace={setCurrentWorkspace}
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
              ml="0.25rem"
            />
            <Menu.List>
              <Menu.Item onClick={renameModal.onOpen}>Rename folder</Menu.Item>
              <Menu.Item onClick={deleteModal.onOpen}>Delete folder</Menu.Item>
            </Menu.List>
          </>
        )}
      </Menu>
    </>
  )
}
