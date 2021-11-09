import {
  BiDuplicate,
  BiShareAlt,
  BiShow,
  BiTrash,
  BiUserPlus,
} from 'react-icons/bi'
import { ButtonGroup, MenuButton, MenuDivider } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

export interface RowActionDropdownProps {
  isDisabled?: boolean
}

export const RowActionDropdown = ({
  isDisabled,
}: RowActionDropdownProps): JSX.Element => {
  return (
    <Menu
      placement="bottom-end"
      // Prevents massize render load when there are a ton of rows
      isLazy
    >
      {({ isOpen }) => (
        <>
          <ButtonGroup isAttached variant="outline" colorScheme="secondary">
            <Button px="1.5rem" mr="-1px">
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
            <Menu.Item icon={<BiShow fontSize="1.25rem" />}>Preview</Menu.Item>
            <Menu.Item icon={<BiDuplicate fontSize="1.25rem" />}>
              Duplicate
            </Menu.Item>
            <Menu.Item icon={<BiShareAlt fontSize="1.25rem" />}>
              Share form
            </Menu.Item>
            <Menu.Item icon={<BiUserPlus fontSize="1.25rem" />}>
              Manage form access
            </Menu.Item>
            <MenuDivider />
            <Menu.Item color="danger.500" icon={<BiTrash fontSize="1.25rem" />}>
              Delete
            </Menu.Item>
          </Menu.List>
        </>
      )}
    </Menu>
  )
}
