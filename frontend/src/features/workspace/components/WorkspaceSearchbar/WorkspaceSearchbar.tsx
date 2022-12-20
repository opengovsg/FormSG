import { useEffect, useMemo, useRef, useState } from 'react'
import { BiFilter, BiSearch } from 'react-icons/bi'
import {
  Divider,
  forwardRef,
  Icon,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  MenuButton,
  MenuItemOption,
  MenuOptionGroup,
  Portal,
  useControllableState,
} from '@chakra-ui/react'

import Button from '~components/Button'
import Input from '~components/Input'
import Menu from '~components/Menu'

import { FilterOption } from '~features/workspace/types'
import { FILTER_OPTIONS } from '~features/workspace/utils/dashboardFilter'

export interface WorkspaceSearchbarProps {
  /** Filter selection input will be controlled if provided. */
  filterValue?: FilterOption
  /** Callback when filter value changes. */
  onFilter?: (filter: FilterOption) => void
  /** Value to assign to uncontrolled filter selection input. */
  defaultFilterValue?: FilterOption

  /** Search input will be controlled if provided. */
  value?: string
  /** Callback when search value changes. */
  onChange?: (query: string) => void
  /** Value to assign to uncontrolled search input. */
  defaultValue?: string
}

export const useWorkspaceSearchbar = ({
  value,
  defaultValue,
  onChange,
  filterValue,
  onFilter,
  defaultFilterValue = FilterOption.AllForms,
}: WorkspaceSearchbarProps) => {
  const [internalValue, setInternalValue] = useControllableState({
    value,
    defaultValue,
    onChange,
  })
  const [internalFilter, setInternalFilter] = useControllableState({
    value: filterValue,
    defaultValue: defaultFilterValue,
    onChange: onFilter,
  })

  const filterButtonLabel = useMemo(() => {
    if (internalFilter === FilterOption.AllForms) return 'Filter'
    return internalFilter
  }, [internalFilter])

  const hasFilter = useMemo(
    () => internalFilter !== FilterOption.AllForms,
    [internalFilter],
  )

  return {
    internalValue,
    setInternalValue,
    internalFilter,
    setInternalFilter,
    filterButtonLabel,
    hasFilter,
  }
}

export const WorkspaceSearchbar = forwardRef<WorkspaceSearchbarProps, 'input'>(
  (
    {
      defaultValue,
      value,
      onChange,
      defaultFilterValue,
      filterValue,
      onFilter,
      placeholder,
    },
    ref,
  ): JSX.Element => {
    const {
      filterButtonLabel,
      internalFilter,
      internalValue,
      setInternalFilter,
      setInternalValue,
    } = useWorkspaceSearchbar({
      defaultValue,
      value,
      onChange,
      defaultFilterValue,
      filterValue,
      onFilter,
    })

    const filterRef = useRef<HTMLDivElement>(null)

    const [filterElemWidth, setFilterElemWidth] = useState<number>()

    // Update padding of input element when filter element width changes.
    useEffect(() => {
      if (!filterRef.current) return

      const observer = new ResizeObserver((entries) => {
        setFilterElemWidth(entries[0].contentRect.width + 4)
      })
      observer.observe(filterRef.current)

      return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        filterRef.current && observer.unobserve(filterRef.current)
      }
    }, [])

    return (
      <InputGroup>
        <InputLeftElement>
          <Icon as={BiSearch} color="secondary.500" fontSize="1.25rem" />
        </InputLeftElement>
        <Input
          ref={ref}
          value={internalValue}
          placeholder={placeholder}
          onChange={(e) => setInternalValue(e.target.value)}
          pr={filterElemWidth}
        />
        <InputRightElement width="auto" ref={filterRef}>
          <Divider height="calc(100% - 1.5rem)" orientation="vertical" />
          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              size="sm"
              variant="clear"
              colorScheme="secondary"
              aria-label="Filter forms"
              leftIcon={<BiFilter fontSize="1.25rem" />}
              px="0.5rem"
              mx="0.25rem"
              fontSize="initial"
            >
              {filterButtonLabel}
            </MenuButton>
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
        </InputRightElement>
      </InputGroup>
    )
  },
)
