import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BiChevronDown,
  BiChevronUp,
  BiFilter,
  BiHide,
  BiPlus,
  BiRefresh,
  BiSolidMagicWand,
  BiTrash,
  BiX,
} from 'react-icons/bi'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
  useDisclosure,
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
import { CopyButton } from '~templates/CopyButton/CopyButton'
import IconButton from '~components/IconButton'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'
import { MarkdownText } from '~components/MarkdownText/MarkdownText'
import Pagination from '~components/Pagination'
import Tooltip from '~components/Tooltip'

import {
  getAutoSummaryStreaming,
  InterpretDataResponse,
  interpretDataStreaming,
  SuggestedChart,
  SuggestedFilter,
} from '~features/admin-form/assistance/AssistanceService'
import {
  useAnalyzeQuestionMutation,
  useInterpretDataMutation,
  useSuggestedQuestionsMutation,
} from '~features/admin-form/assistance/mutations'
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

import { GenericChart } from '../../../ChartsPage/UnlockedCharts/components/GenericChart'
import { AnomalyAlerts, AutoSummary, HeroStats, QuickCharts, TrendAlerts } from '../../../components/InsightsPanel'
import { useStorageResponsesContext } from '../StorageResponsesContext'
import {
  DecryptedResponse,
  useDecryptedResponsesQuery,
  useInvalidateDecryptedResponses,
} from '../useDecryptedResponsesQuery'

import { ResponsesTableV2 } from './ResponsesTable/ResponsesTableV2'
import { DownloadButton } from './DownloadButton'
import { usePageSearchParams } from './hooks/usePageSearchParams'

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
    <Tooltip placement="top" label="Use AI to understand your data">
      <Button
        onClick={onClick}
        leftIcon={<BiSolidMagicWand />}
        variant="clear"
        borderColor="secondary.200"
        color="secondary.500"
      >
        Analyse
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
  suggestedCharts?: SuggestedChart[]
  suggestedFollowUps?: string[]
}

type InterpretStep = 'idle' | 'analyzing' | 'interpreting'

// Loading status messages for cycling animation
const LOADING_MESSAGES = [
  'Analyzing your question...',
  'Identifying relevant data...',
  'Generating insights...',
  'Creating visualizations...',
]

// Skeleton loading component for interpret results
const InterpretLoadingSkeleton = () => {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box p={4} bg="primary.50" borderRadius="md" border="1px solid" borderColor="primary.100">
      <Flex alignItems="center" gap={2} mb={4}>
        <Box as="span" display="inline-flex" gap="3px" alignItems="center">
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              w="5px"
              h="5px"
              borderRadius="full"
              bg="primary.500"
              animation={`bounce 1.4s ease-in-out ${i * 0.16}s infinite`}
              sx={{
                '@keyframes bounce': {
                  '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.5 },
                  '40%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            />
          ))}
        </Box>
        <Text fontSize="sm" color="primary.600" fontWeight="medium">
          {LOADING_MESSAGES[messageIndex]}
        </Text>
      </Flex>
      {/* Skeleton for chart area */}
      <Skeleton height="120px" borderRadius="md" mb={4} />
      {/* Skeleton for answer text */}
      <Stack spacing={2}>
        <Skeleton height="0.875rem" width="100%" borderRadius="sm" />
        <Skeleton height="0.875rem" width="85%" borderRadius="sm" />
        <Skeleton height="0.875rem" width="70%" borderRadius="sm" />
      </Stack>
    </Box>
  )
}

