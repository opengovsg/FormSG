import { Dispatch, SetStateAction, useState } from 'react'
import {
  BiChevronLeft,
  BiChevronRight,
  BiDuplicate,
  BiFolder,
  BiShareAlt,
  BiShow,
  BiTrash,
  BiUserPlus,
} from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import { ButtonGroup, Icon, MenuButton, MenuDivider } from '@chakra-ui/react'

import { AdminDashboardFormMetaDto } from '~shared/types'
import { Workspace } from '~shared/types/workspace'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import { RowActionsProps } from './RowActions'
import { useRowAction } from './useRowAction'

const MoveWorkspaceDropdown = ({
  setIsMoveWorkspace,
  formMeta,
}: {
  setIsMoveWorkspace: Dispatch<SetStateAction<boolean>>
  formMeta: AdminDashboardFormMetaDto
}) => {
  const { handleMoveForm } = useRowAction(formMeta)
  const { workspaces, setCurrentWorkspace } = useWorkspaceContext()

  const handleWorkspaceClick = async (destWorkspace: Workspace) => {
    // if already exists no change
    if (destWorkspace.formIds.includes(formMeta._id)) return

    //move form to workspace
    await handleMoveForm(destWorkspace._id.toString(), destWorkspace.title)
    setCurrentWorkspace(destWorkspace._id.toString())
  }

  if (!workspaces) return null

  return (
    <Menu.List>
      <Menu.Item
        closeOnSelect={false}
        onClick={() => setIsMoveWorkspace(false)}
        icon={<BiChevronLeft fontSize="1.25rem" />}
      >
        Move to Workspace
      </Menu.Item>
      <Menu.Divider aria-hidden borderColor="neutral.300"></Menu.Divider>
      {workspaces.map((workspace) => (
        <Menu.Item
          key={workspace._id}
          onClick={() => handleWorkspaceClick(workspace)}
        >
          {workspace.title}
        </Menu.Item>
      ))}
    </Menu.List>
  )
}

export const RowActionsDropdown = ({
  isDisabled,
  formMeta,
}: RowActionsProps): JSX.Element => {
  const [isMoveWorkspace, setIsMoveWorkspace] = useState(false)
  const {
    adminFormLink,
    previewFormLink,
    handleDeleteForm,
    handleDuplicateForm,
    handleCollaborators,
    handleShareForm,
    isFormAdmin,
  } = useRowAction(formMeta)

  const handleMoveWorkspace = () => {
    setIsMoveWorkspace(true)
  }

  return (
    <Menu
      placement="bottom-end"
      // Prevents massive render load when there are a ton of rows
      isLazy
      onClose={() => setIsMoveWorkspace(false)}
    >
      {({ isOpen }) => (
        <>
          <ButtonGroup
            isAttached
            variant="outline"
            colorScheme="secondary"
            display={{ base: 'none', md: 'flex' }}
          >
            <Button
              as={ReactLink}
              to={adminFormLink}
              px="1.5rem"
              mr="-1px"
              borderEndRadius={0}
            >
              Edit
            </Button>
            <MenuButton
              as={IconButton}
              borderStartRadius={0}
              isDisabled={isDisabled}
              _active={{ bg: 'secondary.100' }}
              isActive={isOpen}
              aria-label="More actions"
              icon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
            />
          </ButtonGroup>
          {isMoveWorkspace ? (
            <MoveWorkspaceDropdown
              setIsMoveWorkspace={setIsMoveWorkspace}
              formMeta={formMeta}
            />
          ) : (
            <Menu.List>
              <Menu.Item
                as={ReactLink}
                to={previewFormLink}
                target="_blank"
                icon={<BiShow fontSize="1.25rem" />}
              >
                Preview
              </Menu.Item>
              <Menu.Item
                onClick={handleDuplicateForm}
                icon={<BiDuplicate fontSize="1.25rem" />}
              >
                Duplicate
              </Menu.Item>
              <Menu.Item
                onClick={handleShareForm}
                icon={<BiShareAlt fontSize="1.25rem" />}
              >
                Share form
              </Menu.Item>
              <Menu.Item
                onClick={handleCollaborators}
                icon={<BiUserPlus fontSize="1.25rem" />}
              >
                Manage form admins
              </Menu.Item>
              <Menu.Item
                closeOnSelect={false}
                onClick={handleMoveWorkspace}
                icon={<BiFolder fontSize="1.25rem" />}
              >
                Move to Workspace
                <Icon
                  ml="2.5rem"
                  as={BiChevronRight}
                  fontSize="1.25rem"
                  verticalAlign="middle"
                />
              </Menu.Item>
              {isFormAdmin && (
                <>
                  <MenuDivider aria-hidden borderColor="neutral.300" />
                  <Menu.Item
                    onClick={handleDeleteForm}
                    color="danger.500"
                    icon={<BiTrash fontSize="1.25rem" />}
                  >
                    Delete
                  </Menu.Item>
                </>
              )}
            </Menu.List>
          )}
        </>
      )}
    </Menu>
  )
}
