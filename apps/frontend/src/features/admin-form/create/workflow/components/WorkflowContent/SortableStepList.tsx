import { Fragment, useCallback, useState } from 'react'
import { Box, Stack } from '@chakra-ui/react'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd'

import { FormWorkflowStepDto } from 'formsg-shared/types'

import {
  editDataSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useWorkflowMutations } from '../../mutations'

import { ActiveStepBlock } from './ActiveStepBlock'
import { InactiveStepBlock } from './InactiveStepBlock'
import { ReorderConfirmModal } from './ReorderConfirmModal'
import { WorkflowStepBlockDivider } from './WorkflowContent'

const WORKFLOW_DROPPABLE_ID = 'workflow-steps'

interface SortableStepListProps {
  steps: FormWorkflowStepDto[]
  onDeleteModalOpen: () => void
}

export const SortableStepList = ({
  steps,
  onDeleteModalOpen,
}: SortableStepListProps): JSX.Element => {
  const editState = useAdminWorkflowStore(editDataSelector)
  const { reorderStepsMutation } = useWorkflowMutations()

  const [pendingReorder, setPendingReorder] = useState<{
    fromIndex: number
    toIndex: number
  } | null>(null)

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return
      const fromIndex = result.source.index
      const toIndex = result.destination.index
      if (fromIndex === toIndex) return

      // If Step 1 is involved, show confirmation modal
      if (fromIndex === 0 || toIndex === 0) {
        setPendingReorder({ fromIndex, toIndex })
        return
      }

      reorderStepsMutation.mutate({ fromIndex, toIndex })
    },
    [reorderStepsMutation],
  )

  const handleConfirmReorder = useCallback(() => {
    if (!pendingReorder) return
    reorderStepsMutation.mutate(pendingReorder)
    setPendingReorder(null)
  }, [pendingReorder, reorderStepsMutation])

  const handleCancelReorder = useCallback(() => {
    setPendingReorder(null)
  }, [])

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId={WORKFLOW_DROPPABLE_ID}>
          {(provided) => (
            <Stack
              spacing="0"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {steps.map((step, i) => {
                const isEditing = editState?.stepNumber === i
                return (
                  <Fragment key={step._id}>
                    {i > 0 && <WorkflowStepBlockDivider />}
                    <Draggable draggableId={step._id} index={i}>
                      {(dragProvided, dragSnapshot) => (
                        <Box
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          opacity={dragSnapshot.isDragging ? 0.8 : 1}
                          transition="opacity 0.15s ease"
                        >
                          {isEditing ? (
                            <ActiveStepBlock
                              stepNumber={i}
                              step={step}
                              handleOpenDeleteModal={onDeleteModalOpen}
                            />
                          ) : (
                            <InactiveStepBlock stepNumber={i} step={step} />
                          )}
                        </Box>
                      )}
                    </Draggable>
                  </Fragment>
                )
              })}
              {provided.placeholder}
            </Stack>
          )}
        </Droppable>
      </DragDropContext>
      <ReorderConfirmModal
        isOpen={!!pendingReorder}
        onClose={handleCancelReorder}
        onConfirm={handleConfirmReorder}
      />
    </>
  )
}
