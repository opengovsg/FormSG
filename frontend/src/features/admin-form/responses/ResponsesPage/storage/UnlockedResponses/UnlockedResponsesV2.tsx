import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BiFilter,
  BiHide,
  BiPlus,
  BiRefresh,
  BiSolidMagicWand,
  BiTrash,
} from 'react-icons/bi'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
  Select,
  Skeleton,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { Document, Encoder } from 'flexsearch'
import { includes, intersection, throttle } from 'lodash'

import {
  BasicField,
  DateString,
  FormFieldDto,
  FormResponseMode,
} from '~shared/types'

import { useMdComponents } from '~hooks/useMdComponents'
import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import IconButton from '~components/IconButton'
import InlineMessage from '~components/InlineMessage'
import { MarkdownText } from '~components/MarkdownText/MarkdownText'
import Tooltip from '~components/Tooltip'

import { InterpretDataResponse } from '~features/admin-form/assistance/AssistanceService'
import { useInterpretDataMutation } from '~features/admin-form/assistance/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'
import {
  getPendingResponseAtString,
  getStatusFromWorkflowStatus,
} from '~features/admin-form/responses/common/utils/mrfSubmissionView'
import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_REMINDERS_LABEL,
  MRF_RESPONSE_TIMESTAMP_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '~features/admin-form/responses/constants'

import { useStorageResponsesContext } from '../StorageResponsesContext'
import {
  DecryptedResponse,
  useDecryptedResponsesQuery,
  useInvalidateDecryptedResponses,
} from '../useDecryptedResponsesQuery'

