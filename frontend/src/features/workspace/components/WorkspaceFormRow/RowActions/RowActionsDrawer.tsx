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

import { FormStatus } from '~shared/types'

import Button, { ButtonProps } from '~components/Button'
import IconButton from '~components/IconButton'

import { ShareFormModal } from '~features/admin-form/share'

import { RowActionsProps } from './RowActions'
import { useRowActionDropdown } from './useRowActionDropdown'

/**
 * Drawer variant of form actions. Most probably used only in mobile breakpoints.
 */
export const RowActionsDrawer = ({
  isDisabled,
  formMeta,
}: RowActionsProps): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const {
    handleDeleteForm,
    handleDuplicateForm,
    handleEditForm,
    handleManageFormAccess,
    handlePreviewForm,
    shareFormModalDisclosure,
  } = useRowActionDropdown(formMeta._id)

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
      <ShareFormModal
        isOpen={shareFormModalDisclosure.isOpen}
        formId={formMeta._id}
        onClose={shareFormModalDisclosure.onClose}
        isFormPrivate={formMeta.status === FormStatus.Private}
      />
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
                {...buttonProps}
                onClick={handleEditForm}
                leftIcon={<BiEditAlt fontSize="1.25rem" />}
              >
                Edit
              </Button>
              <Button
                {...buttonProps}
                onClick={handlePreviewForm}
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
                onClick={shareFormModalDisclosure.onOpen}
                leftIcon={<BiShareAlt fontSize="1.25rem" />}
              >
                Share form
              </Button>
              <Button
                {...buttonProps}
                onClick={handleManageFormAccess}
                leftIcon={<BiUserPlus fontSize="1.25rem" />}
              >
                Manage form access
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
