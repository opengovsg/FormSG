import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import {
  BiChevronRight,
  BiDotsHorizontalRounded,
  BiDuplicate,
  BiEditAlt,
  BiFolder,
  BiLeftArrowAlt,
  BiShareAlt,
  BiShow,
  BiTrash,
  BiUserPlus,
} from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import {
  Box,
  ButtonGroup,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Icon,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { AdminDashboardFormMetaDto } from '~shared/types'
import { Workspace } from '~shared/types/workspace'

import { BxCheck } from '~assets/icons'
import Button, { ButtonProps } from '~components/Button'
import IconButton from '~components/IconButton'

import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import { RowActionsProps } from './RowActions'
import { useRowAction } from './useRowAction'

/**
 * Drawer variant of form actions. Most probably used only in mobile breakpoints.
 */
export const RowActionsDrawer = ({
  isDisabled,
  formMeta,
}: RowActionsProps): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isMoveWorkspace, setIsMoveWorkspace] = useState(false)

  const {
    adminFormLink,
    previewFormLink,
    handleDeleteForm,
    handleDuplicateForm,
    isFormAdmin,
    handleCollaborators,
    handleShareForm,
  } = useRowAction(formMeta)

  const onClickDefault = useCallback(
    (onClick: () => void) => () => {
      onClose()
      onClick()
    },
    [onClose],
  )

  const buttonProps: Partial<ButtonProps> = useMemo(
    () => ({
      isFullWidth: true,
      iconSpacing: '1rem',
      justifyContent: 'flex-start',
      textStyle: 'body-1',
    }),
    [],
  )

  const handleClose = () => {
    setIsMoveWorkspace(false)
    onClose()
  }

  const handleMoveWorkspace = () => {
    setIsMoveWorkspace(true)
  }

  return (
    <Box display={{ md: 'none' }}>
      <IconButton
        variant="clear"
        aria-label="More options"
        icon={<BiDotsHorizontalRounded fontSize="1.25rem" />}
        onClick={onOpen}
      />
      <Drawer placement="bottom" onClose={handleClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="0.25rem">
          <DrawerBody px={0} py="0.5rem">
            <ButtonGroup
              flexDir="column"
              spacing={0}
              w="100%"
              isDisabled={isDisabled}
              variant="clear"
              colorScheme="secondary"
            >
              {isMoveWorkspace ? (
                <MoveWorkspaceDrawer
                  setIsMoveWorkspace={setIsMoveWorkspace}
                  formMeta={formMeta}
                  buttonProps={buttonProps}
                />
              ) : (
                <>
                  <Button
                    as={ReactLink}
                    to={adminFormLink}
                    {...buttonProps}
                    leftIcon={<BiEditAlt fontSize="1.25rem" />}
                  >
                    Edit
                  </Button>
                  <Button
                    as={ReactLink}
                    to={previewFormLink}
                    target="_blank"
                    {...buttonProps}
                    leftIcon={<BiShow fontSize="1.25rem" />}
                  >
                    Preview
                  </Button>
                  <Button
                    {...buttonProps}
                    onClick={onClickDefault(handleDuplicateForm)}
                    leftIcon={<BiDuplicate fontSize="1.25rem" />}
                  >
                    Duplicate
                  </Button>
                  <Button
                    {...buttonProps}
                    onClick={onClickDefault(handleShareForm)}
                    leftIcon={<BiShareAlt fontSize="1.25rem" />}
                  >
                    Share form
                  </Button>
                  <Button
                    {...buttonProps}
                    onClick={onClickDefault(handleCollaborators)}
                    leftIcon={<BiUserPlus fontSize="1.25rem" />}
                  >
                    Manage form admins
                  </Button>
                  <Button
                    {...buttonProps}
                    onClick={handleMoveWorkspace}
                    leftIcon={<BiFolder fontSize="1.25rem" />}
                  >
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                      w="100%"
                    >
                      <Text>Move to Folder</Text>
                      <BiChevronRight fontSize="1.25rem" />
                    </Flex>
                  </Button>
                  {isFormAdmin && (
                    <>
                      <Divider />
                      <Button
                        {...buttonProps}
                        onClick={onClickDefault(handleDeleteForm)}
                        color="danger.500"
                        leftIcon={<BiTrash fontSize="1.25rem" />}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </>
              )}
            </ButtonGroup>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

const MoveWorkspaceDrawer = ({
  setIsMoveWorkspace,
  formMeta,
  buttonProps,
}: {
  setIsMoveWorkspace: Dispatch<SetStateAction<boolean>>
  formMeta: AdminDashboardFormMetaDto
  buttonProps: Partial<ButtonProps>
}) => {
  const { handleRemoveFormFromWorkspaces, handleMoveForm } =
    useRowAction(formMeta)
  const { workspaces, getFormWorkspace } = useWorkspaceContext()

  const currFormWorkspace = useMemo(
    () => getFormWorkspace(formMeta._id),
    [formMeta, getFormWorkspace],
  )

  // if workspace selected is current workspace, delete
  // else move to selected workspace
  const handleWorkspaceAction = useCallback(
    (destWorkspace: Workspace, currFormWorkspace?: Workspace) => {
      if (destWorkspace._id === currFormWorkspace?._id)
        handleRemoveFormFromWorkspaces()
      else handleMoveForm(destWorkspace._id.toString(), destWorkspace.title)
    },
    [handleMoveForm, handleRemoveFormFromWorkspaces],
  )

  if (!workspaces) return null

  return (
    <>
      <Button
        {...buttonProps}
        textStyle="subhead-1"
        onClick={() => setIsMoveWorkspace(false)}
        leftIcon={<BiLeftArrowAlt fontSize="1.25rem" />}
      >
        Back
      </Button>
      <Divider />
      {workspaces.map((workspace) => (
        <Button
          {...buttonProps}
          key={workspace._id}
          onClick={() => handleWorkspaceAction(workspace, currFormWorkspace)}
        >
          <Flex justifyContent="space-between" w="100%" alignItems="center">
            <Text textStyle="body-1" noOfLines={1}>
              {workspace.title}
            </Text>
            {workspace._id === currFormWorkspace?._id && <Icon as={BxCheck} />}
          </Flex>
        </Button>
      ))}
    </>
  )
}
