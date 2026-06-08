import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BiCheckCircle,
  BiEditAlt,
  BiGridVertical,
  BiLock,
  BiPlus,
  BiSpreadsheet,
  BiTrash,
} from 'react-icons/bi'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Icon,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useDisclosure,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { SingleSelect } from '~components/Dropdown'
import Tooltip from '~components/Tooltip'

import type { WorkflowStep } from '../../types'
import {
  fieldsSelector,
  respondentsSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'
import { STEP_TYPE_CONFIG } from '../AddStepsPanel/StepTypeCard'

import { FieldDropZone } from './FieldDropZone'
import { RespondentDropZone } from './RespondentDropZone'

export type StepCardMode =
  | 'summary'
  | 'add_steps'
  | 'respondent_pool'
  | 'respondent_focus'
  | 'field_pool'
  | 'field_focus'

type CanvasStepCardProps = {
  step: WorkflowStep
  mode?: StepCardMode
  isFocused?: boolean
  isDraggingField?: boolean
  isDraggingRespondent?: boolean
  justDroppedStepId?: string | null
}

export const CanvasStepCard = ({
  step,
  mode = 'summary',
  isFocused = false,
  isDraggingField = false,
  isDraggingRespondent = false,
  justDroppedStepId = null,
}: CanvasStepCardProps): JSX.Element => {
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const removeStep = useWorkflowBuilderStore((s) => s.removeStep)
  const unassignRespondent = useWorkflowBuilderStore(
    (s) => s.unassignRespondent,
  )
  const unassignField = useWorkflowBuilderStore((s) => s.unassignField)
  const setApprovalDecisionField = useWorkflowBuilderStore(
    (s) => s.setApprovalDecisionField,
  )
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Derived mode flags
  const isAddSteps = mode === 'add_steps'
  const isRespondentPhase =
    mode === 'respondent_pool' || mode === 'respondent_focus'
  const isFieldPhase = mode === 'field_pool' || mode === 'field_focus'
  const isSummaryMode = mode === 'summary'
  const compact = isAddSteps
  const sortable = isAddSteps || isSummaryMode

  const isFaded = false

  // Sortable (for add_steps reorder)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSortDragging,
    isOver: isSortOver,
  } = useSortable({
    id: step.id,
    data: { type: 'step_card', sortIndex: step.order },
    disabled: !sortable || steps.length <= 1,
  })

  // Step 1 (order 0) is locked during respondent phase - no drop zone, no click, no remove
  const isFirstStep = step.order === 0

  // Whole-card droppable zones for drag
  const { setNodeRef: setFieldDropRef, isOver: isFieldDropOver } = useDroppable(
    {
      id: `card-field-drop-${step.id}`,
      data: { type: 'field_drop', stepId: step.id },
      disabled: !isDraggingField,
    },
  )
  const { setNodeRef: setRespondentDropRef, isOver: isRespondentDropOver } =
    useDroppable({
      id: `card-respondent-drop-${step.id}`,
      data: { type: 'respondent_drop', stepId: step.id },
      disabled: !isDraggingRespondent || isFirstStep,
    })

  // In summary mode, skip the sort transform/transition to avoid layout glitches
  // with the connection lines between cards. Cards just snap on drop.
  const style = isSummaryMode
    ? { opacity: isSortDragging ? 0.3 : undefined }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortDragging ? 0.3 : undefined,
      }

  const stepRespondents = useMemo(
    () => respondents.filter((r) => step.respondentIds.includes(r.id)),
    [respondents, step.respondentIds],
  )

  const stepFields = useMemo(
    () => fields.filter((f) => step.fieldIds.includes(f.id)),
    [fields, step.fieldIds],
  )

  const allFieldsAssigned = useMemo(
    () => fields.length > 0 && step.fieldIds.length === fields.length,
    [fields, step.fieldIds],
  )

  const yesNoFieldsOnStep = useMemo(
    () =>
      fields.filter(
        (f) => f.fieldType === 'yes_no' && step.fieldIds.includes(f.id),
      ),
    [fields, step.fieldIds],
  )

  const showDragHandle = (isAddSteps || isSummaryMode) && steps.length > 1
  const showDelete = isAddSteps && steps.length > 1 && step.order > 0

  const handleCardClick = useCallback(() => {
    if (isAddSteps && compact) {
      setFocus({ type: 'step_edit', stepId: step.id })
    } else if (isRespondentPhase) {
      setFocus({
        type: 'step_focus',
        phase: 'add_respondents',
        stepId: step.id,
      })
    } else if (isFieldPhase) {
      setFocus({
        type: 'step_focus',
        phase: 'assign_fields',
        stepId: step.id,
      })
    } else if (isSummaryMode) {
      setFocus({
        type: 'step_edit',
        stepId: step.id,
        fromSummary: true,
      })
    }
  }, [
    isAddSteps,
    isRespondentPhase,
    isFieldPhase,
    isSummaryMode,
    compact,
    setFocus,
    step.id,
  ])

  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = useCallback(() => {
    onClose()
    setIsDeleting(true)
    setTimeout(() => {
      removeStep(step.id)
    }, 300)
  }, [removeStep, step.id, onClose])

  // Show fields sections in summary, add_steps, and field phase (hidden in respondent phase)
  // Exception: always show on the focused step so user sees full step context
  const showFieldsSections = !isRespondentPhase || isFocused

  // Show respondent drop zone in pool view (all cards) or focus view (only focused card)
  // Hide small zones when respondent is being dragged (whole-card zone replaces them)
  const isPoolView = mode === 'respondent_pool'
  const showRespondentDropZone =
    !isDraggingRespondent &&
    !isFirstStep &&
    (isPoolView || (mode === 'respondent_focus' && isFocused))

  // Respondent chips get X buttons in pool view (all cards) or focus view (only focused card)
  const showRespondentRemove =
    !isFirstStep && (isPoolView || (mode === 'respondent_focus' && isFocused))

  // Field X buttons: pool view (all cards) or focus view (only focused card)
  // Hide small FieldDropZones when a field is being dragged (whole-card zones replace them)
  const isFieldPoolView = mode === 'field_pool'
  const showFieldRemove =
    !isDraggingField &&
    (isFieldPoolView || (mode === 'field_focus' && isFocused))

  // Clickable card in add_steps compact, respondent phase, field phase, or summary
  const isClickable =
    (isAddSteps && compact) ||
    isRespondentPhase ||
    isFieldPhase ||
    isSummaryMode

  const scrollRef = useRef<HTMLDivElement>(null)

  // Combine sortable ref with scroll ref
  const cardRef = useCallback(
    (node: HTMLDivElement | null) => {
      setSortableRef(node)
      ;(scrollRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node
    },
    [setSortableRef],
  )

  // Auto-scroll to focused step
  useEffect(() => {
    if (isFocused && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isFocused])

  // Determine if this card should render as a drop zone
  const isFieldFocusView = mode === 'field_focus'
  const isRespondentPoolView = mode === 'respondent_pool'
  const isRespondentFocusView = mode === 'respondent_focus'

  const showAsDropZone =
    (isDraggingField && (isFieldPoolView || (isFieldFocusView && isFocused))) ||
    (isDraggingRespondent &&
      !isFirstStep &&
      (isRespondentPoolView || (isRespondentFocusView && isFocused)))

  // Step 1 locked state during respondent phase
  const isLockedStep1 = isFirstStep && isRespondentPhase

  // Track card height so drop zone matches
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined)
  useEffect(() => {
    if (scrollRef.current && !showAsDropZone) {
      setCardHeight(scrollRef.current.offsetHeight)
    }
  }, [showAsDropZone])

  // Drop zone content for when showAsDropZone is true
  const isFieldDrag = isDraggingField
  const isJustDropped = justDroppedStepId === step.id

  const cardContent = (
    <Box
      overflow="hidden"
      maxH={isDeleting ? 0 : '40rem'}
      opacity={isDeleting ? 0 : 1}
      transform={isDeleting ? 'scale(0.95)' : 'scale(1)'}
      transition="max-height 0.3s ease, opacity 0.2s ease, transform 0.2s ease"
      position="relative"
    >
      {/* Drop zone layer - fades in when showAsDropZone */}
      <Box
        opacity={showAsDropZone ? 1 : 0}
        pointerEvents={showAsDropZone ? 'auto' : 'none'}
        transition="opacity 0.2s ease"
        position={showAsDropZone ? 'relative' : 'absolute'}
        inset={showAsDropZone ? undefined : 0}
      >
        <Box
          w="100%"
          minH={cardHeight ? `${cardHeight}px` : '6rem'}
          borderRadius="12px"
          bg="white"
          border="1px solid"
          borderColor={
            isFieldDropOver || isRespondentDropOver
              ? 'primary.500'
              : 'neutral.300'
          }
          p="0.75rem"
          transition="border-color 0.15s"
          display="flex"
          flexDir="column"
          justifyContent="center"
        >
          <Stack spacing="0.5rem" flex={1}>
            <Center
              ref={isFieldDrag ? setFieldDropRef : setRespondentDropRef}
              w="100%"
              flex={1}
              py="1rem"
              px="1rem"
              borderRadius="4px"
              border="2px dashed"
              borderColor={
                (isFieldDrag ? isFieldDropOver : isRespondentDropOver)
                  ? 'primary.500'
                  : 'primary.400'
              }
              bg={
                (isFieldDrag ? isFieldDropOver : isRespondentDropOver)
                  ? 'primary.200'
                  : 'primary.100'
              }
              transform={isJustDropped ? 'scale(0.95)' : 'scale(1)'}
              transition="transform 0.2s ease, background 0.15s, border-color 0.15s"
            >
              <Text
                textStyle="subhead-2"
                color="primary.500"
                textAlign="center"
              >
                + Drag into {step.name}
              </Text>
            </Center>
          </Stack>
        </Box>
      </Box>

      {/* Normal card content - fades out when showAsDropZone */}
      <Box
        opacity={showAsDropZone ? 0 : isLockedStep1 ? 0.5 : 1}
        pointerEvents={showAsDropZone || isLockedStep1 ? 'none' : 'auto'}
        transition="opacity 0.2s ease"
        position={showAsDropZone ? 'absolute' : 'relative'}
        inset={showAsDropZone ? 0 : undefined}
        w="100%"
      >
        <Flex
          data-step-card
          ref={cardRef}
          {...(sortable && steps.length > 1
            ? { ...listeners, ...attributes }
            : {})}
          style={style}
          w="100%"
          textAlign="start"
          borderRadius="12px"
          bg="white"
          border={isFocused || isSortOver ? '2px solid' : '1px solid'}
          borderColor={isFocused || isSortOver ? 'primary.500' : 'neutral.300'}
          opacity={isFaded ? 0.5 : 1}
          transition="opacity 0.2s, border-color 0.2s, box-shadow 0.2s"
          cursor={
            isClickable
              ? sortable && steps.length > 1
                ? 'grab'
                : 'pointer'
              : undefined
          }
          _hover={
            isClickable
              ? {
                  borderColor: 'primary.500',
                  bg: 'primary.100',
                }
              : undefined
          }
          _active={
            sortable && steps.length > 1 ? { cursor: 'grabbing' } : undefined
          }
        >
          {/* Main card content area */}
          <Box
            flex={1}
            minW={0}
            py={compact ? '1rem' : '1.5rem'}
            onClick={handleCardClick}
          >
            {/* Step header */}
            <Flex justify="space-between" align="center" px="1.5rem">
              <HStack spacing="1rem" flex={1} minW={0}>
                <Center
                  w="2rem"
                  h="2rem"
                  borderRadius="full"
                  bg={step.type === 'review' ? 'theme-teal.100' : 'primary.100'}
                  flexShrink={0}
                >
                  <Icon
                    as={step.type === 'review' ? BiCheckCircle : BiSpreadsheet}
                    fontSize="1.25rem"
                    color={
                      step.type === 'review' ? 'theme-teal.500' : 'primary.500'
                    }
                  />
                </Center>
                <Stack spacing="0" flex={1} minW={0}>
                  <Text
                    textStyle="subhead-1"
                    color="secondary.500"
                    noOfLines={1}
                  >
                    {step.name}
                  </Text>
                  <Text
                    textStyle="caption-1"
                    color="secondary.400"
                    noOfLines={1}
                  >
                    {STEP_TYPE_CONFIG[step.type].title}
                  </Text>
                </Stack>
              </HStack>
              <HStack spacing="0.5rem" flexShrink={0} align="center">
                {/* Edit icon - hover reveal */}
                {(isSummaryMode ||
                  isAddSteps ||
                  (isRespondentPhase && !isLockedStep1) ||
                  isFieldPhase) && (
                  <Box
                    p="0.25rem"
                    display="flex"
                    alignItems="center"
                    cursor="pointer"
                    opacity={0}
                    transition="opacity 0.15s ease"
                    sx={{
                      '[data-step-card]:hover &': { opacity: 1 },
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setFocus({
                        type: 'step_edit',
                        stepId: step.id,
                        fromSummary: true,
                        returnTo: isAddSteps
                          ? 'add_steps'
                          : isRespondentPhase
                            ? 'add_respondents'
                            : isFieldPhase
                              ? 'assign_fields'
                              : undefined,
                      })
                    }}
                  >
                    <Icon
                      as={BiEditAlt}
                      fontSize="1.25rem"
                      color="neutral.500"
                    />
                  </Box>
                )}
                {/* Drag handle - always visible */}
                {showDragHandle && (
                  <Box
                    {...listeners}
                    {...attributes}
                    cursor="grab"
                    p="0.25rem"
                    display="flex"
                    alignItems="center"
                  >
                    <Icon
                      as={BiGridVertical}
                      fontSize="1.25rem"
                      color="neutral.500"
                    />
                  </Box>
                )}
              </HStack>
            </Flex>

            {/* Detailed sections - animated collapse in compact mode */}
            <Box
              overflow="hidden"
              maxH={compact ? 0 : '40rem'}
              opacity={compact ? 0 : 1}
              transition="max-height 0.35s ease, opacity 0.25s ease"
            >
              <Divider borderColor="neutral.300" mt="1rem" />

              {/* Respondent section */}
              <Stack spacing="0.5rem" px="1.5rem" mt="1rem">
                <Text textStyle="subhead-2" color="secondary.500">
                  People involved
                </Text>
                <Wrap spacing="0.25rem">
                  {stepRespondents.map((r) => (
                    <WrapItem key={r.id}>
                      <Tag
                        size="sm"
                        bg="primary.100"
                        borderRadius="4px"
                        px="0.5rem"
                        py="0.25rem"
                        animation="chipAppear 0.3s ease"
                        sx={{
                          '@keyframes chipAppear': {
                            from: {
                              opacity: 0,
                              transform: 'scale(0.8)',
                            },
                            to: { opacity: 1, transform: 'scale(1)' },
                          },
                        }}
                      >
                        <TagLabel textStyle="caption-1" color="secondary.500">
                          {r.name}
                        </TagLabel>
                        {showRespondentRemove && (
                          <TagCloseButton
                            onClick={(e) => {
                              e.stopPropagation()
                              unassignRespondent(step.id, r.id)
                            }}
                          />
                        )}
                      </Tag>
                    </WrapItem>
                  ))}
                  {stepRespondents.length === 0 && !showRespondentDropZone && (
                    <Tag
                      size="sm"
                      bg="primary.100"
                      borderRadius="4px"
                      px="0.5rem"
                      py="0.25rem"
                    >
                      <TagLabel textStyle="caption-1" color="secondary.500">
                        None
                      </TagLabel>
                    </Tag>
                  )}
                </Wrap>

                {/* Respondent drop zone */}
                {showRespondentDropZone && (
                  <RespondentDropZone
                    droppableId={`respondent-drop-${step.id}`}
                    droppableData={{ type: 'respondent_drop', stepId: step.id }}
                    variant={isFocused ? 'step_focus' : 'pool'}
                  />
                )}
              </Stack>

              {/* Fields section - hidden during respondent phase */}
              {showFieldsSections && (
                <>
                  <Stack spacing="0.5rem" px="1.5rem" mt="1rem">
                    <Text textStyle="subhead-2" color="secondary.500">
                      Fields
                    </Text>
                    <Wrap spacing="0.25rem">
                      {allFieldsAssigned && !showFieldRemove ? (
                        <WrapItem>
                          <Tag
                            size="sm"
                            bg="primary.100"
                            borderRadius="4px"
                            px="0.5rem"
                            py="0.25rem"
                          >
                            <TagLabel
                              textStyle="caption-1"
                              color="secondary.500"
                            >
                              All fields
                            </TagLabel>
                          </Tag>
                        </WrapItem>
                      ) : stepFields.length > 0 ? (
                        stepFields.map((f) => (
                          <WrapItem key={f.id}>
                            <Tag
                              size="sm"
                              bg="primary.100"
                              borderRadius="4px"
                              px="0.5rem"
                              py="0.25rem"
                              animation="chipAppear 0.3s ease"
                              sx={{
                                '@keyframes chipAppear': {
                                  from: {
                                    opacity: 0,
                                    transform: 'scale(0.8)',
                                  },
                                  to: {
                                    opacity: 1,
                                    transform: 'scale(1)',
                                  },
                                },
                              }}
                            >
                              <TagLabel
                                textStyle="caption-1"
                                color="secondary.500"
                              >
                                {f.number}. {f.name}
                              </TagLabel>
                              {showFieldRemove && (
                                <TagCloseButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    unassignField(step.id, f.id)
                                  }}
                                />
                              )}
                            </Tag>
                          </WrapItem>
                        ))
                      ) : (
                        <Tag
                          size="sm"
                          bg="primary.100"
                          borderRadius="4px"
                          px="0.5rem"
                          py="0.25rem"
                        >
                          <TagLabel textStyle="caption-1" color="secondary.500">
                            None
                          </TagLabel>
                        </Tag>
                      )}
                    </Wrap>

                    {/* Field drop zone */}
                    {showFieldRemove && (
                      <FieldDropZone
                        droppableId={`field-drop-${step.id}`}
                        droppableData={{ type: 'field_drop', stepId: step.id }}
                        variant={isFocused ? 'step_focus' : 'pool'}
                      />
                    )}
                  </Stack>

                  {/* Approval decision (review steps only, field phase) */}
                  {step.type === 'review' && isFieldPhase && (
                    <Box
                      mx="1.5rem"
                      mt="0.75rem"
                      p="0.75rem"
                      bg="primary.100"
                      borderRadius="8px"
                      border="1px solid"
                      borderColor="primary.200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Text
                        textStyle="subhead-2"
                        color="secondary.500"
                        mb="0.25rem"
                      >
                        Approval decision
                      </Text>
                      <Text
                        textStyle="caption-1"
                        color="secondary.400"
                        mb="0.5rem"
                      >
                        Select the Yes/No field that determines if this step is
                        approved.
                      </Text>
                      {yesNoFieldsOnStep.length > 0 ? (
                        <SingleSelect
                          name={`approval-decision-${step.id}`}
                          items={yesNoFieldsOnStep.map((f) => ({
                            value: f.id,
                            label: `${f.number}. ${f.name}`,
                          }))}
                          value={step.approvalDecisionFieldId ?? ''}
                          onChange={(value) => {
                            setApprovalDecisionField(step.id, value || null)
                          }}
                          placeholder="Select a Yes/No field..."
                          isClearable
                        />
                      ) : (
                        <>
                          <SingleSelect
                            name={`approval-decision-${step.id}-disabled`}
                            items={[]}
                            value=""
                            onChange={() => {}}
                            placeholder="No Yes/No fields assigned"
                            isDisabled
                          />
                          <Text
                            textStyle="caption-1"
                            color="warning.500"
                            mt="0.25rem"
                          >
                            Assign a Yes/No field to this step first.
                          </Text>
                        </>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Trash corner - add_steps phase only */}
          {showDelete && (
            <Flex align="center" flexShrink={0}>
              <Box h="1.5rem" w="1px" bg="neutral.300" />
              <Flex
                align="center"
                justify="center"
                w="3.25rem"
                alignSelf="stretch"
                cursor="pointer"
                borderTopRightRadius="11px"
                borderBottomRightRadius="11px"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen()
                }}
                _hover={{ bg: 'danger.100' }}
                transition="background 0.15s"
              >
                <Icon as={BiTrash} fontSize="1.25rem" color="danger.500" />
              </Flex>
            </Flex>
          )}
        </Flex>

        {/* Lock icon for Step 1 during respondent phase */}
        {isLockedStep1 && (
          <Box position="absolute" top="1.5rem" right="1.5rem" zIndex={3}>
            <Icon as={BiLock} fontSize="1.25rem" color="secondary.400" />
          </Box>
        )}
      </Box>

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete step?
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this step? This action cannot be
              undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="clear">
                Cancel
              </Button>
              <Button colorScheme="danger" onClick={handleConfirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )

  if (isLockedStep1) {
    return (
      <Tooltip label="This is the first step. Anyone with the form link can respond.">
        {cardContent}
      </Tooltip>
    )
  }

  return cardContent
}

/**
 * Floating overlay shown during canvas step card drag.
 * Matches the compact card style with shadow.
 */
export const StepCardOverlay = ({
  step,
}: {
  step: WorkflowStep
}): JSX.Element => {
  return (
    <Box
      w="100%"
      maxW="42.5rem"
      borderRadius="12px"
      bg="white"
      border="1px solid"
      borderColor="primary.500"
      boxShadow="lg"
      py="1rem"
      cursor="grabbing"
    >
      <Flex justify="space-between" align="center" px="1.5rem">
        <HStack spacing="1rem" flex={1} minW={0}>
          <Center
            w="2rem"
            h="2rem"
            borderRadius="8px"
            bg={step.type === 'review' ? 'theme-teal.100' : 'primary.100'}
            flexShrink={0}
          >
            <Icon
              as={step.type === 'review' ? BiCheckCircle : BiSpreadsheet}
              fontSize="1.25rem"
              color={step.type === 'review' ? 'theme-teal.500' : 'primary.500'}
            />
          </Center>
          <Stack spacing="0" flex={1} minW={0}>
            <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
              {step.name}
            </Text>
            <Text textStyle="caption-1" color="secondary.400" noOfLines={1}>
              {STEP_TYPE_CONFIG[step.type].title}
            </Text>
          </Stack>
        </HStack>
        <Icon as={BiGridVertical} fontSize="1.25rem" color="neutral.500" />
      </Flex>
    </Box>
  )
}