const InterpretBox = ({
  onAsk,
  currentStep,
  result,
  analysisReasoning,
  analysisChanges,
  suggestedQuestions,
  isLoadingSuggestedQuestions,
  onRefreshSuggestedQuestions,
  mentionedResponseIds,
  filteredResponseIds,
  decryptedResponsesCount,
  onClearMentionedFilter,
  askedQuestion,
  setAskedQuestion,
  streamingAnswer,
  conversationTurnCount,
  onClearConversation,
}: {
  onAsk: (textQuestion: string) => void
  currentStep: InterpretStep
  result?: InterpretResult
  analysisReasoning?: string
  analysisChanges?: {
    addedFieldTitles: string[]
    removedFieldTitles: string[]
    filterChanges: Array<{
      type: 'added' | 'removed' | 'updated'
      fieldTitle: string
      value?: string
      from?: string
      to?: string
    }>
  }
  suggestedQuestions?: string[]
  isLoadingSuggestedQuestions?: boolean
  onRefreshSuggestedQuestions?: () => void
  mentionedResponseIds?: string[]
  decryptedResponsesCount?: number
  filteredResponseIds?: string[]
  onClearMentionedFilter?: () => void
  askedQuestion?: string
  setAskedQuestion: (question: string | undefined) => void
  streamingAnswer?: string
  conversationTurnCount?: number
  onClearConversation?: () => void
}) => {
  const [question, setQuestion] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false)
  const isLoading =
    currentStep === 'analyzing' || currentStep === 'interpreting'
  const isInterpreting = currentStep === 'interpreting'

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

  const getLoadingText = () => {
    switch (currentStep) {
      case 'analyzing':
        return 'Applying relevant filters & columns...'
      case 'interpreting':
        return 'Generating insights...'
      default:
        return 'Ask'
    }
  }

  return (
    <Stack
      width="100%"
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="neutral.200"
      p={5}
      spacing={4}
    >
      {/* Question Input Section */}
      <Box>
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <Text fontSize="sm" fontWeight="medium" color="secondary.700">
            Ask a question
            {conversationTurnCount !== undefined && conversationTurnCount > 0 && (
              <Text
                as="span"
                fontSize="xs"
                fontWeight="normal"
                color="secondary.400"
                ml={2}
              >
                ({conversationTurnCount} previous {conversationTurnCount === 1 ? 'question' : 'questions'})
              </Text>
            )}
          </Text>
          {onClearConversation && conversationTurnCount !== undefined && conversationTurnCount > 0 && (
            <Button
              variant="link"
              size="xs"
              color="secondary.400"
              fontWeight="normal"
              onClick={onClearConversation}
              isDisabled={isLoading}
              _hover={{ color: 'secondary.600' }}
            >
              New conversation
            </Button>
          )}
        </Flex>
        <Textarea
          placeholder="e.g., What are the most common complaints?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          isDisabled={isLoading}
          size="sm"
          rows={3}
          resize="none"
          bg={isLoading ? 'neutral.100' : 'white'}
          borderRadius="md"
          borderColor={isLoading ? 'neutral.200' : 'neutral.300'}
          opacity={isLoading ? 0.7 : 1}
          cursor={isLoading ? 'not-allowed' : 'text'}
          _hover={{ borderColor: isLoading ? 'neutral.200' : 'neutral.400' }}
          _focus={{ borderColor: 'primary.500', boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)' }}
        />
      </Box>

      {/* Suggested Questions - hidden after first question is asked */}
      {!hasAskedQuestion &&
        (isLoadingSuggestedQuestions ||
          (suggestedQuestions && suggestedQuestions.length > 0)) && (
          <Box>
            <Flex justifyContent="space-between" alignItems="center" mb={2}>
              <Text fontSize="xs" fontWeight="medium" color="secondary.500">
                Suggested questions
              </Text>
              {onRefreshSuggestedQuestions && (
                <Button
                  variant="link"
                  size="xs"
                  color="secondary.400"
                  fontWeight="normal"
                  isLoading={isLoadingSuggestedQuestions}
                  onClick={onRefreshSuggestedQuestions}
                  isDisabled={isLoadingSuggestedQuestions}
                  _hover={{ color: 'secondary.600' }}
                >
                  Refresh
                </Button>
              )}
            </Flex>
            {isLoadingSuggestedQuestions ? (
              <Stack spacing={2}>
                <Skeleton height="2rem" borderRadius="md" />
                <Skeleton height="2rem" borderRadius="md" />
              </Stack>
            ) : (
              suggestedQuestions &&
              suggestedQuestions.length > 0 && (
                <Stack spacing={2}>
                  {suggestedQuestions.map((q, idx) => (
                    <Button
                      key={`sq-${idx}`}
                      size="sm"
                      variant="outline"
                      borderColor="neutral.200"
                      color="secondary.600"
                      fontWeight="normal"
                      justifyContent="flex-start"
                      textAlign="left"
                      whiteSpace="normal"
                      height="auto"
                      py={2}
                      px={3}
                      onClick={() => {
                        setAskedQuestion(q)
                        setQuestion('')
                        setHasAskedQuestion(true)
                        onAsk(q)
                      }}
                      isDisabled={isLoading}
                      opacity={isLoading ? 0.6 : 1}
                      _hover={{ bg: 'neutral.50', borderColor: 'neutral.300' }}
                    >
                      {q}
                    </Button>
                  ))}
                </Stack>
              )
            )}
          </Box>
        )}

      {/* Ask Button */}
      <Flex justifyContent="flex-end" alignItems="center" gap={3}>
        {isLoading && (
          <Text fontSize="sm" color="secondary.400">
            {getLoadingText()}
          </Text>
        )}
        <Button
          colorScheme="primary"
          size="sm"
          isLoading={isLoading}
          onClick={() => {
            setShowExplanation(false)
            setShowReasoning(false)
            setHasAskedQuestion(true)
            setAskedQuestion(question)
            onAsk(question)
            setQuestion('')
          }}
          isDisabled={!question.trim()}
        >
          Ask
        </Button>
      </Flex>
      {/* Analysis Reasoning */}
      {analysisReasoning && (
        <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.100">
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" fontWeight="medium" color="blue.700">
              Applied filters & columns
            </Text>
            <Button
              variant="link"
              size="xs"
              color="blue.600"
              fontWeight="normal"
              onClick={() => setShowReasoning(!showReasoning)}
              _hover={{ color: 'blue.700' }}
            >
              {showReasoning ? 'Hide' : 'Details'}
            </Button>
          </Flex>
          {showReasoning && (
            <Stack fontSize="sm" color="blue.700" mt="0.5rem" spacing="0.5rem">
              <Text>{analysisReasoning}</Text>
              {analysisChanges &&
                (analysisChanges.addedFieldTitles.length > 0 ||
                  analysisChanges.removedFieldTitles.length > 0 ||
                  analysisChanges.filterChanges.length > 0) && (
                  <Box>
                    {(analysisChanges.addedFieldTitles.length > 0 ||
                      analysisChanges.removedFieldTitles.length > 0) && (
                      <Box>
                        <Text fontWeight="semibold">Column changes:</Text>
                        {analysisChanges.addedFieldTitles.length > 0 && (
                          <Text>
                            Showing:{' '}
                            {analysisChanges.addedFieldTitles.join(', ')}
                          </Text>
                        )}
                        {analysisChanges.removedFieldTitles.length > 0 && (
                          <Text>
                            Hidden:{' '}
                            {analysisChanges.removedFieldTitles.join(', ')}
                          </Text>
                        )}
                      </Box>
                    )}
                    {analysisChanges.filterChanges.length > 0 && (
                      <Box mt="0.5rem">
                        <Text fontWeight="semibold">
                          Filter changes (AND only, max 1 per column):
                        </Text>
                        <Stack mt="0.25rem" spacing="0.25rem">
                          {analysisChanges.filterChanges.map((c, idx) => {
                            if (c.type === 'added') {
                              return (
                                <Text key={`fc-${idx}`}>
                                  + {c.fieldTitle} contains "{c.value}"
                                </Text>
                              )
                            }
                            if (c.type === 'removed') {
                              return (
                                <Text key={`fc-${idx}`}>
                                  − {c.fieldTitle} contains "{c.value}"
                                </Text>
                              )
                            }
                            return (
                              <Text key={`fc-${idx}`}>
                                ~ {c.fieldTitle} contains "{c.from}" → "{c.to}"
                              </Text>
                            )
                          })}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}
            </Stack>
          )}
        </Box>
      )}
      {(() => {
        // Only show the notification if mentionedResponseIds doesn't contain all filtered responses
        if (!mentionedResponseIds || mentionedResponseIds.length === 0) {
          return null
        }

        // Check if mentionedResponseIds contains all filtered responses
        if (mentionedResponseIds.length === decryptedResponsesCount) {
          return null
        }

        return (
          <Box p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.100">
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize="sm" fontWeight="medium" color="green.700">
                Showing {mentionedResponseIds.length} response
                {mentionedResponseIds.length !== 1 ? 's' : ''} mentioned
              </Text>
              {onClearMentionedFilter && (
                <Button
                  variant="link"
                  size="xs"
                  color="green.600"
                  fontWeight="normal"
                  onClick={onClearMentionedFilter}
                  _hover={{ color: 'green.700' }}
                >
                  Show all
                </Button>
              )}
            </Flex>
          </Box>
        )
      })()}
      {/* Show skeleton loading when analyzing or interpreting data */}
      {isLoading && (
        <Box>
          {/* Show the question being processed */}
          {askedQuestion && (
            <Box mb={3} p={4} bg="primary.50" borderRadius="md" border="1px solid" borderColor="primary.100">
              <Text fontSize="xs" fontWeight="medium" color="primary.500" mb={1}>
                Question
              </Text>
              <Text fontSize="sm" color="secondary.700" fontStyle="italic">
                "{askedQuestion}"
              </Text>
            </Box>
          )}
          {/* Show streaming answer if available */}
          {streamingAnswer ? (
            <Box p={4} bg="primary.50" borderRadius="md" border="1px solid" borderColor="primary.100">
              <Flex alignItems="center" gap={2} mb={3}>
                <Box as="span" display="inline-flex" gap="3px" alignItems="center">
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      w="5px"
                      h="5px"
                      borderRadius="full"
                      bg="primary.500"
                      animation={`bounce 1.4s ease-in-out ${i * 0.16}s infinite`}
                      sx={{
                        '@keyframes bounce': {
                          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.5 },
                          '40%': { transform: 'scale(1)', opacity: 1 },
                        },
                      }}
                    />
                  ))}
                </Box>
                <Text fontSize="sm" color="primary.600" fontWeight="medium">
                  Generating answer...
                </Text>
              </Flex>
              <Text fontSize="sm" color="secondary.700" lineHeight="tall">
                {streamingAnswer}
                <Box
                  as="span"
                  display="inline-block"
                  w="2px"
                  h="1em"
                  bg="primary.500"
                  ml="2px"
                  animation="blink 1s step-end infinite"
                  sx={{
                    '@keyframes blink': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0 },
                    },
                  }}
                />
              </Text>
            </Box>
          ) : (
            <InterpretLoadingSkeleton />
          )}
        </Box>
      )}
      {/* Answer Results */}
      {result?.answer && !isLoading && (
        <Box p={4} bg="primary.50" borderRadius="md" border="1px solid" borderColor="primary.100">
          {/* Display the question that was asked */}
          {askedQuestion && (
            <Box mb={3} pb={3} borderBottom="1px solid" borderColor="primary.100">
              <Text fontSize="xs" fontWeight="medium" color="primary.500" mb={1}>
                Question
              </Text>
              <Text fontSize="sm" color="secondary.700" fontStyle="italic">
                "{askedQuestion}"
              </Text>
            </Box>
          )}
          <Flex justifyContent="space-between" alignItems="center" mb={3}>
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color="primary.700">
                Answer
              </Text>
              {decryptedResponsesCount !== undefined && (
                <Text fontSize="xs" color="primary.500" fontWeight="normal">
                  (analyzed {decryptedResponsesCount} responses)
                </Text>
              )}
            </HStack>
            <HStack spacing={2}>
              <Tooltip label="Copy answer">
                <Box>
                  <CopyButton
                    stringToCopy={
                      result.explanation
                        ? `${result.answer}\n\n${result.explanation}`
                        : result.answer
                    }
                    aria-label="Copy answer to clipboard"
                  />
                </Box>
              </Tooltip>
              {result?.explanation && (
                <Button
                  variant="link"
                  size="xs"
                  color="primary.600"
                  fontWeight="normal"
                  onClick={() => setShowExplanation(!showExplanation)}
                  _hover={{ color: 'primary.700' }}
                >
                  {showExplanation ? 'Hide details' : 'Show details'}
                </Button>
              )}
            </HStack>
          </Flex>

          {/* Charts */}
          {result.suggestedCharts &&
            result.suggestedCharts.length > 0 &&
            result.suggestedCharts.map((chart, index) => {
              if (!chart.data || chart.data.length === 0) {
                return null
              }
              return (
                <Box key={`chart-${index}`} mb={4} bg="white" borderRadius="md" p={3}>
                  <GenericChart
                    title={chart.title}
                    chartType={chart.chartType}
                    data={chart.data}
                  />
                </Box>
              )
            })}

          {/* Answer Text */}
          <Text fontSize="sm" color="secondary.700" lineHeight="tall">
            {result.answer}
          </Text>

          {/* Explanation */}
          {result?.explanation && showExplanation && (
            <Box mt={4} pt={4} borderTop="1px solid" borderColor="primary.100">
              <Text
                fontSize="xs"
                fontWeight="medium"
                color="primary.600"
                mb={2}
              >
                Detailed explanation
              </Text>
              <Box fontSize="sm" color="secondary.600">
                <MarkdownText multilineBreaks components={mdComponents}>
                  {result.explanation}
                </MarkdownText>
              </Box>
            </Box>
          )}

          {/* Follow-up Questions */}
          {result?.suggestedFollowUps && result.suggestedFollowUps.length > 0 && (
            <Box mt={4} pt={4} borderTop="1px solid" borderColor="primary.100">
              <Text fontSize="xs" fontWeight="medium" color="primary.600" mb={2}>
                Follow-up questions
              </Text>
              <Stack spacing={2}>
                {result.suggestedFollowUps.map((followUp, idx) => (
                  <Button
                    key={`followup-${idx}`}
                    size="sm"
                    variant="outline"
                    borderColor="primary.200"
                    color="primary.600"
                    fontWeight="normal"
                    justifyContent="flex-start"
                    textAlign="left"
                    whiteSpace="normal"
                    height="auto"
                    py={2}
                    px={3}
                    bg="white"
                    _hover={{ bg: 'primary.50', borderColor: 'primary.300' }}
                    isDisabled={currentStep !== 'idle'}
                    opacity={currentStep !== 'idle' ? 0.6 : 1}
                    onClick={() => {
                      setAskedQuestion(followUp)
                      setQuestion('')
                      onAsk(followUp)
                    }}
                  >
                    {followUp}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      )}
    </Stack>
  )
}

const MAX_RESPONSES_COUNT_FOR_DECRYPT = 1000

const UnlockedResponsesV2 = () => {
  const { data: form } = useAdminForm()
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

  // URL persistence for filters
  const {
    filters: [urlFilters, setUrlFilters],
  } = usePageSearchParams()

  // Initialize filters from URL, sync changes back
  const [filters, setFiltersState] = useState<Filter[]>(() =>
    urlFilters.map((f) => ({
      fieldId: f.fieldId,
      operator: f.operator as FilterOperator,
      value: f.value,
    })),
  )

  // Wrapper to sync filter changes to URL
  const setFilters = useCallback(
    (newFilters: Filter[] | ((prev: Filter[]) => Filter[])) => {
      setFiltersState((prev) => {
        const resolved =
          typeof newFilters === 'function' ? newFilters(prev) : newFilters
        // Sync to URL
        setUrlFilters(
          resolved.map((f) => ({
            fieldId: f.fieldId,
            operator: f.operator,
            value: f.value,
          })),
        )
        return resolved
      })
    },
    [setUrlFilters],
  )

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
  const [mentionedResponseIds, setMentionedResponseIds] = useState<
    string[] | undefined
  >()

  const throttledSetFilteredDecryptedResponses = useCallback(
    throttle(
      ({
        filters,
        searchIndex,
        decryptedResponses,
        mentionedResponseIds,
      }: {
        filters: Filter[]
        searchIndex: Document
        decryptedResponses: DecryptedResponse[]
        mentionedResponseIds: string[]
      }) => {
        let filteredResponses = filterDecryptedResponses({
          decryptedResponses,
          filters,
          searchIndex,
        })

        if (mentionedResponseIds.length > 0) {
          filteredResponses = filteredResponses?.filter((r) =>
            mentionedResponseIds.includes(String(r.refNo)),
          )
        }
        setFilteredDecryptedResponses(filteredResponses)
      },
      500,
    ),
    [],
  )

  // Apply filters from search and field filters
  useEffect(() => {
    throttledSetFilteredDecryptedResponses({
      filters,
      searchIndex,
      decryptedResponses,
      mentionedResponseIds: mentionedResponseIds ?? [],
    })
  }, [decryptedResponses, filters, searchIndex, mentionedResponseIds])

  // Hook to invalidate cache (e.g., to fetch latest submissions)
  const { invalidate } = useInvalidateDecryptedResponses(form?._id ?? '')

  const [isInterpretOpen, setIsInterpretOpen] = useState(false)
  const [isTableExpanded, setIsTableExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const [interpretResult, setInterpretResult] = useState<
    InterpretResult | undefined
  >()
  const [interpretStep, setInterpretStep] = useState<InterpretStep>('idle')
  const [askedQuestion, setAskedQuestion] = useState<string | undefined>()
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ question: string; answer: string }>
  >([])
  const [streamingAnswer, setStreamingAnswer] = useState<string>('')
  const [useStreaming] = useState(true)
  const [analysisReasoning, setAnalysisReasoning] = useState<
    string | undefined
  >()
  const [analysisChanges, setAnalysisChanges] = useState<
    | {
        addedFieldTitles: string[]
        removedFieldTitles: string[]
        filterChanges: Array<{
          type: 'added' | 'removed' | 'updated'
          fieldTitle: string
          value?: string
          from?: string
          to?: string
        }>
      }
    | undefined
  >()

  const analyzeQuestionMutation = useAnalyzeQuestionMutation(form?._id ?? '')
  const interpretDataMutation = useInterpretDataMutation(form?._id ?? '')
  const suggestedQuestionsMutation = useSuggestedQuestionsMutation(
    form?._id ?? '',
  )
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [autoSummary, setAutoSummary] = useState<{
    summary: string | null
    keyFindings: string[]
    suggestedQuestions: string[]
  }>({ summary: null, keyFindings: [], suggestedQuestions: [] })
  const [streamingSummary, setStreamingSummary] = useState<string>('')
  const [isStreamingSummary, setIsStreamingSummary] = useState(false)
  // Track if auto-fetch has been attempted to prevent infinite retry loops on error
  const hasAttemptedAutoFetch = useRef(false)

  // Track what date range and response count the current summary is based on
  const [summaryScope, setSummaryScope] = useState<{
    dateRange: [DateString | null, DateString | null]
    responseCount: number
  } | null>(null)

  // Cache responses used for insights (trends, anomalies, summary) to keep them consistent
  const [insightsResponses, setInsightsResponses] = useState<DecryptedResponse[]>([])

  // State for AI filter confirmation dialog
  const [pendingAiFilters, setPendingAiFilters] = useState<Filter[] | null>(
    null,
  )
  const {
    isOpen: isFilterConfirmOpen,
    onOpen: onFilterConfirmOpen,
    onClose: onFilterConfirmClose,
  } = useDisclosure()

  // State for date range regeneration confirmation
  const {
    isOpen: isDateRangeConfirmOpen,
    onOpen: onDateRangeConfirmOpen,
    onClose: onDateRangeConfirmClose,
  } = useDisclosure()

  const transformResponsesToInterpretFormat = useCallback(
    (
      responses: DecryptedResponse[],
      relevantFieldIds?: string[],
    ): InterpretDataResponse[] => {
      return responses.map((response) => ({
        refNo: response.refNo,
        submissionTime: response.submissionTime,
        fields: response.decryptedResponses
          .filter((field) => {
            // Must have fieldId
            if (!field._id) return false
            // If relevantFieldIds provided, only include those fields
            if (relevantFieldIds && relevantFieldIds.length > 0) {
              return relevantFieldIds.includes(field._id)
            }
            return true
          })
          .map((field) => ({
            fieldId: field._id,
            answer: field.answer || '',
          })),
      }))
    },
    [],
  )

  // Apply AI-suggested filters to the responses
  const applyAiFilters = useCallback(
    (
      responses: DecryptedResponse[],
      suggestedFilters: SuggestedFilter[],
    ): DecryptedResponse[] => {
      if (!suggestedFilters || suggestedFilters.length === 0) {
        return responses
      }

      return responses.filter((response) => {
        return suggestedFilters.every((filter) => {
          const field = response.decryptedResponses.find(
            (f) => f._id === filter.fieldId,
          )
          if (!field || !field.answer) return false

          const answer = field.answer.toLowerCase()
          const value = filter.value.toLowerCase()

          if (filter.operator === 'equals') {
            return answer === value
          }
          // 'contains' operator
          return answer.includes(value)
        })
      })
    },
    [],
  )

  const onAsk = useCallback(
    (question: string) => {
      if (!question.trim()) return

      // DEBUG: Log onAsk invocation
      console.log('[onAsk] Called with:', {
        question,
        formId: form?._id,
        useStreaming,
        filteredResponsesCount: filteredDecryptedResponses.length,
        decryptedResponsesCount: decryptedResponses.length,
      })

      setInterpretResult(undefined)
      setAnalysisReasoning(undefined)
      setAnalysisChanges(undefined)
      setMentionedResponseIds(undefined)
      setInterpretStep('analyzing')

      // Step 1: Analyze the question to get relevant fields
      analyzeQuestionMutation.mutate(
        { question },
        {
          onSuccess: (analysisResult) => {
            // DEBUG: Log analysis result
            console.log('[onAsk] Analysis result:', {
              relevantFieldIds: analysisResult.relevantFieldIds,
              suggestedFilters: analysisResult.suggestedFilters,
              reasoning: analysisResult.reasoning?.substring(0, 100),
            })
            setAnalysisReasoning(analysisResult.reasoning)

            const prevSelected = selectedFieldIds
            const prevFilters = filters
            const fieldTitleById = new Map(
              allDashboardFields.map((f) => [f._id, f.title]),
            )

            const validDashboardFieldIds = new Set(
              allDashboardFields.map((f) => f._id),
            )
            const validRelevantFieldIds =
              analysisResult.relevantFieldIds?.filter((id) =>
                validDashboardFieldIds.has(id),
              ) ?? []

            // Calculate column changes
            const nextSelected =
              validRelevantFieldIds.length > 0
                ? [
                    'Response ID',
                    MRF_RESPONSE_TIMESTAMP_LABEL,
                    ...validRelevantFieldIds,
                  ]
                : prevSelected

            const addedFieldTitles = nextSelected
              .filter((id) => !prevSelected.includes(id))
              .map((id) => fieldTitleById.get(id) ?? id)

            const removedFieldTitles = prevSelected
              .filter((id) => !nextSelected.includes(id))
              .map((id) => fieldTitleById.get(id) ?? id)

            // Calculate filter changes
            const nextFilters =
              analysisResult.suggestedFilters &&
              analysisResult.suggestedFilters.length > 0
                ? analysisResult.suggestedFilters.map((f) => ({
                    fieldId: f.fieldId,
                    operator: FilterOperator.Contains,
                    value: f.value,
                  }))
                : prevFilters

            const prevByField = new Map(prevFilters.map((f) => [f.fieldId, f]))
            const nextByField = new Map(nextFilters.map((f) => [f.fieldId, f]))
            const filterChanges: Array<{
              type: 'added' | 'removed' | 'updated'
              fieldTitle: string
              value?: string
              from?: string
              to?: string
            }> = []

            for (const [fieldId, next] of nextByField.entries()) {
              const prev = prevByField.get(fieldId)
              const fieldTitle = fieldTitleById.get(fieldId) ?? fieldId
              if (!prev) {
                filterChanges.push({
                  type: 'added',
                  fieldTitle,
                  value: next.value,
                })
              } else if (prev.value !== next.value) {
                filterChanges.push({
                  type: 'updated',
                  fieldTitle,
                  from: prev.value,
                  to: next.value,
                })
              }
            }
            for (const [fieldId, prev] of prevByField.entries()) {
              if (!nextByField.has(fieldId)) {
                const fieldTitle = fieldTitleById.get(fieldId) ?? fieldId
                filterChanges.push({
                  type: 'removed',
                  fieldTitle,
                  value: prev.value,
                })
              }
            }

            setAnalysisChanges({
              addedFieldTitles,
              removedFieldTitles,
              filterChanges,
            })

            // Apply AI-suggested filters to responses
            const responsesWithAiFilters = applyAiFilters(
              filteredDecryptedResponses,
              analysisResult.suggestedFilters,
            )

            // DEBUG: Log after AI filter application
            console.log('[onAsk] After AI filters:', {
              inputCount: filteredDecryptedResponses.length,
              outputCount: responsesWithAiFilters.length,
              validRelevantFieldIds,
            })

            // Show only relevant columns (update UI)
            if (validRelevantFieldIds.length > 0) {
              // Keep essential fields (Response ID, timestamp) plus relevant fields
              const essentialFieldIds = [
                'Response ID',
                MRF_RESPONSE_TIMESTAMP_LABEL,
              ]
              const newSelectedFields = [
                ...essentialFieldIds,
                ...validRelevantFieldIds,
              ]
              setSelectedFieldIds(newSelectedFields)
            }

            // Apply AI-suggested filters to UI
            if (
              analysisResult.suggestedFilters &&
              analysisResult.suggestedFilters.length > 0
            ) {
              const newFilters = analysisResult.suggestedFilters.map((f) => ({
                fieldId: f.fieldId,
                operator:
                  f.operator === 'equals'
                    ? FilterOperator.Contains
                    : FilterOperator.Contains,
                value: f.value,
              }))

              // If manual filters exist, ask for confirmation before replacing
              if (filters.length > 0) {
                setPendingAiFilters(newFilters)
                onFilterConfirmOpen()
              } else {
                setFilters(newFilters)
              }
            }

            // Step 2: Interpret the data with filtered/relevant fields
            setInterpretStep('interpreting')
            setStreamingAnswer('') // Reset streaming answer
            const responsesForApi = transformResponsesToInterpretFormat(
              responsesWithAiFilters,
              validRelevantFieldIds,
            )

            // DEBUG: Log before API call
            console.log('[onAsk] Before interpret API call:', {
              responsesForApiCount: responsesForApi.length,
              sampleResponse: responsesForApi[0],
              fieldsPerResponse: responsesForApi[0]?.fields?.length ?? 0,
              useStreaming,
              formId: form?._id,
            })

            if (useStreaming && form?._id) {
              console.log('[onAsk] Starting streaming interpretation...')
              interpretDataStreaming({
                formId: form._id,
                question,
                responses: responsesForApi,
                conversationHistory,
                onPartialAnswer: (answer) => {
                  setStreamingAnswer(answer)
                },
                onComplete: (data) => {
                  // DEBUG: Log streaming completion
                  console.log('[onAsk] Streaming complete:', {
                    answerLength: data.answer?.length,
                    hasExplanation: !!data.explanation,
                    chartsCount: data.suggestedCharts?.length,
                    followUpsCount: data.suggestedFollowUps?.length,
                    followUps: data.suggestedFollowUps,
                    mentionedIds: data.mentionedResponseIds,
                  })
                  setStreamingAnswer('')
                  setInterpretResult({
                    answer: data.answer,
                    explanation: data.explanation,
                    suggestedCharts: data.suggestedCharts,
                    suggestedFollowUps: data.suggestedFollowUps,
                  })

                  // Add to conversation history for multi-turn context
                  setConversationHistory((prev) => [
                    ...prev,
                    { question, answer: data.answer },
                  ])

                  // Handle mentioned response IDs
                  if (
                    data.mentionedResponseIds &&
                    data.mentionedResponseIds.length > 0
                  ) {
                    const allResponseIds = new Set(
                      decryptedResponses.map((r) => String(r.refNo)),
                    )
                    const validMentionedIds = data.mentionedResponseIds.filter(
                      (id) => allResponseIds.has(String(id)),
                    )
                    if (validMentionedIds.length > 0) {
                      setMentionedResponseIds(validMentionedIds)
                    } else {
                      setMentionedResponseIds(undefined)
                    }
                  } else {
                    setMentionedResponseIds(undefined)
                  }

                  setInterpretStep('idle')
                },
                onError: (error) => {
                  // DEBUG: Log streaming error
                  console.error('[onAsk] Streaming error:', error)
                  setStreamingAnswer('')
                  setInterpretStep('idle')
                  setMentionedResponseIds(undefined)
                },
              })
            } else {
              // Non-streaming fallback
              interpretDataMutation.mutate(
                { question, responses: responsesForApi, conversationHistory },
                {
                  onSuccess: (data) => {
                    setInterpretResult({
                      answer: data.answer,
                      explanation: data.explanation,
                      suggestedCharts: data.suggestedCharts,
                      suggestedFollowUps: data.suggestedFollowUps,
                    })

                    // Add to conversation history for multi-turn context
                    setConversationHistory((prev) => [
                      ...prev,
                      { question, answer: data.answer },
                    ])

                    // Use mentionedResponseIds from structured output if provided
                    // Validate that the IDs actually exist in the responses
                    if (
                      data.mentionedResponseIds &&
                      data.mentionedResponseIds.length > 0
                    ) {
                      const allResponseIds = new Set(
                        decryptedResponses.map((r) => String(r.refNo)),
                      )
                      // Filter to only include valid response IDs
                      const validMentionedIds = data.mentionedResponseIds.filter(
                        (id) => allResponseIds.has(String(id)),
                      )
                      if (validMentionedIds.length > 0) {
                        setMentionedResponseIds(validMentionedIds)
                      } else {
                        setMentionedResponseIds(undefined)
                      }
                    } else {
                      setMentionedResponseIds(undefined)
                    }

                    setInterpretStep('idle')
                  },
                  onError: () => {
                    setInterpretStep('idle')
                    setMentionedResponseIds(undefined)
                  },
                },
              )
            }
          },
          onError: (error) => {
            // DEBUG: Log analysis error
            console.error('[onAsk] Analysis error:', error)
            setInterpretStep('idle')
          },
        },
      )
    },
    [
      analyzeQuestionMutation,
      applyAiFilters,
      filteredDecryptedResponses,
      interpretDataMutation,
      transformResponsesToInterpretFormat,
      setSelectedFieldIds,
      setFilters,
      decryptedResponses,
      selectedFieldIds,
      filters,
      allDashboardFields,
      conversationHistory,
      form?._id,
      useStreaming,
    ],
  )

  const fetchSuggestedQuestions = useCallback(() => {
    if (!form?._id) return
    suggestedQuestionsMutation.mutate(undefined, {
      onSuccess: (data) => {
        setSuggestedQuestions(data.suggestedQuestions ?? [])
      },
      onError: () => {
        setSuggestedQuestions([])
      },
    })
  }, [form?._id, suggestedQuestionsMutation])

  // Fetch auto-summary with optional responses override (for filtered data)
  const fetchAutoSummary = useCallback(
    (
      responsesOverride?: DecryptedResponse[],
      scopeDateRange?: [DateString | null, DateString | null],
    ) => {
      const responses = responsesOverride ?? decryptedResponses
      if (!form?._id || responses.length === 0) return
      const responsesForApi = transformResponsesToInterpretFormat(responses)
      const currentDateRange = scopeDateRange ?? dateRange

      // Use streaming for auto-summary
      setIsStreamingSummary(true)
      setStreamingSummary('')

      getAutoSummaryStreaming({
        formId: form._id,
        responses: responsesForApi,
        onPartialSummary: (summary) => {
          setStreamingSummary(summary)
        },
        onComplete: (data) => {
          setStreamingSummary('')
          setIsStreamingSummary(false)
          // Reset auto-fetch flag on success so manual refresh works
          hasAttemptedAutoFetch.current = false
          setAutoSummary({
            summary: data.summary,
            keyFindings: data.keyFindings ?? [],
            suggestedQuestions: data.suggestedQuestions ?? [],
          })
          // Track what scope this summary is based on
          setSummaryScope({
            dateRange: currentDateRange,
            responseCount: responses.length,
          })
          // Cache the responses used for insights (trends, anomalies)
          setInsightsResponses(responses)
        },
        onError: () => {
          setStreamingSummary('')
          setIsStreamingSummary(false)
          // Keep hasAttemptedAutoFetch true to prevent infinite retry
          setAutoSummary({
            summary: null,
            keyFindings: [],
            suggestedQuestions: [],
          })
        },
      })
    },
    [form?._id, decryptedResponses, transformResponsesToInterpretFormat, dateRange],
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

  // Handler to clear the mentioned response filter
  const handleClearMentionedFilter = useCallback(() => {
    setMentionedResponseIds(undefined)
  }, [])

  // Compute last response time from decrypted responses
  const lastResponseTime = useMemo(() => {
    if (!decryptedResponses.length) return undefined
    // Responses are sorted newest first, so first item is most recent
    return decryptedResponses[0]?.submissionTime
  }, [decryptedResponses])

  // Background pre-fetch: Start fetching auto-summary as soon as responses are decrypted
  // This improves perceived performance when user clicks "Analyse"
  useEffect(() => {
    if (
      decryptedResponses.length > 0 &&
      !autoSummary.summary &&
      !isStreamingSummary &&
      !hasAttemptedAutoFetch.current
    ) {
      hasAttemptedAutoFetch.current = true
      fetchAutoSummary()
    }
  }, [decryptedResponses.length, autoSummary.summary, isStreamingSummary, fetchAutoSummary])

  // Track previous date range to detect changes
  const prevDateRangeRef = useRef<string>('')

  // Compute a hash of current date range for change detection
  const currentDateRangeHash = useMemo(() => {
    return JSON.stringify(dateRange)
  }, [dateRange])

  // Check if summary scope differs from current date range (for stale indicator)
  // Only consider stale when date range is complete (both dates selected, or both null)
  const isSummaryStale = useMemo(() => {
    if (!summaryScope) return false
    const isComplete = (dateRange[0] === null && dateRange[1] === null) ||
                       (dateRange[0] !== null && dateRange[1] !== null)
    if (!isComplete) return false
    return JSON.stringify(summaryScope.dateRange) !== currentDateRangeHash
  }, [summaryScope, currentDateRangeHash, dateRange])

  // Check if date range is "complete" (both dates selected, or both null for "all time")
  const isDateRangeComplete = useMemo(() => {
    return (dateRange[0] === null && dateRange[1] === null) ||
           (dateRange[0] !== null && dateRange[1] !== null)
  }, [dateRange])

  // Detect date range changes and prompt for regeneration (when Analyse panel is open)
  useEffect(() => {
    // Only prompt if:
    // 1. Analyse panel is open
    // 2. Date range has actually changed (not initial render)
    // 3. We have a summary already
    // 4. Not currently streaming
    // 5. Date range is complete (both dates selected, or both null)
    if (
      isInterpretOpen &&
      prevDateRangeRef.current !== '' &&
      prevDateRangeRef.current !== currentDateRangeHash &&
      autoSummary.summary &&
      !isStreamingSummary &&
      isDateRangeComplete
    ) {
      onDateRangeConfirmOpen()
    }
    // Only update prevDateRangeRef when the date range is complete
    if (isDateRangeComplete) {
      prevDateRangeRef.current = currentDateRangeHash
    }
  }, [currentDateRangeHash, isInterpretOpen, autoSummary.summary, isStreamingSummary, onDateRangeConfirmOpen, isDateRangeComplete])

  // Handle date range regeneration confirmation
  const handleDateRangeRegenerate = useCallback(() => {
    onDateRangeConfirmClose()
    fetchAutoSummary(decryptedResponses, dateRange)
  }, [onDateRangeConfirmClose, fetchAutoSummary, decryptedResponses, dateRange])

  const handleDateRangeKeepCurrent = useCallback(() => {
    onDateRangeConfirmClose()
    // Keep the current summary - the stale indicator will show
  }, [onDateRangeConfirmClose])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, mentionedResponseIds, dateRange])

  // Paginate the filtered responses for the table
  const paginatedResponses = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return filteredDecryptedResponses.slice(startIndex, endIndex)
  }, [filteredDecryptedResponses, currentPage, PAGE_SIZE])

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
        onClickInterpret={() => {
          if (
            (!suggestedQuestions || suggestedQuestions.length === 0) &&
            !suggestedQuestionsMutation.isLoading
          ) {
            fetchSuggestedQuestions()
          }
          setIsInterpretOpen(!isInterpretOpen)
        }}
      />

      {/* Main content area - scrollable */}
      <Box flex={1} overflow="auto">
        {/* Insights Section (shown when Analyse is clicked) */}
        {isInterpretOpen && (
          <Stack spacing={4} mb={4}>
            {/* Close button and header */}
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold" color="secondary.700">
                Insights
              </Text>
              <IconButton
                aria-label="Close insights"
                icon={<BiX size={20} />}
                variant="clear"
                size="sm"
                color="secondary.500"
                _hover={{ color: 'secondary.700', bg: 'neutral.100' }}
                onClick={() => setIsInterpretOpen(false)}
              />
            </Flex>

            {/* Hero Stats - full width */}
            <HeroStats
              responseCount={decryptedResponses.length}
              filteredCount={filteredDecryptedResponses.length}
              dateRange={dateRange}
              lastResponseTime={lastResponseTime}
            />

            {/* Filter explanation banner - show when filters reduce the count */}
            {filters.length > 0 &&
              filteredDecryptedResponses.length < decryptedResponses.length && (
                <Box
                  bg="blue.50"
                  border="1px solid"
                  borderColor="blue.100"
                  borderRadius="md"
                  px={3}
                  py={2}
                >
                  <Text fontSize="xs" color="blue.700">
                    Charts and trends show all {decryptedResponses.length}{' '}
                    responses. Table shows {filteredDecryptedResponses.length}{' '}
                    filtered responses.
                  </Text>
                </Box>
              )}

            {/* Stale summary indicator - show when summary scope differs from current date range */}
            {isSummaryStale && summaryScope && (
              <Box
                bg="yellow.50"
                border="1px solid"
                borderColor="yellow.200"
                borderRadius="md"
                px={3}
                py={2}
              >
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" color="yellow.800">
                    Summary and trends based on {summaryScope.responseCount}{' '}
                    responses
                    {summaryScope.dateRange[0] || summaryScope.dateRange[1]
                      ? ` (${summaryScope.dateRange[0] ?? 'earliest'} to ${summaryScope.dateRange[1] ?? 'latest'})`
                      : ' (all time)'}
                    . Current view: {decryptedResponses.length} responses.
                  </Text>
                  <Button
                    size="xs"
                    variant="link"
                    colorScheme="yellow"
                    onClick={() => fetchAutoSummary(decryptedResponses, dateRange)}
                    isLoading={isStreamingSummary}
                  >
                    Regenerate
                  </Button>
                </Flex>
              </Box>
            )}

            {/* Trend Alerts - submission pattern analysis */}
            {/* Use cached insightsResponses when summary is stale to keep insights consistent */}
            <TrendAlerts
              decryptedResponses={
                isSummaryStale && insightsResponses.length > 0
                  ? insightsResponses
                  : decryptedResponses
              }
            />

            {/* Anomaly Alerts - potential issues detection */}
            <AnomalyAlerts
              decryptedResponses={
                isSummaryStale && insightsResponses.length > 0
                  ? insightsResponses
                  : decryptedResponses
              }
            />

            {/* Quick Charts - auto-generated from chartable fields */}
            {/* Use cached insightsResponses when summary is stale to keep insights consistent */}
            <QuickCharts
              formFields={form_fields ?? []}
              decryptedResponses={
                isSummaryStale && insightsResponses.length > 0
                  ? insightsResponses
                  : decryptedResponses
              }
              maxCharts={2}
            />

            {/* Auto Summary - AI-generated overview with streaming support */}
            <AutoSummary
              summary={autoSummary.summary}
              keyFindings={autoSummary.keyFindings}
              suggestedQuestions={autoSummary.suggestedQuestions}
              isLoading={!autoSummary.summary && decryptedResponses.length > 0}
              isStreaming={isStreamingSummary}
              streamingSummary={streamingSummary}
              isAsking={interpretStep !== 'idle'}
              onQuestionClick={(question) => {
                setAskedQuestion(question) // Set the asked question so it appears with the answer
                onAsk(question)
              }}
            />

            {/* InterpretBox - full width */}
            <InterpretBox
              onAsk={onAsk}
              currentStep={interpretStep}
              result={interpretResult}
              analysisReasoning={analysisReasoning}
              analysisChanges={analysisChanges}
              suggestedQuestions={suggestedQuestions}
              isLoadingSuggestedQuestions={suggestedQuestionsMutation.isLoading}
              onRefreshSuggestedQuestions={fetchSuggestedQuestions}
              mentionedResponseIds={mentionedResponseIds}
              filteredResponseIds={filteredDecryptedResponses?.map((r) =>
                String(r.refNo),
              )}
              decryptedResponsesCount={decryptedResponses.length}
              onClearMentionedFilter={handleClearMentionedFilter}
              askedQuestion={askedQuestion}
              setAskedQuestion={setAskedQuestion}
              streamingAnswer={streamingAnswer}
              conversationTurnCount={conversationHistory.length}
              onClearConversation={() => setConversationHistory([])}
            />

            {/* Collapsible Table Header */}
            <Flex
              justify="space-between"
              align="center"
              py={3}
              px={4}
              bg="neutral.100"
              borderRadius="md"
              cursor="pointer"
              onClick={() => setIsTableExpanded(!isTableExpanded)}
              _hover={{ bg: 'neutral.200' }}
              transition="background 0.2s"
            >
              <Flex align="center" gap={2}>
                <Text fontSize="sm" fontWeight="semibold" color="secondary.700">
                  Responses
                </Text>
                <Text fontSize="sm" color="secondary.500">
                  ({filteredDecryptedResponses.length})
                </Text>
              </Flex>
              <IconButton
                aria-label={isTableExpanded ? 'Collapse table' : 'Expand table'}
                icon={isTableExpanded ? <BiChevronUp size={20} /> : <BiChevronDown size={20} />}
                variant="clear"
                size="sm"
                color="secondary.500"
              />
            </Flex>

            {/* Collapsible Table Content */}
            {isTableExpanded && (
              <Stack spacing={4}>
                {isFetchingAndDecrypting ? (
                  <Skeleton height="2.5rem" />
                ) : (
                  <>
                    <ResponsesTableV2
                      isResponseLimitExceeded={
                        !!dateRangeResponsesCount &&
                        dateRangeResponsesCount > MAX_RESPONSES_COUNT_FOR_DECRYPT
                      }
                      form={form}
                      selectedSubmissionMetaFields={selectedSubmissionMetaFields}
                      selectedFields={selectedFields}
                      decryptedResponses={paginatedResponses}
                      onHideColumn={handleHideColumn}
                      onAddFilter={handleColumnAddFilter}
                      onRemoveFilter={handleRemoveFilter}
                      filters={filters.map((f) => ({
                        fieldId: f.fieldId,
                        value: f.value,
                      }))}
                    />
                    {filteredDecryptedResponses.length > PAGE_SIZE && (
                      <Pagination
                        totalCount={filteredDecryptedResponses.length}
                        currentPage={currentPage}
                        pageSize={PAGE_SIZE}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </Stack>
            )}
          </Stack>
        )}

        {/* Full Table View (when Insights is closed) */}
        {!isInterpretOpen && (
          <Stack spacing={4} bg="white">
            {isFetchingAndDecrypting ? (
              <Skeleton height="2.5rem" />
            ) : (
              <>
                <ResponsesTableV2
                  isResponseLimitExceeded={
                    !!dateRangeResponsesCount &&
                    dateRangeResponsesCount > MAX_RESPONSES_COUNT_FOR_DECRYPT
                  }
                  form={form}
                  selectedSubmissionMetaFields={selectedSubmissionMetaFields}
                  selectedFields={selectedFields}
                  decryptedResponses={paginatedResponses}
                  onHideColumn={handleHideColumn}
                  onAddFilter={handleColumnAddFilter}
                  onRemoveFilter={handleRemoveFilter}
                  filters={filters.map((f) => ({
                    fieldId: f.fieldId,
                    value: f.value,
                  }))}
                />
                {filteredDecryptedResponses.length > PAGE_SIZE && (
                  <Pagination
                    totalCount={filteredDecryptedResponses.length}
                    currentPage={currentPage}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </Stack>
        )}
      </Box>

      {/* AI Filter Confirmation Modal */}
      <Modal isOpen={isFilterConfirmOpen} onClose={onFilterConfirmClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700">Replace filters?</ModalHeader>
          <ModalBody color="secondary.500">
            <Text>
              You have existing filters applied. The AI has suggested new
              filters based on your question. Would you like to replace your
              current filters with the AI-suggested ones?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Stack direction="row" spacing={3}>
              <Button
                variant="clear"
                colorScheme="secondary"
                onClick={() => {
                  setPendingAiFilters(null)
                  onFilterConfirmClose()
                }}
              >
                Keep current filters
              </Button>
              <Button
                colorScheme="primary"
                onClick={() => {
                  if (pendingAiFilters) {
                    setFilters(pendingAiFilters)
                  }
                  setPendingAiFilters(null)
                  onFilterConfirmClose()
                }}
              >
                Use AI filters
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Date Range Regeneration Confirmation Modal */}
      <Modal isOpen={isDateRangeConfirmOpen} onClose={handleDateRangeKeepCurrent}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700">Regenerate insights?</ModalHeader>
          <ModalBody color="secondary.500">
            <Text>
              You&apos;ve changed the date range. Would you like to regenerate
              the insights and summary for the new {decryptedResponses.length}{' '}
              responses?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Stack direction="row" spacing={3}>
              <Button
                variant="clear"
                colorScheme="secondary"
                onClick={handleDateRangeKeepCurrent}
              >
                Keep current
              </Button>
              <Button colorScheme="primary" onClick={handleDateRangeRegenerate}>
                Regenerate
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  )
}

export default UnlockedResponsesV2
