import {
  BiDuplicate,
  BiShareAlt,
  BiShow,
  BiTrash,
  BiUserPlus,
} from 'react-icons/bi'
import { useNavigate } from 'react-router'
import { ButtonGroup, MenuButton, MenuDivider } from '@chakra-ui/react'

import { FormId } from '~shared/types/form/form'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

export interface RowActionDropdownProps {
  formId: FormId
  isDisabled?: boolean
}

const useRowActionDropdown = (formId: FormId) => {
  const navigate = useNavigate()
  return {
    handleEditForm: () => navigate(`${ADMINFORM_ROUTE}/${formId}`),
    handlePreviewForm: () =>
      console.log(`preview button clicked for ${formId}`),
    handleDuplicateForm: () =>
      console.log(`duplicate form button clicked for ${formId}`),
    handleShareForm: () =>
      console.log(`share form button clicked for ${formId}`),
    handleManageFormAccess: () =>
      console.log(`manage form access button clicked for ${formId}`),
    handleDeleteForm: () =>
      console.log(`delete form  button clicked for ${formId}`),
  }
}

export const RowActionDropdown = ({
  isDisabled,
  formId,
}: RowActionDropdownProps): JSX.Element => {
  const {
    handleEditForm,
    handlePreviewForm,
    handleDeleteForm,
    handleDuplicateForm,
    handleManageFormAccess,
    handleShareForm,
  } = useRowActionDropdown(formId)

  return (
    <Menu
      placement="bottom-end"
      // Prevents massize render load when there are a ton of rows
      isLazy
    >
      {({ isOpen }) => (
        <>
          <ButtonGroup isAttached variant="outline" colorScheme="secondary">
            <Button px="1.5rem" mr="-1px" onClick={handleEditForm}>
              Edit
            </Button>
            <MenuButton
              as={IconButton}
              isDisabled={isDisabled}
              _active={{ bg: 'secondary.100' }}
              isActive={isOpen}
              aria-label="More actions"
              icon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
            />
          </ButtonGroup>
          <Menu.List>
            <Menu.Item
              onClick={handlePreviewForm}
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
              onClick={handleManageFormAccess}
              icon={<BiUserPlus fontSize="1.25rem" />}
            >
              Manage form access
            </Menu.Item>
            <MenuDivider />
            <Menu.Item
              onClick={handleDeleteForm}
              color="danger.500"
              icon={<BiTrash fontSize="1.25rem" />}
            >
              Delete
            </Menu.Item>
          </Menu.List>
        </>
      )}
    </Menu>
  )
}