import { ResponsesTableV2 } from './ResponsesTable/ResponsesTableV2'
import { DownloadButton } from './DownloadButton'

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
  availableFields,
  index,
}: {
  filter: Filter
  onChange: (filter: Filter) => void
  onDelete: () => void
  fields: {
    _id: string
    title: string
  }[]
  availableFields: {
    _id: string
    title: string
  }[]
  index: number
}) => {
  const currentField = fields.find((f) => f._id === filter.fieldId)
  const dropdownFields = currentField
    ? [
      currentField,
      ...availableFields.filter((f) => f._id !== currentField._id),
    ]
    : availableFields

  return (
    <Flex gap={2} alignItems="center">
      <Text width="12rem">{index === 0 ? 'Where' : 'And'}</Text>
      <Select
        value={filter.fieldId}
        onChange={(e) => onChange({ ...filter, fieldId: e.target.value })}
      >
        {dropdownFields.map((field) => (
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
  const getAvailableFields = (excludeFieldId?: string) => {
    const filteredFieldIds = filters
      .map((f) => f.fieldId)
      .filter((id) => id !== excludeFieldId)
    return fields.filter((field) => !filteredFieldIds.includes(field._id))
  }

  const availableFieldsForNewFilter = getAvailableFields()
  const canAddMoreFilters = availableFieldsForNewFilter.length > 0

  const handleAddFilter = () => {
    if (!canAddMoreFilters) return
    // Auto-select the first available field that doesn't have a filter
    const nextAvailableField = availableFieldsForNewFilter[0]
    setFilters([
      ...filters,
      {
        fieldId: nextAvailableField._id,
        operator: FilterOperator.Contains,
        value: '',
      },
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
                  availableFields={getAvailableFields(filter.fieldId)}
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
              isDisabled={!canAddMoreFilters}
            >
              Add filter
            </Button>
            {!canAddMoreFilters && filters.length > 0 && (
              <Text fontSize="sm" color="secondary.400" alignSelf="center">
                All columns have filters
              </Text>
            )}
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

const InterpretButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Tooltip placement="top" label="Talk to your data">
      <Button
        onClick={onClick}
        leftIcon={<BiSolidMagicWand />}
        variant="clear"
        borderColor="secondary.200"
        color="secondary.500"
      >
        Interpret
      </Button>
    </Tooltip>
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
  onClickInterpret,
}: {
  formFields: { _id: string; title: string }[]
  selectedFieldIds: string[]
  setSelectedFieldIds: (fieldIds: string[]) => void
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  dateRange: [DateString | null, DateString | null]
  setDateRange: (dateRange: [DateString | null, DateString | null]) => void
  handleRefresh: () => void
  isRefreshing: boolean
  onClickInterpret: () => void
}) => {
  return (
    <Flex justifyContent={'space-between'}>
      <Flex gap="0.5rem">
        <DateRangePicker
          value={dateRangePickerHelper.dateStringToDatePickerValue(dateRange)}
          onChange={(nextDateRange) =>
            setDateRange(
              dateRangePickerHelper.datePickerValueToDateString(nextDateRange),
            )
          }
        />
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
        <InterpretButton onClick={onClickInterpret} />
        <Tooltip placement="top" label="Get latest responses">
          <Button
            isLoading={isRefreshing}
            leftIcon={<BiRefresh />}
            variant="clear"
            borderColor="secondary.200"
            color="secondary.500"
            onClick={handleRefresh}
            aria-label={'Get latest responses'}
          >
            Refresh
          </Button>
        </Tooltip>
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
    const filteredResponseIds = searchResult.flatMap(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result: any) => result.result,
    )
    return filteredResponseIds
  })
  const allFilteredResponseIds = intersection(...eachFilterResponseIds)
  return decryptedResponses.filter((response) =>
    includes(allFilteredResponseIds, response.refNo),
  )
}

interface InterpretResult {
  answer: string
  explanation: string
}

const InterpretBox = ({
  onAsk,
  isLoading,
  result,
}: {
  onAsk: (textQuestion: string) => void
  isLoading: boolean
  result?: InterpretResult
}) => {
  const [question, setQuestion] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-1',
        color: 'secondary.700',
      },
      list: {
        color: 'secondary.700',
        marginInlineStart: '1.25em',
      },
    },
  })

  return (
    <Stack
      width="100%"
      dropShadow="2px"
      borderRadius="4px"
      border="1px solid"
      borderColor="secondary.200"
      p="1rem"
      gap="0.5rem"
    >
      <Textarea
        placeholder="Ask a question about your data (e.g., 'How many responses selected option A?', 'Summarize the feedback')"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        isReadOnly={isLoading}
      />
      <Flex justifyContent="flex-end">
        <Button
          isLoading={isLoading}
          onClick={() => {
            setShowExplanation(false)
            onAsk(question)
          }}
          isDisabled={!question.trim()}
        >
          Ask
        </Button>
      </Flex>
      {result?.answer && (
        <Box mt="0.5rem" p="1rem" bg="primary.100" borderRadius="4px">
          <Flex justifyContent="space-between" alignItems="center" mb="0.5rem">
            <Text fontWeight="semibold">Answer:</Text>
            {result?.explanation && (
              <Button
                variant="link"
                size="sm"
                color="primary.500"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                {showExplanation ? 'Hide explanation' : 'Show explanation'}
              </Button>
            )}
          </Flex>
          <Text textStyle="body-1" color="secondary.700">
            {result.answer}
          </Text>
        </Box>
      )}
      {result?.explanation && showExplanation && (
        <Box mt="0.5rem" p="1rem" bg="neutral.100" borderRadius="4px">
          <Text fontWeight="semibold" mb="0.5rem">
            Explanation:
          </Text>
          <Box>
            <MarkdownText multilineBreaks components={mdComponents}>
              {result.explanation}
            </MarkdownText>
          </Box>
        </Box>
      )}
    </Stack>
  )
}

const MAX_RESPONSES_COUNT_FOR_DECRYPT = 5

