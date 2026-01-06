import {
  Box,
  Flex,
  Button,
  Stack,
  MenuButton,
  Menu,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverCloseButton,
  PopoverArrow,
  PopoverBody,
  PopoverFooter,
  Select,
  Input,
} from '@chakra-ui/react'
import { ResponsesTableV2 } from './ResponsesTable/ResponsesTableV2'
import { useState } from 'react'
import { BiCalendar, BiFilter, BiHide, BiPlus } from 'react-icons/bi'
import { useAdminForm } from '~features/admin-form/common/queries'
import { BasicField } from '~shared/types'
import InlineMessage from '~components/InlineMessage'

enum FilterOperator {
  Contains = 'contains',
}

interface Filter {
  fieldId: string
  operator: FilterOperator
  value: string
}

const FilterEditor = ({
  filter,
  onChange,
  fields,
  index,
}: {
  filter: Filter
  onChange: (filter: Filter) => void
  fields: {
    _id: string
    title: string
  }[]
  index: number
}) => {
  return (
    <Flex gap={2} alignItems="center">
      <Text width="12rem">{index === 0 ? 'Where' : 'And'}</Text>
      <Select
        value={filter.fieldId}
        onChange={(e) => onChange({ ...filter, fieldId: e.target.value })}
        size="sm"
      >
        {fields.map((field) => (
          <option key={field._id} value={field._id}>
            {field.title}
          </option>
        ))}
      </Select>
      <Select
        value={filter.operator}
        onChange={(e) =>
          onChange({ ...filter, operator: e.target.value as FilterOperator })
        }
        size="sm"
      >
        {Object.values(FilterOperator).map((operator) => (
          <option key={operator} value={operator}>
            {operator}
          </option>
        ))}
      </Select>
      <Input
        value={filter.value}
        onChange={(e) => onChange({ ...filter, value: e.target.value })}
        size="sm"
      />
    </Flex>
  )
}

const FilterButton = ({
  icon,
  label,
}: {
  icon: React.ReactElement
  label: string
}) => {
  return (
    <Button
      leftIcon={icon}
      borderWidth="1"
      borderColor="secondary.200"
      color="secondary.500"
      variant="clear"
      _hover={{ bg: 'secondary.100', color: 'secondary.700' }}
    >
      {label}
    </Button>
  )
}
const FieldFilter = ({
  fields,
  filters,
  setFilters,
}: {
  fields: {
    _id: string
    title: string
    fieldType: BasicField
  }[]
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
}) => {
  const handleAddFilter = () => {
    setFilters([
      ...filters,
      { fieldId: fields[0]._id, operator: FilterOperator.Contains, value: '' },
    ])
  }
  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <Button
          leftIcon={<BiFilter />}
          variant="clear"
          borderColor="secondary.200"
          color="secondary.500"
        >
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent bgColor="white" width="40rem">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          {!filters || filters.length === 0 ? (
            <InlineMessage fontSize="sm">
              Add a new filter to find specific responses.
            </InlineMessage>
          ) : (
            <Stack gap="0.5rem">
              {filters.map((filter, index) => (
                <FilterEditor
                  index={index}
                  key={filter.fieldId + index.toString()}
                  filter={filter}
                  onChange={(updatedFilter) =>
                    setFilters(
                      filters.map((f, i) => (i === index ? updatedFilter : f)),
                    )
                  }
                  fields={fields}
                />
              ))}
            </Stack>
          )}
        </PopoverBody>
        <PopoverFooter>
          <Flex justifyContent="space-between">
            <Button
              leftIcon={<BiPlus />}
              size="sm"
              colorScheme="primary"
              onClick={handleAddFilter}
            >
              Add filter
            </Button>
          </Flex>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  )
}

const HideFields = ({
  fields,
  selectedFieldIds,
  setSelectedFieldIds,
}: {
  fields: {
    _id: string
    title: string
  }[]
  selectedFieldIds: string[]
  setSelectedFieldIds: (fieldIds: string[]) => void
}) => {
  return (
    <Menu closeOnSelect={false}>
      {({ isOpen }) => (
        <>
          <MenuButton
            isActive={isOpen}
            as={Button}
            leftIcon={<BiHide />}
            variant="clear"
            borderColor="secondary.200"
            color="secondary.500"
          >
            Hide Fields
          </MenuButton>
          <MenuList>
            <MenuOptionGroup
              onChange={(value) => setSelectedFieldIds(value as string[])}
              value={selectedFieldIds}
              type="checkbox"
            >
              {fields.map((field) => (
                <MenuItemOption key={field._id} value={field._id}>
                  {field.title}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          </MenuList>
        </>
      )}
    </Menu>
  )
}

const DateRangeFilter = () => {
  return <FilterButton icon={<BiCalendar />} label="All time" />
}

const FilterBar = ({
  formFields,
  selectedFieldIds,
  setSelectedFieldIds,
  filters,
  setFilters,
}: {
  formFields: { _id: string; title: string; fieldType: BasicField }[]
  selectedFieldIds: string[]
  setSelectedFieldIds: (fieldIds: string[]) => void
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
}) => {
  return (
    <Flex justifyContent={'space-between'}>
      <Flex gap="0.5rem">
        <FieldFilter
          fields={formFields}
          filters={filters}
          setFilters={setFilters}
        />
        <HideFields
          fields={formFields}
          selectedFieldIds={selectedFieldIds}
          setSelectedFieldIds={setSelectedFieldIds}
        />
      </Flex>
      <Flex gap="0.5rem">
        <DateRangeFilter />
      </Flex>
    </Flex>
  )
}

const UnlockedResponsesV2 = () => {
  const { data: form, isLoading: isFormLoading } = useAdminForm()
  const { form_fields } = form ?? {}

  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(
    form_fields?.map((field) => field._id) ?? [],
  )
  const [filters, setFilters] = useState<Filter[]>([])

  return (
    <Stack width="100%" gap="0.5rem" flexDir="column">
      <FilterBar
        formFields={form_fields ?? []}
        selectedFieldIds={selectedFieldIds}
        setSelectedFieldIds={setSelectedFieldIds}
        filters={filters}
        setFilters={setFilters}
      />
      <Box overflow="auto" maxWidth="100%" flex={1}>
        <ResponsesTableV2 />
      </Box>
    </Stack>
  )
}

export default UnlockedResponsesV2
