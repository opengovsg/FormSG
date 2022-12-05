import { useMemo } from 'react'
import { BiFilter } from 'react-icons/bi'
import {
  Box,
  Flex,
  MenuButton,
  MenuItemOption,
  MenuOptionGroup,
} from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import { FilterOption } from '~features/workspace/types'
import { FILTER_OPTIONS } from '~features/workspace/utils/dashboardFilter'

import {
  useWorkspaceSearchbar,
  WorkspaceSearchbarProps,
} from './WorkspaceSearchbar'

export type MobileWorkspaceSearchbarProps = WorkspaceSearchbarProps

const SelectedFilterAffordance = ({ show }: { show?: boolean }) => {
  return (
    <>
      <BiFilter fontSize="1.25rem" />
      {show && (
        <Flex
          aria-hidden
          width="1rem"
          height="1rem"
          as="span"
          color="white"
          position="absolute"
          top="-0.5rem"
          right="-0.5rem"
          textStyle="legal"
          bg="primary.500"
          borderRadius="50%"
          zIndex="banner"
          align="center"
          justify="center"
        >
          1
        </Flex>
      )}
    </>
  )
}

export const MobileWorkspaceSearchbar = (
  props: MobileWorkspaceSearchbarProps,
): JSX.Element => {
  const {
    filterButtonLabel,
    internalFilter,
    internalValue,
    setInternalFilter,
    setInternalValue,
  } = useWorkspaceSearchbar(props)

  const hasFilter = useMemo(
    () => internalFilter !== FilterOption.AllForms,
    [internalFilter],
  )

  return (
    <>
      <Menu placement="bottom-end">
        <MenuButton
          pos="relative"
          width="min-content"
          as={IconButton}
          colorScheme="secondary"
          variant="clear"
          aria-label="Filter"
          icon={<SelectedFilterAffordance show={hasFilter} />}
          rightIcon={undefined}
        />
        <Menu.List>
          <MenuOptionGroup
            type="radio"
            value={internalFilter}
            onChange={(val) => setInternalFilter(val as FilterOption)}
          >
            {FILTER_OPTIONS.map((value, i) => (
              <MenuItemOption key={i} iconSpacing="1.5rem" value={value}>
                {value}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </Menu.List>
      </Menu>
    </>
  )
}