const UnlockedResponsesV2 = () => {
  const { data: form, isLoading: isLoadingForm } = useAdminForm()
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
  const { dateRange, setDateRange, dateRangeResponsesCount } =
    useStorageResponsesContext()

  // Use the cached query hook - decryption only happens once and results persist across navigation
  const { data: decryptedResponses = [], isFetching: isFetchingAndDecrypting } =
    useDecryptedResponsesQuery({
      dateRange,
      enabled:
        !!dateRangeResponsesCount &&
        dateRangeResponsesCount <= MAX_RESPONSES_COUNT_FOR_DECRYPT,
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
  const { invalidate } = useInvalidateDecryptedResponses(form?._id ?? '')

  const [isInterpretOpen, setIsInterpretOpen] = useState(false)
  const [interpretResult, setInterpretResult] = useState<
    InterpretResult | undefined
  >()

  const interpretDataMutation = useInterpretDataMutation(form?._id ?? '')

  const transformResponsesToInterpretFormat = useCallback(
    (responses: DecryptedResponse[]): InterpretDataResponse[] => {
      return responses.map((response) => ({
        refNo: response.refNo,
        submissionTime: response.submissionTime,
        fields: response.decryptedResponses
          .filter((field) => field._id && field.question)
          .map((field) => ({
            fieldId: field._id,
            question: field.question,
            answer: field.answer || '',
          })),
      }))
    },
    [],
  )

  const onAsk = useCallback(
    (question: string) => {
      if (!question.trim()) return

      setInterpretResult(undefined)
      const responsesForApi = transformResponsesToInterpretFormat(
        filteredDecryptedResponses,
      )

      interpretDataMutation.mutate(
        { question, responses: responsesForApi },
        {
          onSuccess: (data) => {
            setInterpretResult({
              answer: data.answer,
              explanation: data.explanation,
            })
          },
        },
      )
    },
    [
      filteredDecryptedResponses,
      interpretDataMutation,
      transformResponsesToInterpretFormat,
    ],
  )

  // Handler to hide a column from the table header menu
  const handleHideColumn = useCallback(
    (fieldId: string) => {
      setSelectedFieldIds(selectedFieldIds.filter((id) => id !== fieldId))
    },
    [selectedFieldIds],
  )

  // Handler to add a filter from the table header menu
  const handleColumnAddFilter = useCallback(
    (fieldId: string, value: string) => {
      // Check if filter already exists for this field and update it
      const existingFilterIndex = filters.findIndex(
        (f) => f.fieldId === fieldId,
      )
      if (existingFilterIndex >= 0) {
        const updatedFilters = [...filters]
        updatedFilters[existingFilterIndex] = {
          ...updatedFilters[existingFilterIndex],
          value,
        }
        setFilters(updatedFilters)
      } else {
        setFilters([
          ...filters,
          { fieldId, operator: FilterOperator.Contains, value },
        ])
      }
    },
    [filters],
  )

  // Handler to remove a filter from the table header menu
  const handleRemoveFilter = useCallback(
    (fieldId: string) => {
      setFilters(filters.filter((f) => f.fieldId !== fieldId))
    },
    [filters],
  )

  if (!form) return null

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
        onClickInterpret={() => setIsInterpretOpen(!isInterpretOpen)}
      />
      {isInterpretOpen && (
        <InterpretBox
          onAsk={onAsk}
          isLoading={interpretDataMutation.isLoading}
          result={interpretResult}
        />
      )}
      <Box overflow="auto" maxWidth="100%" flex={1}>
        {isFetchingAndDecrypting ? (
          <Skeleton height="2.5rem" />
        ) : (
          <ResponsesTableV2
            isResponseLimitExceeded={
              !!dateRangeResponsesCount &&
              dateRangeResponsesCount > MAX_RESPONSES_COUNT_FOR_DECRYPT
            }
            form={form}
            selectedSubmissionMetaFields={selectedSubmissionMetaFields}
            selectedFields={selectedFields}
            decryptedResponses={filteredDecryptedResponses}
            onHideColumn={handleHideColumn}
            onAddFilter={handleColumnAddFilter}
            onRemoveFilter={handleRemoveFilter}
            filters={filters.map((f) => ({
              fieldId: f.fieldId,
              value: f.value,
            }))}
          />
        )}
      </Box>
    </Stack>
  )
}

export default UnlockedResponsesV2
