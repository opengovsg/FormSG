import { useCallback, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from '@chakra-ui/react'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import { ModalCloseButton } from '~components/Modal'

import { RespondentCardOverlay } from './components/AddRespondentsPanel'
import { StepTypeCardOverlay } from './components/AddStepsPanel/StepTypeCard'
import { FieldCardOverlay } from './components/AssignFieldsPanel'
import { StepCardOverlay } from './components/WorkflowCanvas/CanvasStepCard'
import { WorkflowCanvas } from './components/WorkflowCanvas/WorkflowCanvas'
import { WorkflowDrawer } from './components/WorkflowDrawer'
import type { FormField, Respondent, StepType, WorkflowStep } from './types'
import {
  focusStateSelector,
  respondentsSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from './workflowBuilderStore'

export const CreatePageWorkflowTabV2 = (): JSX.Element => {
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const reorderSteps = useWorkflowBuilderStore((s) => s.reorderSteps)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const assignRespondent = useWorkflowBuilderStore((s) => s.assignRespondent)
  const unassignRespondent = useWorkflowBuilderStore(
    (s) => s.unassignRespondent,
  )
  const assignNotificationRecipient = useWorkflowBuilderStore(
    (s) => s.assignNotificationRecipient,
  )
  const assignField = useWorkflowBuilderStore((s) => s.assignField)
  const assignApprovalField = useWorkflowBuilderStore(
    (s) => s.assignApprovalField,
  )
  const setPendingInsertIndex = useWorkflowBuilderStore(
    (s) => s.setPendingInsertIndex,
  )

  const [activeStepType, setActiveStepType] = useState<StepType | null>(null)
  const [activeDragStep, setActiveDragStep] = useState<WorkflowStep | null>(
    null,
  )
  const [activeRespondent, setActiveRespondent] = useState<Respondent | null>(
    null,
  )
  const [activeField, setActiveField] = useState<FormField | null>(null)

  // Step 1 reorder confirmation modal
  const [pendingReorder, setPendingReorder] = useState<{
    fromIndex: number
    toIndex: number
  } | null>(null)

  // Require 8px of movement before activating drag, so clicks work normally
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current
      if (data?.type === 'step_type') {
        setActiveStepType(data.stepType as StepType)
      } else if (data?.type === 'step_card') {
        const step = steps.find((s) => s.id === event.active.id)
        if (step) setActiveDragStep(step)
      } else if (data?.type === 'respondent_card') {
        setActiveRespondent(data.respondent as Respondent)
      } else if (data?.type === 'field_card') {
        setActiveField(data.field as FormField)
      }
    },
    [steps],
  )

  const executeReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      // Check if this reorder involves position 0 (step 1)
      const involvesStep1 = fromIndex === 0 || toIndex === 0

      if (involvesStep1) {
        // Clear respondents from both involved steps after reorder
        const stepAtFrom = steps[fromIndex]
        const stepAtTo = steps[toIndex]

        reorderSteps(fromIndex, toIndex)

        // Clear respondents from both steps
        if (stepAtFrom) {
          stepAtFrom.respondentIds.forEach((rId) =>
            unassignRespondent(stepAtFrom.id, rId),
          )
        }
        if (stepAtTo) {
          stepAtTo.respondentIds.forEach((rId) =>
            unassignRespondent(stepAtTo.id, rId),
          )
        }

        // Auto-assign "Anyone with the form link" to the new step 1
        // After reorder, the step at index 0 is the new step 1
        const reorderedSteps = useWorkflowBuilderStore.getState().steps
        if (reorderedSteps[0]) {
          assignRespondent(reorderedSteps[0].id, 'resp-form-link')
        }
      } else {
        reorderSteps(fromIndex, toIndex)
      }
    },
    [steps, reorderSteps, unassignRespondent, assignRespondent],
  )

  const handleConfirmReorder = useCallback(() => {
    if (pendingReorder) {
      executeReorder(pendingReorder.fromIndex, pendingReorder.toIndex)
      setPendingReorder(null)
    }
  }, [pendingReorder, executeReorder])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveStepType(null)
      setActiveDragStep(null)
      setActiveRespondent(null)
      setActiveField(null)

      const { active, over } = event
      if (!over) return

      const activeData = active.data.current
      const overData = over.data.current

      // Drag-to-add: step type dropped on a drop zone
      if (activeData?.type === 'step_type' && overData?.type === 'drop_zone') {
        setPendingInsertIndex(null)
        setFocus({
          type: 'step_naming',
          stepType: activeData.stepType as StepType,
          insertIndex: overData.insertIndex as number,
        })
        return
      }

      // Step reorder: canvas step card moved
      if (activeData?.type === 'step_card' && overData?.type === 'step_card') {
        const fromIndex = activeData.sortIndex as number
        const toIndex = overData.sortIndex as number
        if (fromIndex !== toIndex) {
          // If this involves step 1, show confirmation modal
          if (fromIndex === 0 || toIndex === 0) {
            setPendingReorder({ fromIndex, toIndex })
          } else {
            reorderSteps(fromIndex, toIndex)
          }
        }
        return
      }

      // Respondent dropped on step card
      if (
        activeData?.type === 'respondent_card' &&
        overData?.type === 'respondent_drop'
      ) {
        const respondentId = active.id as string
        const stepId = overData.stepId as string
        assignRespondent(stepId, respondentId)
        // Auto-focus the step after drop
        setFocus({
          type: 'step_focus',
          phase: 'add_respondents',
          stepId,
        })
        return
      }

      // Respondent dropped on notification card
      if (
        activeData?.type === 'respondent_card' &&
        overData?.type === 'notification_drop'
      ) {
        assignNotificationRecipient(active.id as string)
        return
      }

      // Field dropped on step card (regular fields)
      if (
        activeData?.type === 'field_card' &&
        overData?.type === 'field_drop'
      ) {
        const fieldId = active.id as string
        const stepId = overData.stepId as string
        assignField(stepId, fieldId)
        setFocus({
          type: 'step_focus',
          phase: 'assign_fields',
          stepId,
        })
        return
      }

      // Field dropped on approval zone (review steps)
      if (
        activeData?.type === 'field_card' &&
        overData?.type === 'approval_field_drop'
      ) {
        const fieldId = active.id as string
        const stepId = overData.stepId as string
        assignApprovalField(stepId, fieldId)
        setFocus({
          type: 'step_focus',
          phase: 'assign_fields',
          stepId,
        })
        return
      }
    },
    [
      setFocus,
      reorderSteps,
      assignRespondent,
      assignNotificationRecipient,
      assignField,
      assignApprovalField,
      setPendingInsertIndex,
    ],
  )

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <WorkflowDrawer />
        <WorkflowCanvas
          isDragging={activeStepType !== null}
          isDraggingRespondent={activeRespondent !== null}
        />
        <DragOverlay>
          {activeStepType ? (
            <StepTypeCardOverlay stepType={activeStepType} />
          ) : activeDragStep ? (
            <StepCardOverlay step={activeDragStep} />
          ) : activeRespondent ? (
            <RespondentCardOverlay respondent={activeRespondent} />
          ) : activeField ? (
            <FieldCardOverlay field={activeField} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Step 1 reorder confirmation modal */}
      <Modal
        isOpen={pendingReorder !== null}
        onClose={() => setPendingReorder(null)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700" pr="4rem">
            Moving step to position 1
          </ModalHeader>
          <ModalBody color="secondary.500" textStyle="body-2">
            Step 1 is always accessed via the form link. Moving this step to
            position 1 will:
            <Box as="ul" pl="1.25rem" mt="0.5rem">
              <li>Clear respondents from both steps</li>
              <li>
                Assign &ldquo;Anyone with the form link&rdquo; to the new Step 1
              </li>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Stack
              spacing="1rem"
              w="100%"
              direction={{ base: 'column', md: 'row-reverse' }}
            >
              <Button colorScheme="primary" onClick={handleConfirmReorder}>
                Confirm
              </Button>
              <Button
                colorScheme="secondary"
                variant="clear"
                onClick={() => setPendingReorder(null)}
              >
                Cancel
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
