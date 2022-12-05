import { useCallback, useMemo } from 'react'
import { BiFilter, BiSearch, BiX } from 'react-icons/bi'
import {
  Box,
  Flex,
  forwardRef,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  MenuButton,
  MenuItemOption,
  MenuOptionGroup,
  Portal,
} from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

import { FilterOption } from '~features/workspace/types'
import { FILTER_OPTIONS } from '~features/workspace/utils/dashboardFilter'

import {
  useWorkspaceSearchbar,
  WorkspaceSearchbarProps,
} from './WorkspaceSearchbar'

export interface MobileWorkspaceSearchbarProps extends WorkspaceSearchbarProps {
  isExpanded: boolean
  onToggleExpansion: () => void
}

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

export const MobileWorkspaceSearchbar = forwardRef<
  MobileWorkspaceSearchbarProps,
  'input'
>(
  (
    { isExpanded, onToggleExpansion, placeholder, ...props },
    ref,
  ): JSX.Element => {
    const {
      internalFilter,
      internalValue,
      setInternalFilter,
      setInternalValue,
    } = useWorkspaceSearchbar(props)

    const hasFilter = useMemo(
      () => internalFilter !== FilterOption.AllForms,
      [internalFilter],
    )

    const handleToggle = useCallback(() => {
      if (isExpanded) {
        setInternalValue('')
      }
      onToggleExpansion()
    }, [isExpanded, onToggleExpansion, setInternalValue])

    return (
      <>
        <Box gridArea="searchicon">
          <IconButton
            aria-label={
              isExpanded ? 'Close and reset search bar' : 'Expand search bar'
            }
            colorScheme="secondary"
            variant="clear"
            onClick={handleToggle}
            icon={
              isExpanded ? (
                <BiX fontSize="1.25rem" />
              ) : (
                <BiSearch fontSize="1.25rem" />
              )
            }
          />
        </Box>
        <Box gridArea="filter">
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
            <Portal>
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
            </Portal>
          </Menu>
        </Box>
        {isExpanded && (
          <InputGroup gridArea="search">
            <InputLeftElement>
              <Icon as={BiSearch} color="secondary.500" fontSize="1.25rem" />
            </InputLeftElement>
            <Input
              ref={ref}
              value={internalValue}
              placeholder={placeholder}
              onChange={(e) => setInternalValue(e.target.value)}
            />
            <InputRightElement right="1px">
              <IconButton
                aria-label="Clear search"
                icon={<BiX />}
                onClick={() => setInternalValue('')}
                fontSize="1.25rem"
                variant="clear"
                colorScheme="secondary"
                height="calc(100% - 2px)"
                minH="auto"
              />
            </InputRightElement>
          </InputGroup>
        )}
      </>
    )
  },
)
