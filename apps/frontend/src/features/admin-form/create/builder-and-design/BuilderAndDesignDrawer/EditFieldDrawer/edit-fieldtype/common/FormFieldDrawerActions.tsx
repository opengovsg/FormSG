import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FieldValues, UseFormHandleSubmit } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Divider,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { MultiSelect, SingleSelect } from '~components/Dropdown'

import {
  stepsSelector,
  useWorkflowBuilderStore,
} from '~features/admin-form/create/workflow-v2/workflowBuilderStore'

import {
  FieldBuilderState,
  stateDataSelector,
  useFieldBuilderStore,
} from '../../../../useFieldBuilderStore'

interface FormFieldDrawerActionsProps {
  isLoading: boolean
  handleClick: ReturnType<UseFormHandleSubmit<FieldValues>>
  handleCancel: () => void
  buttonText: string
  isDisabled?: boolean
}

export const FormFieldDrawerActions = ({
  isLoading,
  handleClick,
  handleCancel,
  buttonText,
  isDisabled,
}: FormFieldDrawerActionsProps): JSX.Element => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  return (
    <Box>
      <WorkflowFieldAssignment />
      <Divider mx="-1.5rem" w="auto" />
      <Stack
        direction={{ base: 'column', md: 'row-reverse' }}
        justifyContent="end"
        w="100%"
        spacing={{ base: '0.5rem', md: '1rem' }}
        pt="1.5rem"
      >
        <Button
          isFullWidth={isMobile}
          isDisabled={isDisabled}
          isLoading={isLoading}
          onClick={handleClick}
        >
          {buttonText}
        </Button>
        <Button
          isDisabled={isLoading}
          isFullWidth={isMobile}
          variant="clear"
          colorScheme="secondary"
          onClick={handleCancel}
        >
          {t('features.common.cancel')}
        </Button>
      </Stack>
    </Box>
  )
}

/**
 * Multi-select dropdown for assigning the current field to workflow steps.
 * Renders during both field creation and editing when a workflow exists.
 * During creation, selections are stored locally and applied once the field
 * is saved and receives an _id from the backend.
 */
const WorkflowFieldAssignment = (): JSX.Element | null => {
  const stateData = useFieldBuilderStore(stateDataSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const assignField = useWorkflowBuilderStore((s) => s.assignField)
  const unassignField = useWorkflowBuilderStore((s) => s.unassignField)
  const assignApprovalField = useWorkflowBuilderStore(
    (s) => s.assignApprovalField,
  )
  const unassignApprovalField = useWorkflowBuilderStore(
    (s) => s.unassignApprovalField,
  )

  const fieldId = useMemo(() => {
    if (stateData.state === FieldBuilderState.EditingField) {
      return stateData.field._id
    }
    return undefined
  }, [stateData])

  const isCreating = stateData.state === FieldBuilderState.CreatingField
  const hasWorkflow = steps.length > 1

  // Detect if field is yes_no type
  const isYesNo = useMemo(() => {
    if (
      stateData.state === FieldBuilderState.EditingField ||
      stateData.state === FieldBuilderState.CreatingField
    ) {
      return stateData.field.fieldType === 'yes_no'
    }
    return false
  }, [stateData])

  // Pending step selections made during field creation (before _id exists)
  const [pendingStepIds, setPendingStepIds] = useState<string[]>([])
  const pendingRef = useRef<string[]>([])

  // Pending approval step for creation mode
  const [pendingApprovalStepId, setPendingApprovalStepId] = useState('')
  const pendingApprovalRef = useRef('')

  // When fieldId appears after creation, apply any pending assignments
  useEffect(() => {
    if (fieldId && pendingRef.current.length > 0) {
      for (const stepId of pendingRef.current) {
        assignField(stepId, fieldId)
      }
      pendingRef.current = []
      setPendingStepIds([])
    }
    if (fieldId && pendingApprovalRef.current) {
      assignApprovalField(pendingApprovalRef.current, fieldId)
      pendingApprovalRef.current = ''
      setPendingApprovalStepId('')
    }
  }, [fieldId, assignField, assignApprovalField])

  // Reset pending state when entering creation mode
  useEffect(() => {
    if (isCreating) {
      setPendingStepIds([])
      pendingRef.current = []
      setPendingApprovalStepId('')
      pendingApprovalRef.current = ''
    }
  }, [isCreating])

  const items = useMemo(
    () => steps.map((s) => ({ value: s.id, label: s.name })),
    [steps],
  )

  const selectedValues = useMemo(
    () =>
      fieldId
        ? steps.filter((s) => s.fieldIds.includes(fieldId)).map((s) => s.id)
        : pendingStepIds,
    [steps, fieldId, pendingStepIds],
  )

  // Conflict modal state
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [conflictAction, setConflictAction] = useState<{
    stepId: string
    stepName: string
    direction: 'to_regular' | 'to_approval'
  } | null>(null)

  const handleChange = useCallback(
    (values: string[]) => {
      if (!fieldId) {
        // During creation: store selections locally
        setPendingStepIds(values)
        pendingRef.current = values
        return
      }
      // During editing: apply immediately
      const prev = new Set(selectedValues)
      const next = new Set(values)
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
      for (const v of selectedValues) {
        if (!next.has(v)) unassignField(v, fieldId)
      }
    },
    [selectedValues, assignField, unassignField, fieldId, steps, onOpen],
  )

  // Approval field section (yes_no only)
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
        : pendingApprovalStepId,
    [steps, fieldId, pendingApprovalStepId],
  )

  const handleApprovalChange = useCallback(
    (value: string) => {
      if (!fieldId) {
        // During creation: store locally
        setPendingApprovalStepId(value)
        pendingApprovalRef.current = value
        return
      }

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

  if (!hasWorkflow) return null

  return (
    <Box pb="2rem">
      <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
        Assign this field to a workflow step
      </Text>
      <MultiSelect
        name="workflowStepAssignment"
        items={items}
        values={selectedValues}
        onChange={handleChange}
        onBlur={() => {}}
        placeholder="Select a step from your workflow"
        isSelectedItemFullWidth
      />

      {/* Approval field assignment (yes_no fields only) */}
      {isYesNo && reviewStepItems.length > 0 && (
        <Box mt="1.5rem">
          <Text textStyle="subhead-1" color="secondary.500" mb="0.25rem">
            Approval field assignment
          </Text>
          <Text textStyle="body-2" color="secondary.400" mb="0.75rem">
            A Yes/No field can be a regular field or an approval indicator in a
            review step, not both.
          </Text>
          <SingleSelect
            name="approvalStepAssignment"
            items={reviewStepItems}
            value={selectedApprovalStepId}
            onChange={handleApprovalChange}
            placeholder="Select a review step"
            isClearable
          />
        </Box>
      )}

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
    </Box>
  )
}
