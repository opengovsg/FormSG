import { useCallback, useMemo, useRef, useState } from 'react'
import {
  BiCheckCircle,
  BiGridVertical,
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
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { WorkflowStep } from '../../types'
import {
  fieldsSelector,
  respondentsSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { RespondentDropZone } from './RespondentDropZone'

export type StepCardMode =
  | 'summary'
  | 'add_steps'
  | 'respondent_pool'
  | 'respondent_focus'

type CanvasStepCardProps = {
  step: WorkflowStep
  mode?: StepCardMode
  isFocused?: boolean
}

export const CanvasStepCard = ({
  step,
  mode = 'summary',
  isFocused = false,
}: CanvasStepCardProps): JSX.Element => {
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const removeStep = useWorkflowBuilderStore((s) => s.removeStep)
  const unassignRespondent = useWorkflowBuilderStore(
    (s) => s.unassignRespondent,
  )
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Derived mode flags
  const isAddSteps = mode === 'add_steps'
  const isRespondentPhase =
    mode === 'respondent_pool' || mode === 'respondent_focus'
  const compact = isAddSteps
  const sortable = isAddSteps

  const isFaded = false

  // Sortable (for add_steps reorder)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({
    id: step.id,
    data: { type: 'step_card', sortIndex: step.order },
    disabled: !sortable || steps.length <= 1,
  })

  const style = {
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

  // Step 1 (order 0) is locked during respondent phase - no drop zone, no click, no remove
  const isFirstStep = step.order === 0

  const showDragHandle = isAddSteps && steps.length > 1
  const showDelete = isAddSteps && steps.length > 1 && step.order > 0

  const handleCardClick = useCallback(() => {
    if (isAddSteps && compact) {
      setFocus({ type: 'step_edit', stepId: step.id })
    } else if (isRespondentPhase && !isFirstStep) {
      setFocus({
        type: 'step_focus',
        phase: 'add_respondents',
        stepId: step.id,
      })
    }
  }, [isAddSteps, isRespondentPhase, isFirstStep, compact, setFocus, step.id])

  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = useCallback(() => {
    onClose()
    setIsDeleting(true)
    setTimeout(() => {
      removeStep(step.id)
    }, 300)
  }, [removeStep, step.id, onClose])

  // Show fields sections only in summary and add_steps modes
  const showFieldsSections = !isRespondentPhase

  // Show respondent drop zone in respondent phase (except Step 1)
  const showRespondentDropZone = isRespondentPhase && !isFirstStep

  // Respondent chips get X buttons during respondent phase (except Step 1)
  const showRespondentRemove = isRespondentPhase && !isFirstStep

  // Clickable card in add_steps compact or respondent phase (except Step 1)
  const isClickable =
    (isAddSteps && compact) || (isRespondentPhase && !isFirstStep)

  const cardRef = setSortableRef

  return (
    <Box
      overflow="hidden"
      maxH={isDeleting ? 0 : '40rem'}
      opacity={isDeleting ? 0 : 1}
      transform={isDeleting ? 'scale(0.95)' : 'scale(1)'}
      transition="max-height 0.3s ease, opacity 0.2s ease, transform 0.2s ease"
    >
      <Box
        ref={cardRef}
        {...(sortable && steps.length > 1
          ? { ...listeners, ...attributes }
          : {})}
        style={style}
        w="100%"
        textAlign="start"
        borderRadius="8px"
        bg="white"
        border={isFocused ? '2px solid' : '1px solid'}
        borderColor={isFocused ? 'primary.500' : 'neutral.300'}
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
          <HStack spacing="0.5rem" flexShrink={0} align="center">
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
          <Stack spacing="0.5rem" px="1.5rem" mt="1.5rem">
            <Text textStyle="subhead-2" color="secondary.500">
              Respondent in this step
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
              <Stack spacing="0.5rem" px="1.5rem" mt="1.5rem">
                <Text textStyle="subhead-2" color="secondary.500">
                  Fields to fill
                </Text>
                <Wrap spacing="0.25rem">
                  {allFieldsAssigned ? (
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
                          <TagLabel textStyle="caption-1" color="secondary.500">
                            {f.number}. {f.name}
                          </TagLabel>
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
              </Stack>

              {/* Approval fields (review steps only) */}
              {step.type === 'review' && (
                <Stack spacing="0.5rem" px="1.5rem" mt="1.5rem">
                  <Text textStyle="subhead-2" color="secondary.500">
                    Fields to indicate approval
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
                </Stack>
              )}
            </>
          )}
        </Box>
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
      borderRadius="8px"
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
