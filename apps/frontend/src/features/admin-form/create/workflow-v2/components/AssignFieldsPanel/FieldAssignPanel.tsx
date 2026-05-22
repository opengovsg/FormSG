import { useCallback, useMemo, useRef, useState } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  chakra,
  Divider,
  Flex,
  IconButton,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { MultiSelect, SingleSelect } from '~components/Dropdown'
import InlineMessage from '~components/InlineMessage'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  fieldsSelector,
  focusStateSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

export const FieldAssignPanel = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const assignField = useWorkflowBuilderStore((s) => s.assignField)
  const unassignField = useWorkflowBuilderStore((s) => s.unassignField)
  const assignApprovalField = useWorkflowBuilderStore(
    (s) => s.assignApprovalField,
  )
  const unassignApprovalField = useWorkflowBuilderStore(
    (s) => s.unassignApprovalField,
  )
  const { formId } = useParams()

  const fieldId =
    focusState.type === 'field_assign' ? focusState.fieldId : undefined
  const field = fields.find((f) => f.id === fieldId)

  // Conflict modal state
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [conflictAction, setConflictAction] = useState<{
    stepId: string
    stepName: string
    direction: 'to_regular' | 'to_approval'
  } | null>(null)

  const handleBack = useCallback(() => {
    setFocus({ type: 'phase', phase: 'assign_fields' })
  }, [setFocus])

  // Step assignment MultiSelect
  const stepItems = useMemo(
    () => steps.map((s) => ({ value: s.id, label: s.name })),
    [steps],
  )

  const selectedStepIds = useMemo(
    () =>
      fieldId
        ? steps.filter((s) => s.fieldIds.includes(fieldId)).map((s) => s.id)
        : [],
    [steps, fieldId],
  )

  const handleStepChange = useCallback(
    (values: string[]) => {
      if (!fieldId) return
      const prev = new Set(selectedStepIds)
      const next = new Set(values)

      // Additions
      for (const v of values) {
        if (!prev.has(v)) {
          // Check if field is an approval field in this step
          const step = steps.find((s) => s.id === v)
          if (step && step.approvalFieldIds.includes(fieldId)) {
            setConflictAction({
              stepId: v,
              stepName: step.name,
              direction: 'to_regular',
            })
            onOpen()
            return
          }
          assignField(v, fieldId)
        }
      }

      // Removals
      for (const v of selectedStepIds) {
        if (!next.has(v)) {
          unassignField(v, fieldId)
        }
      }
    },
    [selectedStepIds, assignField, unassignField, fieldId, steps, onOpen],
  )

  // Approval field SingleSelect (yes_no fields only)
  const isYesNo = field?.fieldType === 'yes_no'

  const reviewStepItems = useMemo(
    () =>
      steps
        .filter((s) => s.type === 'review')
        .map((s) => ({ value: s.id, label: s.name })),
    [steps],
  )

  const selectedApprovalStepId = useMemo(
    () =>
      fieldId
        ? (steps.find(
            (s) => s.type === 'review' && s.approvalFieldIds.includes(fieldId),
          )?.id ?? '')
        : '',
    [steps, fieldId],
  )

  const handleApprovalChange = useCallback(
    (value: string) => {
      if (!fieldId) return

      // Clearing selection
      if (!value) {
        if (selectedApprovalStepId) {
          unassignApprovalField(selectedApprovalStepId, fieldId)
        }
        return
      }

      // Check if field is a regular field in this step
      const step = steps.find((s) => s.id === value)
      if (step && step.fieldIds.includes(fieldId)) {
        setConflictAction({
          stepId: value,
          stepName: step.name,
          direction: 'to_approval',
        })
        onOpen()
        return
      }

      // Remove from previous approval step if any
      if (selectedApprovalStepId) {
        unassignApprovalField(selectedApprovalStepId, fieldId)
      }
      assignApprovalField(value, fieldId)
    },
    [
      fieldId,
      selectedApprovalStepId,
      steps,
      assignApprovalField,
      unassignApprovalField,
      onOpen,
    ],
  )

  const handleConfirmReassign = useCallback(() => {
    if (!conflictAction || !fieldId) return
    const { stepId, direction } = conflictAction

    if (direction === 'to_regular') {
      unassignApprovalField(stepId, fieldId)
      assignField(stepId, fieldId)
    } else {
      unassignField(stepId, fieldId)
      // Remove from previous approval step if any
      if (selectedApprovalStepId) {
        unassignApprovalField(selectedApprovalStepId, fieldId)
      }
      assignApprovalField(stepId, fieldId)
    }

    setConflictAction(null)
    onClose()
  }, [
    conflictAction,
    fieldId,
    selectedApprovalStepId,
    assignField,
    unassignField,
    assignApprovalField,
    unassignApprovalField,
    onClose,
  ])

  if (!field || !fieldId) return <></>

  return (
    <Flex
      h="100%"
      flexDir="column"
      borderRight="1px solid"
      borderColor="neutral.300"
    >
      {/* Header */}
      <Stack
        direction="row"
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        borderBottom="1px solid"
        borderColor="neutral.300"
        bg="white"
        zIndex={1}
      >
        <IconButton
          aria-label="Back to assign fields"
          icon={<BiLeftArrowAlt fontSize="1.25rem" />}
          variant="clear"
          colorScheme="secondary"
          size="sm"
          h="1.5rem"
          w="1.5rem"
          onClick={handleBack}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
          flex={1}
          textAlign="center"
          noOfLines={1}
        >
          Assign &ldquo;{field.number}. {field.name}&rdquo;
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Content */}
      <Flex
        flex={1}
        overflow="auto"
        px="1.5rem"
        pt="1rem"
        pb="1.5rem"
        flexDir="column"
      >
        {/* Info box */}
        <Box mb="1.5rem">
          <InlineMessage>
            To edit field settings, go to{' '}
            <chakra.span
              as="a"
              color="primary.500"
              cursor="pointer"
              textDecoration="underline"
              onClick={() => {
                if (formId) window.location.href = `/admin/form/${formId}`
              }}
            >
              form builder
            </chakra.span>
            .
          </InlineMessage>
        </Box>

        {/* Step assignment */}
        <Stack spacing="0.75rem">
          <Text textStyle="subhead-1" color="secondary.500">
            Assign to workflow steps
          </Text>
          <MultiSelect
            name="fieldStepAssignment"
            items={stepItems}
            values={selectedStepIds}
            onChange={handleStepChange}
            onBlur={() => {}}
            placeholder="Select steps from your workflow"
            isSelectedItemFullWidth
          />
        </Stack>

        {/* Approval field section (yes_no only) */}
        {isYesNo && reviewStepItems.length > 0 && (
          <>
            <Divider mx="-1.5rem" w="auto" mt="1.5rem" mb="1.5rem" />
            <Stack spacing="0.75rem">
              <Text textStyle="subhead-1" color="secondary.500">
                Approval field assignment
              </Text>
              <Text textStyle="body-2" color="secondary.400">
                A Yes/No field can be a regular field or an approval indicator
                in a review step, not both.
              </Text>
              <SingleSelect
                name="approvalStepAssignment"
                items={reviewStepItems}
                value={selectedApprovalStepId}
                onChange={handleApprovalChange}
                placeholder="Select a review step"
                isClearable
              />
            </Stack>
          </>
        )}

        {/* Footer */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button variant="outline" colorScheme="primary" onClick={handleBack}>
            Done editing
          </Button>
        </Flex>
      </Flex>

      {/* Conflict confirmation modal */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setConflictAction(null)
          onClose()
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader color="secondary.700">
              Reassign field?
            </AlertDialogHeader>
            <AlertDialogBody color="secondary.500" textStyle="body-2">
              {conflictAction?.direction === 'to_regular'
                ? `This field is currently an approval field in "${conflictAction.stepName}". Reassign it as a regular field?`
                : `This field is currently a regular field in "${conflictAction?.stepName}". Reassign it as an approval field?`}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => {
                  setConflictAction(null)
                  onClose()
                }}
                variant="clear"
              >
                Cancel
              </Button>
              <Button
                colorScheme="primary"
                onClick={handleConfirmReassign}
                ml={3}
              >
                Reassign
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  )
}
