import { useMemo } from 'react'
import {
  BiDotsHorizontalRounded,
  BiDuplicate,
  BiEditAlt,
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
  useDisclosure,
} from '@chakra-ui/react'

import Button, { ButtonProps } from '~components/Button'
import IconButton from '~components/IconButton'

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

  const {
    adminFormLink,
    previewFormLink,
    handleDeleteForm,
    handleDuplicateForm,
    handleCollaborators,
    handleShareForm,
  } = useRowAction(formMeta)

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
              isDisabled={isDisabled}
              variant="clear"
              colorScheme="secondary"
            >
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
                onClick={handleDuplicateForm}
                leftIcon={<BiDuplicate fontSize="1.25rem" />}
              >
                Duplicate
              </Button>
              <Button
                {...buttonProps}
                onClick={handleShareForm}
                leftIcon={<BiShareAlt fontSize="1.25rem" />}
              >
                Share form
              </Button>
              <Button
                {...buttonProps}
                onClick={handleCollaborators}
                leftIcon={<BiUserPlus fontSize="1.25rem" />}
              >
                Manage form admins
              </Button>
              <Divider />
              <Button
                {...buttonProps}
                onClick={handleDeleteForm}
                color="danger.500"
                leftIcon={<BiTrash fontSize="1.25rem" />}
              >
                Delete
              </Button>
            </ButtonGroup>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
