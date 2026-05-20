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

import { StepTypeCardOverlay } from './components/AddStepsPanel/StepTypeCard'
import { WorkflowCanvas } from './components/WorkflowCanvas/WorkflowCanvas'
import { WorkflowDrawer } from './components/WorkflowDrawer'
import type { StepType } from './types'
import {
  setFocusSelector,
  useWorkflowBuilderStore,
} from './workflowBuilderStore'

export const CreatePageWorkflowTabV2 = (): JSX.Element => {
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const reorderSteps = useWorkflowBuilderStore((s) => s.reorderSteps)
  const setPendingInsertIndex = useWorkflowBuilderStore(
    (s) => s.setPendingInsertIndex,
  )

  const [activeStepType, setActiveStepType] = useState<StepType | null>(null)

  // Require 8px of movement before activating drag, so clicks work normally
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'step_type') {
      setActiveStepType(data.stepType as StepType)
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveStepType(null)

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
      }
    },
    [setFocus, reorderSteps],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <WorkflowDrawer />
      <WorkflowCanvas isDragging={activeStepType !== null} />
      <DragOverlay>
        {activeStepType ? (
          <StepTypeCardOverlay stepType={activeStepType} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
