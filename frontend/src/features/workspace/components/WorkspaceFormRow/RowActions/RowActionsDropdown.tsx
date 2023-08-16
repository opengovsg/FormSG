import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
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
import {
  ButtonGroup,
  Flex,
  Icon,
  MenuButton,
  MenuDivider,
  Text,
} from '@chakra-ui/react'

import { AdminDashboardFormMetaDto } from '~shared/types'
import { Workspace } from '~shared/types/workspace'

import { BxCheck } from '~assets/icons'
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
  const { workspaces, getFormWorkspace } = useWorkspaceContext()

  const handleWorkspaceClick = useCallback(
    (destWorkspace: Workspace) =>
      handleMoveForm(destWorkspace._id.toString(), destWorkspace.title),
    [handleMoveForm],
  )

  const currFormWorkspace = useMemo(
    () => getFormWorkspace(formMeta._id),
    [formMeta, getFormWorkspace],
  )

  if (!workspaces) return null

  return (
    <Menu.List>
      <Menu.Item
        closeOnSelect={false}
        onClick={() => setIsMoveWorkspace(false)}
        icon={<BiChevronLeft fontSize="1.25rem" />}
      >
        Back
      </Menu.Item>
      <Menu.Divider aria-hidden borderColor="neutral.300"></Menu.Divider>
      {workspaces.map((workspace) => (
        <Menu.Item
          key={workspace._id}
          onClick={() => handleWorkspaceClick(workspace)}
        >
          <Flex justifyContent="space-between" w="242px" alignItems="center">
            <Text textStyle="body-1" noOfLines={1}>
              {workspace.title}
            </Text>
            {workspace._id === currFormWorkspace?._id && (
              <Icon as={BxCheck} ml="0.25rem" />
            )}
          </Flex>
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
                Move to Folder
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
