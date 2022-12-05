import { useEffect, useMemo, useRef, useState } from 'react'
import { BiFilter, BiSearch } from 'react-icons/bi'
import {
  Divider,
  forwardRef,
  Icon,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  MenuItemOption,
  MenuOptionGroup,
  useControllableState,
} from '@chakra-ui/react'

import Input from '~components/Input'
import Menu from '~components/Menu'

import { FilterOption } from '~features/workspace/types'

type WorkspaceFilterValue = 'all' | 'closed' | 'open'

export interface WorkspaceSearchbarProps {
  /** Filter selection input will be controlled if provided. */
  filterValue?: WorkspaceFilterValue
  /** Callback when filter value changes. */
  onFilter?: (filter: WorkspaceFilterValue) => void
  /** Value to assign to uncontrolled filter selection input. */
  defaultFilterValue?: WorkspaceFilterValue

  /** Search input will be controlled if provided. */
  value?: string
  /** Callback when search value changes. */
  onChange?: (query: string) => void
  /** Value to assign to uncontrolled search input. */
  defaultValue?: string
}

const FILTER_OPTIONS: Record<WorkspaceFilterValue, string> = {
  all: 'All forms',
  closed: FilterOption.ClosedForms,
  open: FilterOption.OpenForms,
}

export const WorkspaceSearchbar = forwardRef<WorkspaceSearchbarProps, 'input'>(
  (
    { filterValue, onFilter, value, onChange, defaultValue },
    ref,
  ): JSX.Element => {
    const [internalValue, setInternalValue] = useControllableState({
      value,
      defaultValue,
      onChange,
    })
    const [internalFilter, setInternalFilter] = useControllableState({
      value: filterValue,
      defaultValue: 'all',
      onChange: onFilter,
    })

    const filterRef = useRef<HTMLDivElement>(null)

    const filterButtonLabel = useMemo(() => {
      if (internalFilter === 'all') return 'Filter'
      return FILTER_OPTIONS[internalFilter]
    }, [internalFilter])

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
          onChange={(e) => setInternalValue(e.target.value)}
          pr={filterElemWidth}
        />
        <InputRightElement width="auto" ref={filterRef}>
          <Divider
            height="calc(100% - 1.5rem)"
            orientation="vertical"
            mr="0.25rem"
          />
          <Menu placement="bottom-end">
            <Menu.Button
              px="1.25rem"
              colorScheme="secondary"
              variant="clear"
              aria-label="Filter"
              iconSpacing="0.5rem"
              leftIcon={<BiFilter fontSize="1.25rem" />}
              rightIcon={undefined}
            >
              {filterButtonLabel}
            </Menu.Button>
            <Menu.List>
              <MenuOptionGroup
                type="radio"
                value={internalFilter}
                onChange={(val) =>
                  setInternalFilter(val as WorkspaceFilterValue)
                }
              >
                {Object.entries(FILTER_OPTIONS).map(([value, label], i) => (
                  <MenuItemOption iconSpacing="1.5rem" value={value}>
                    {label}
                  </MenuItemOption>
                ))}
              </MenuOptionGroup>
            </Menu.List>
          </Menu>
        </InputRightElement>
      </InputGroup>
    )
  },
)
