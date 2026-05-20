import { useCallback, useMemo, useRef } from 'react'
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

type CanvasStepCardProps = {
  step: WorkflowStep
  compact?: boolean
  sortable?: boolean
  isFocused?: boolean
}

export const CanvasStepCard = ({
  step,
  compact = false,
  sortable = false,
  isFocused = false,
}: CanvasStepCardProps): JSX.Element => {
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const removeStep = useWorkflowBuilderStore((s) => s.removeStep)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const isFaded = false

  const {
    attributes,
    listeners,
    setNodeRef,
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
    opacity: isSortDragging ? 0.5 : undefined,
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

  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)

  const showDragHandle = steps.length > 1
  const showDelete = steps.length > 1 && step.order > 0

  const handleCardClick = useCallback(() => {
    if (compact) {
      setFocus({ type: 'step_edit', stepId: step.id })
    }
  }, [compact, setFocus, step.id])

  const handleConfirmDelete = useCallback(() => {
    removeStep(step.id)
    onClose()
  }, [removeStep, step.id, onClose])

  return (
    <>
      <Box
        ref={setNodeRef}
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
        onClick={handleCardClick}
        _hover={
          compact
            ? {
                borderColor: 'secondary.300',
                boxShadow: 'sm',
                cursor: 'pointer',
              }
            : undefined
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

        {/* Detailed sections - hidden in compact mode */}
        {!compact && (
          <>
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
                    </Tag>
                  </WrapItem>
                ))}
                {stepRespondents.length === 0 && (
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

            {/* Fields section */}
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
            )}
          </>
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
    </>
  )
}
