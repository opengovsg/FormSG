import { useCallback, useMemo, useState } from 'react'
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

import { RespondentCardOverlay } from './components/AddRespondentsPanel'
import { StepTypeCardOverlay } from './components/AddStepsPanel/StepTypeCard'
import { StepCardOverlay } from './components/WorkflowCanvas/CanvasStepCard'
import { WorkflowCanvas } from './components/WorkflowCanvas/WorkflowCanvas'
import { WorkflowDrawer } from './components/WorkflowDrawer'
import type { Respondent, StepType, WorkflowStep } from './types'
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
  const assignNotificationRecipient = useWorkflowBuilderStore(
    (s) => s.assignNotificationRecipient,
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
      }
    },
    [steps],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveStepType(null)
      setActiveDragStep(null)
      setActiveRespondent(null)

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
          reorderSteps(fromIndex, toIndex)
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
    },
    [
      setFocus,
      reorderSteps,
      assignRespondent,
      assignNotificationRecipient,
      setPendingInsertIndex,
    ],
  )

  return (
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
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
