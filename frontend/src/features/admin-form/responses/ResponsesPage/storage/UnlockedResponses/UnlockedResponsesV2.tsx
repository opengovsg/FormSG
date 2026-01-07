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
  PopoverArrow,
  PopoverBody,
  PopoverFooter,
  Select,
  Input,
} from '@chakra-ui/react'
import { ResponsesTableV2 } from './ResponsesTable/ResponsesTableV2'
import { useEffect, useState } from 'react'
import { BiFilter, BiHide, BiPlus } from 'react-icons/bi'
import { useAdminForm } from '~features/admin-form/common/queries'
import {
  BasicField,
  DateString,
  FormFieldDto,
  SubmissionMetadata,
} from '~shared/types'
import InlineMessage from '~components/InlineMessage'
import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import { useStorageResponsesContext } from '../StorageResponsesContext'
import useDecryptResponses from '../useDecryptResponses'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { useSecretKey } from '../useSecretKey'

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
    <Popover placement="bottom-end">
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
        <PopoverBody>
          {!filters || filters.length === 0 ? (
            <InlineMessage fontSize="sm" alignItems="center">
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

const DateRangeFilter = ({
  dateRange,
  setDateRange,
}: {
  dateRange: DateString[]
  setDateRange: (dateRange: DateString[]) => void
}) => {
  return (
    <DateRangePicker
      placement="bottom-end"
      value={dateRangePickerHelper.dateStringToDatePickerValue(dateRange)}
      onChange={(nextDateRange) =>
        setDateRange(
          dateRangePickerHelper.datePickerValueToDateString(nextDateRange),
        )
      }
    />
  )
}

const FilterBar = ({
  formFields,
  selectedFieldIds,
  setSelectedFieldIds,
  filters,
  setFilters,
  dateRange,
  setDateRange,
}: {
  formFields: { _id: string; title: string; fieldType: BasicField }[]
  selectedFieldIds: string[]
  setSelectedFieldIds: (fieldIds: string[]) => void
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  dateRange: DateString[]
  setDateRange: (dateRange: DateString[]) => void
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
        <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} />
      </Flex>
    </Flex>
  )
}

const filterFieldsForDashboardView = (formFields: FormFieldDto[]) => {
  return formFields.filter((field) => {
    return (
      field.fieldType !== BasicField.Section &&
      field.fieldType !== BasicField.Statement &&
      field.fieldType !== BasicField.Signature &&
      field.fieldType !== BasicField.Attachment &&
      field.fieldType !== BasicField.Image &&
      field.fieldType !== BasicField.Address &&
      field.fieldType !== BasicField.Children
    )
  })
}

const UnlockedResponsesV2 = () => {
  const { data: form, isLoading: isLoadingForm } = useAdminForm()
  const { secretKey, isLoading: isLoadingSecretKey } =
    useStorageResponsesContext()
  const { form_fields } = form ?? {}
  const fieldsForDashboardView = filterFieldsForDashboardView(form_fields ?? [])

  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(
    fieldsForDashboardView?.map((field) => field._id) ?? [],
  )
  const [filters, setFilters] = useState<Filter[]>([])
  const [dateRange, setDateRange] = useState<DateString[] | undefined>(
    undefined,
  )

  if (!secretKey || !form) return null

  const [decryptedResponses, setDecryptedResponses] = useState<
    ({ decryptedResponses: FormField[] } & SubmissionMetadata)[]
  >([])

  const { decryptResponses } = useDecryptResponses()

  useEffect(() => {
    if (isLoadingForm || isLoadingSecretKey) return
    decryptResponses({
      formId: form?._id ?? '',
      secretKey,
      startDate: dateRange ? dateRange[0] : undefined,
      endDate: dateRange ? dateRange[1] : undefined,
    }).then((results) => {
      const decryptedResponses = results.filter(
        (
          result,
        ): result is { decryptedResponses: FormField[] } & SubmissionMetadata =>
          result !== undefined,
      )
      setDecryptedResponses(decryptedResponses)
    })
  }, [form?._id, secretKey, dateRange, isLoadingForm, isLoadingSecretKey])

  return (
    <Stack height="100%" width="100%" gap="0.5rem" flexDir="column">
      <FilterBar
        formFields={fieldsForDashboardView ?? []}
        selectedFieldIds={selectedFieldIds}
        setSelectedFieldIds={setSelectedFieldIds}
        filters={filters}
        setFilters={setFilters}
        dateRange={dateRange ?? []}
        setDateRange={setDateRange}
      />
      <Box overflow="auto" maxWidth="100%" flex={1}>
        <ResponsesTableV2
          form={{ ...form, form_fields: fieldsForDashboardView }}
          decryptedResponses={decryptedResponses}
        />
      </Box>
    </Stack>
  )
}

export default UnlockedResponsesV2
