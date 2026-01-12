import {
  Box,
  Flex,
  Button,
  Stack,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  PopoverFooter,
  Select,
  Input,
  Skeleton,
  Checkbox,
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { Document, Encoder } from 'flexsearch'
import { includes, intersection, throttle } from 'lodash'
import { ResponsesTableV2 } from './ResponsesTable/ResponsesTableV2'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BiFilter, BiHide, BiPlus, BiRefresh, BiTrash } from 'react-icons/bi'
import { useAdminForm } from '~features/admin-form/common/queries'
import {
  BasicField,
  DateString,
  FormFieldDto,
  FormResponseMode,
} from '~shared/types'
import InlineMessage from '~components/InlineMessage'
import { useStorageResponsesContext } from '../StorageResponsesContext'
import {
  DecryptedResponse,
  useDecryptedResponsesQuery,
  useInvalidateDecryptedResponses,
} from '../useDecryptedResponsesQuery'
import IconButton from '~components/IconButton'
import { DownloadButton } from './DownloadButton'
import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_REMINDERS_LABEL,
  MRF_RESPONSE_TIMESTAMP_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '~features/admin-form/responses/constants'
import {
  getPendingResponseAtString,
  getStatusFromWorkflowStatus,
} from '~features/admin-form/responses/common/utils/mrfSubmissionView'
import { DateRangePicker } from '~components/DateRangePicker'
import { DateRangeValue } from '~components/Calendar'

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
  onDelete,
  fields,
  index,
}: {
  filter: Filter
  onChange: (filter: Filter) => void
  onDelete: () => void
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
        placeholder="value"
      />
      <IconButton
        icon={<BiTrash color="red" />}
        variant="clear"
        onClick={onDelete}
        aria-label={'Delete filter'}
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
    <Popover
      placement="bottom-end"
      onClose={() => {
        setFilters(filters.filter((f) => f.value && f.value.trim() !== ''))
      }}
    >
      <PopoverTrigger>
        <Button
          leftIcon={<BiFilter />}
          variant="clear"
          borderColor="secondary.200"
          color="secondary.500"
        >
          {filters && filters.length > 0
            ? `${filters.length} filters`
            : 'Filter'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        maxHeight="30vh"
        overflowY="auto"
        bgColor="white"
        width="40rem"
      >
        <PopoverArrow />
        <PopoverBody>
          {!filters || filters.length === 0 ? (
            <InlineMessage fontSize="sm" alignItems="center">
              {fields.length > 0
                ? 'Add a new filter to find specific responses.'
                : 'No columns to filter. Show a column to continue.'}
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
                  onDelete={() =>
                    setFilters(filters.filter((_, i) => i !== index))
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
              colorScheme="primary"
              onClick={handleAddFilter}
              isDisabled={fields.length <= 0}
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
  const isNoSelectedFields = selectedFieldIds.length === 0
  const toggleAllText = selectedFieldIds.length === 0 ? 'Show all' : 'Hide all'
  const handleToggleAll = () => {
    if (selectedFieldIds.length === 0) {
      setSelectedFieldIds(fields.map((field) => field._id))
    } else {
      setSelectedFieldIds([])
    }
  }
  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button
          leftIcon={<BiHide />}
          variant="clear"
          borderColor="secondary.200"
          color="secondary.500"
        >
          {isNoSelectedFields ? 'Show columns' : 'Edit columns'}
        </Button>
      </PopoverTrigger>
      <PopoverContent bgColor="white" borderRadius="4px">
        <PopoverBody>
          <Stack overflowY="auto" maxHeight="30vh">
            {fields.map((field) => (
              <Checkbox
                key={field._id}
                isChecked={includes(selectedFieldIds, field._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFieldIds([...selectedFieldIds, field._id])
                  } else {
                    setSelectedFieldIds(
                      selectedFieldIds.filter((id) => id !== field._id),
                    )
                  }
                }}
              >
                {field.title}
              </Checkbox>
            ))}
          </Stack>
        </PopoverBody>
        <PopoverFooter display="flex" justifyContent="flex-end">
          <Button variant="clear" onClick={handleToggleAll}>
            {toggleAllText}
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
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
  handleRefresh,
  isRefreshing,
}: {
  formFields: { _id: string; title: string }[]
  selectedFieldIds: string[]
  setSelectedFieldIds: (fieldIds: string[]) => void
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  dateRange: DateRangeValue
  setDateRange: (dateRange: DateRangeValue) => void
  handleRefresh: () => void
  isRefreshing: boolean
}) => {
  return (
    <Flex justifyContent={'space-between'}>
      <Flex gap="0.5rem">
        <FieldFilter
          fields={formFields.filter((field) =>
            includes(selectedFieldIds, field._id),
          )}
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
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <IconButton
          isLoading={isRefreshing}
          icon={<BiRefresh />}
          variant="clear"
          borderColor="secondary.200"
          color="secondary.500"
          onClick={handleRefresh}
          aria-label={'Get latest responses'}
        />
        <DownloadButton />
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

const getValidFilters = (filters: Filter[]): Filter[] => {
  return filters.filter((filter) => filter.value.length > 0)
}

const filterDecryptedResponses = ({
  decryptedResponses,
  filters,
  searchIndex,
}: {
  decryptedResponses: DecryptedResponse[]
  filters: Filter[]
  searchIndex: Document
}) => {
  const validFilters = getValidFilters(filters)
  if (validFilters.length === 0 || !searchIndex) {
    return decryptedResponses
  }

  const eachFilterResponseIds = validFilters.map((filter) => {
    const searchResult = searchIndex.search(filter.value, {
      field: filter.fieldId,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredResponseIds = searchResult.flatMap(
      (result: any) => result.result,
    )
    return filteredResponseIds
  })
  const allFilteredResponseIds = intersection(...eachFilterResponseIds)
  return decryptedResponses.filter((response) =>
    includes(allFilteredResponseIds, response.refNo),
  )
}

const UnlockedResponsesV2 = () => {
  const { data: form, isLoading: isLoadingForm } = useAdminForm()
  const { secretKey, isLoading: isLoadingSecretKey } =
    useStorageResponsesContext()
  const { form_fields } = form ?? {}

  const isMrf = form?.responseMode === FormResponseMode.Multirespondent
  const essentialFields: {
    _id: string
    title: string
  }[] = [
      {
        _id: 'Response ID',
        title: 'Response ID',
      },
      {
        _id: MRF_RESPONSE_TIMESTAMP_LABEL,
        title: 'Response Timestamp',
      },
    ]
  const mrfFields: {
    _id: string
    title: string
  }[] = isMrf
      ? [
        {
          _id: MRF_WORKFLOW_STATUS_LABEL,
          title: 'Workflow Status',
        },
        {
          _id: MRF_PENDING_RESPONSE_AT_LABEL,
          title: 'Workflow Pending Step At',
        },
        {
          _id: MRF_REMINDERS_LABEL,
          title: 'Workflow Reminders',
        },
      ]
      : []

  const submissionMetaFields = [...essentialFields, ...mrfFields]
  const fieldsForDashboardView = filterFieldsForDashboardView(form_fields ?? [])
  const allDashboardFields = [
    ...submissionMetaFields,
    ...fieldsForDashboardView,
  ]

  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(
    allDashboardFields?.map((field) => field._id) ?? [],
  )
  const selectedFields = fieldsForDashboardView.filter((field) =>
    includes(selectedFieldIds, field._id),
  )
  const selectedSubmissionMetaFields = submissionMetaFields.filter((field) =>
    includes(selectedFieldIds, field._id),
  )

  const [filters, setFilters] = useState<Filter[]>([])
  const [dateRange, setDateRange] = useState<DateRangeValue>([null, null])

  // Use the cached query hook - decryption only happens once and results persist across navigation
  const { data: decryptedResponses = [], isFetching: isFetchingAndDecrypting } =
    useDecryptedResponsesQuery({
      formId: form?._id ?? '',
      secretKey: secretKey ?? '',
      startDate:
        dateRange && dateRange[0]
          ? dateRange[0]
            ? (format(dateRange[0], 'yyyy-MM-dd') as DateString)
            : undefined
          : undefined,
      endDate:
        dateRange && dateRange[1]
          ? dateRange[1]
            ? (format(dateRange[1], 'yyyy-MM-dd') as DateString)
            : undefined
          : undefined,
      enabled: !isLoadingForm && !isLoadingSecretKey && !!secretKey && !!form,
    })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchIndex = useMemo<any>(() => {
    if (!decryptedResponses.length || !allDashboardFields.length) return null

    const documentIndex = new Document({
      tokenize: 'reverse',
      encoder: new Encoder({
        normalize: true,
        dedupe: false,
        cache: true,
        include: {
          letter: true,
          number: true,
          symbol: false,
          punctuation: false,
          control: false,
          char: '',
        },
      }),
      index: allDashboardFields.map((field) => field._id),
    })

    decryptedResponses.forEach((response) => {
      // Build document from decrypted form fields
      const responseDocument = response.decryptedResponses.reduce<
        Record<string, string>
      >((acc, decryptedField) => {
        if (decryptedField._id && decryptedField.answer) {
          acc[decryptedField._id] = decryptedField.answer
        }
        return acc
      }, {})

      // Add metadata fields to the document for indexing
      const metadataDocument: Record<string, string> = {
        'Response ID': response.refNo,
        [MRF_RESPONSE_TIMESTAMP_LABEL]: response.submissionTime,
      }

      // Add MRF fields if available
      if (response.mrf?.workflowStatus) {
        metadataDocument[MRF_WORKFLOW_STATUS_LABEL] =
          getStatusFromWorkflowStatus(response.mrf.workflowStatus)
      }
      if (
        response.mrf?.workflowStatus &&
        response.mrf?.workflowCurrentStepNumber &&
        response.mrf?.workflowNumTotalSteps
      ) {
        metadataDocument[MRF_PENDING_RESPONSE_AT_LABEL] =
          getPendingResponseAtString({
            workflowStatus: response.mrf.workflowStatus,
            workflowCurrentStepNumber: response.mrf.workflowCurrentStepNumber,
            workflowNumTotalSteps: response.mrf.workflowNumTotalSteps,
          })
      }

      documentIndex.add({
        ...responseDocument,
        ...metadataDocument,
        id: response.refNo,
      })
    })

    return documentIndex
  }, [decryptedResponses, allDashboardFields])

  if (!secretKey || !form) return null

  const [filteredDecryptedResponses, setFilteredDecryptedResponses] =
    useState<DecryptedResponse[]>(decryptedResponses)

  const throttledSetFilteredDecryptedResponses = useCallback(
    throttle(
      ({
        filters,
        searchIndex,
        decryptedResponses,
      }: {
        filters: Filter[]
        searchIndex: Document
        decryptedResponses: DecryptedResponse[]
      }) => {
        setFilteredDecryptedResponses(
          filterDecryptedResponses({
            decryptedResponses,
            filters,
            searchIndex,
          }),
        )
      },
      500,
    ),
    [],
  )

  useEffect(() => {
    throttledSetFilteredDecryptedResponses({
      decryptedResponses,
      filters,
      searchIndex,
    })
  }, [decryptedResponses, filters, searchIndex])

  // Hook to invalidate cache (e.g., to fetch latest submissions)
  const { invalidate } = useInvalidateDecryptedResponses(form._id)

  return (
    <Stack height="100%" width="100%" gap="0.5rem" flexDir="column">
      <FilterBar
        formFields={allDashboardFields ?? []}
        selectedFieldIds={selectedFieldIds}
        setSelectedFieldIds={setSelectedFieldIds}
        filters={filters}
        setFilters={setFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
        handleRefresh={invalidate}
        isRefreshing={isFetchingAndDecrypting}
      />
      <Box overflow="auto" maxWidth="100%" flex={1}>
        {isFetchingAndDecrypting ? (
          <Skeleton height="2.5rem" />
        ) : (
          <ResponsesTableV2
            form={form}
            selectedSubmissionMetaFields={selectedSubmissionMetaFields}
            selectedFields={selectedFields}
            decryptedResponses={filteredDecryptedResponses}
          />
        )}
      </Box>
    </Stack>
  )
}

export default UnlockedResponsesV2
