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
  Flex,
  HStack,
  Icon,
  IconButton,
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

import type { WorkflowStep } from '../../types'
import {
  fieldsSelector,
  respondentsSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

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
  isDraggingYesNo?: boolean
  isDraggingRespondent?: boolean
}

export const CanvasStepCard = ({
  step,
  mode = 'summary',
  isFocused = false,
  isDraggingField = false,
  isDraggingYesNo = false,
  isDraggingRespondent = false,
}: CanvasStepCardProps): JSX.Element => {
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const removeStep = useWorkflowBuilderStore((s) => s.removeStep)
  const unassignRespondent = useWorkflowBuilderStore(
    (s) => s.unassignRespondent,
  )
  const unassignField = useWorkflowBuilderStore((s) => s.unassignField)
  const unassignApprovalField = useWorkflowBuilderStore(
    (s) => s.unassignApprovalField,
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
  const showSplitZones = isDraggingYesNo && step.type === 'review'
  const { setNodeRef: setFieldDropRef, isOver: isFieldDropOver } = useDroppable(
    {
      id: `card-field-drop-${step.id}`,
      data: { type: 'field_drop', stepId: step.id },
      disabled: !isDraggingField,
    },
  )
  const { setNodeRef: setApprovalDropRef, isOver: isApprovalDropOver } =
    useDroppable({
      id: `card-approval-drop-${step.id}`,
      data: { type: 'approval_field_drop', stepId: step.id },
      disabled: !(isDraggingYesNo && step.type === 'review'),
    })
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

  const approvalFields = useMemo(
    () => fields.filter((f) => step.approvalFieldIds.includes(f.id)),
    [fields, step.approvalFieldIds],
  )

  const allFieldsAssigned = useMemo(
    () => fields.length > 0 && step.fieldIds.length === fields.length,
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

  return (
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
            isFieldDropOver || isApprovalDropOver || isRespondentDropOver
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
            {isFieldDrag && showSplitZones ? (
              <>
                <Center
                  ref={setFieldDropRef}
                  w="100%"
                  flex={1}
                  py="1rem"
                  px="1rem"
                  borderRadius="4px"
                  border="2px dashed"
                  borderColor={isFieldDropOver ? 'primary.500' : 'primary.400'}
                  bg={isFieldDropOver ? 'primary.200' : 'primary.100'}
                  transition="background 0.15s, border-color 0.15s"
                >
                  <Text
                    textStyle="subhead-2"
                    color="primary.500"
                    textAlign="center"
                  >
                    + Drag into normal fields {step.name}
                  </Text>
                </Center>
                <Center
                  ref={setApprovalDropRef}
                  w="100%"
                  flex={1}
                  py="1rem"
                  px="1rem"
                  borderRadius="4px"
                  border="2px dashed"
                  borderColor={
                    isApprovalDropOver ? 'primary.500' : 'primary.400'
                  }
                  bg={isApprovalDropOver ? 'primary.200' : 'primary.100'}
                  transition="background 0.15s, border-color 0.15s"
                >
                  <Text
                    textStyle="subhead-2"
                    color="primary.500"
                    textAlign="center"
                  >
                    + Drag into approvals for {step.name}
                  </Text>
                </Center>
              </>
            ) : (
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
                transition="background 0.15s, border-color 0.15s"
              >
                <Text
                  textStyle="subhead-2"
                  color="primary.500"
                  textAlign="center"
                >
                  + Drag into {step.name}
                </Text>
              </Center>
            )}
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
        <Box
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
          py={compact ? '1rem' : '1.5rem'}
          cursor={
            isClickable
              ? sortable && steps.length > 1
                ? 'grab'
                : 'pointer'
              : undefined
          }
          onClick={handleCardClick}
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
          {/* Step header */}
          <Flex justify="space-between" align="center" px="1.5rem">
            <HStack spacing="1rem" flex={1} minW={0}>
              <Icon
                as={step.type === 'review' ? BiCheckCircle : BiSpreadsheet}
                fontSize="1.5rem"
                color="secondary.500"
                flexShrink={0}
              />
              <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
                {step.name}
              </Text>
            </HStack>
            <HStack
              spacing="0.5rem"
              flexShrink={0}
              align="center"
              opacity={isSummaryMode && showDragHandle ? 0 : 1}
              transition="opacity 0.15s ease"
              sx={
                isSummaryMode && showDragHandle
                  ? {
                      '[data-step-card]:hover &': { opacity: 1 },
                    }
                  : undefined
              }
            >
              {showDelete && (
                <IconButton
                  aria-label="Delete step"
                  icon={<BiTrash fontSize="1.25rem" />}
                  variant="clear"
                  size="xs"
                  minW="auto"
                  h="auto"
                  p="0.25rem"
                  color="danger.500"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpen()
                  }}
                />
              )}
              {isSummaryMode && showDragHandle && (
                <Box p="0.25rem" display="flex" alignItems="center">
                  <Icon as={BiEditAlt} fontSize="1.25rem" color="neutral.500" />
                </Box>
              )}
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
            {/* Respondent section */}
            <Stack spacing="0.5rem" px="1.5rem" mt="1rem">
              <Text textStyle="subhead-2" color="secondary.500">
                Respondents
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
                          <TagLabel textStyle="caption-1" color="secondary.500">
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

                {/* Approval fields (review steps only) */}
                {step.type === 'review' && (
                  <Stack spacing="0.5rem" px="1.5rem" mt="1rem">
                    <Text textStyle="subhead-2" color="secondary.500">
                      Approval fields
                    </Text>
                    <Wrap spacing="0.25rem">
                      {approvalFields.length > 0 ? (
                        approvalFields.map((f) => (
                          <WrapItem key={f.id}>
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
                                {f.number}. {f.name}
                              </TagLabel>
                              {showFieldRemove && (
                                <TagCloseButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    unassignApprovalField(step.id, f.id)
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

                    {/* Approval field drop zone */}
                    {showFieldRemove && (
                      <FieldDropZone
                        droppableId={`approval-field-drop-${step.id}`}
                        droppableData={{
                          type: 'approval_field_drop',
                          stepId: step.id,
                        }}
                        variant={isFocused ? 'step_focus' : 'pool'}
                        text="Drag a Yes/No field from the left panel"
                      />
                    )}
                  </Stack>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Lock icon for Step 1 during respondent phase */}
        {isLockedStep1 && (
          <Box position="absolute" top="0.75rem" right="0.75rem" zIndex={3}>
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
          <Icon
            as={step.type === 'review' ? BiCheckCircle : BiSpreadsheet}
            fontSize="1.5rem"
            color="secondary.500"
            flexShrink={0}
          />
          <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
            {step.name}
          </Text>
        </HStack>
        <Icon as={BiGridVertical} fontSize="1.25rem" color="neutral.500" />
      </Flex>
    </Box>
  )
}
