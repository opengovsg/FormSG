import {
  BiDuplicate,
  BiShareAlt,
  BiShow,
  BiTrash,
  BiUserPlus,
} from 'react-icons/bi'
import { Link as ReactLink } from 'react-router-dom'
import { ButtonGroup, MenuButton, MenuDivider } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import { RowActionsProps } from './RowActions'
import { useRowAction } from './useRowAction'

export const RowActionsDropdown = ({
  isDisabled,
  formMeta,
}: RowActionsProps): JSX.Element => {
  const {
    adminFormLink,
    previewFormLink,
    handleDeleteForm,
    handleDuplicateForm,
    handleCollaborators,
    handleShareForm,
    isFormAdmin,
  } = useRowAction(formMeta)

  return (
    <Menu
      placement="bottom-end"
      // Prevents massive render load when there are a ton of rows
      isLazy
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
        </>
      )}
    </Menu>
  )
}
