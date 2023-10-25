import { useMemo } from 'react'
import { BiDotsHorizontalRounded } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  MenuButton,
  useDisclosure,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button, { ButtonProps } from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import { DeleteWorkspaceModal } from '../WorkspaceModals/DeleteWorkspaceModal'
import { RenameWorkspaceModal } from '../WorkspaceModals/RenameWorkspaceModal'

export const WorkspaceEditMenu = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { activeWorkspace, setCurrentWorkspace } = useWorkspaceContext()
  const renameModal = useDisclosure()
  const deleteModal = useDisclosure()

  return (
    <>
      {renameModal.isOpen && (
        <RenameWorkspaceModal
          onClose={renameModal.onClose}
          isOpen={renameModal.isOpen}
          activeWorkspace={activeWorkspace}
        />
      )}
      <DeleteWorkspaceModal
        onClose={deleteModal.onClose}
        isOpen={deleteModal.isOpen}
        activeWorkspace={activeWorkspace}
        setCurrentWorkspace={setCurrentWorkspace}
      />

      {isMobile ? (
        <WorkspaceEditDrawer
          renameModal={renameModal}
          deleteModal={deleteModal}
        />
      ) : (
        <WorkspaceEditDropdown
          renameModal={renameModal}
          deleteModal={deleteModal}
        />
      )}
    </>
  )
}

const WorkspaceEditDropdown = ({
  renameModal,
  deleteModal,
}: {
  renameModal: UseDisclosureReturn
  deleteModal: UseDisclosureReturn
}): JSX.Element => {
  return (
    <Menu placement="bottom-start">
      {({ isOpen }) => (
        <>
          <MenuButton
            as={IconButton}
            _active={{ bg: 'secondary.100' }}
            isActive={isOpen}
            aria-label="Edit folder"
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
  )
}

const WorkspaceEditDrawer = ({
  renameModal,
  deleteModal,
}: {
  renameModal: UseDisclosureReturn
  deleteModal: UseDisclosureReturn
}): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const buttonProps: Partial<ButtonProps> = useMemo(
    () => ({
      isFullWidth: true,
      iconSpacing: '1rem',
      justifyContent: 'flex-start',
      textStyle: 'body-1',
    }),
    [],
  )

  return (
    <Box display={{ md: 'none' }}>
      <IconButton
        variant="clear"
        aria-label="More options"
        icon={<BiDotsHorizontalRounded fontSize="1.25rem" />}
        onClick={onOpen}
      />
      <Drawer placement="bottom" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="0.25rem">
          <DrawerBody px={0} py="0.5rem">
            <ButtonGroup
              flexDir="column"
              spacing={0}
              w="100%"
              variant="clear"
              colorScheme="secondary"
            >
              <Button onClick={renameModal.onOpen} {...buttonProps}>
                Rename folder
              </Button>
              <Button onClick={deleteModal.onOpen} {...buttonProps}>
                Delete folder
              </Button>
            </ButtonGroup>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
