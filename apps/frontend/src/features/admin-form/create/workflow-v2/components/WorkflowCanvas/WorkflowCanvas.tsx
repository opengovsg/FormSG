import { Fragment, useCallback, useState } from 'react'
import { BiCheckCircle, BiGridVertical, BiSpreadsheet } from 'react-icons/bi'
import { Box, Flex, HStack, Icon, Text } from '@chakra-ui/react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import type { StepType } from '../../types'
import {
  focusStateSelector,
  pendingInsertIndexSelector,
  previewStepNameSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import {
  AddStepConnector,
  ConnectionLine,
  WorkflowEndDivider,
} from './CanvasDecorations'
import { CanvasStepCard } from './CanvasStepCard'
import { DropZone } from './DropZone'
import { EmailNotificationCard } from './EmailNotificationCard'

type WorkflowCanvasProps = {
  isDragging?: boolean
}

/**
 * Preview card shown during step naming, before the step is saved.
 */
const PreviewStepCard = ({
  stepType,
  name,
}: {
  stepType: StepType
  name: string
}): JSX.Element => (
  <Box
    w="100%"
    borderRadius="8px"
    bg="white"
    border="2px solid"
    borderColor="primary.500"
    py="1rem"
  >
    <Flex justify="space-between" align="center" px="1.5rem">
      <HStack spacing="1rem" flex={1} minW={0}>
        <Icon
          as={stepType === 'review' ? BiCheckCircle : BiSpreadsheet}
          fontSize="1.5rem"
          color="secondary.500"
          flexShrink={0}
        />
        <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
          {name}
        </Text>
      </HStack>
      <Icon as={BiGridVertical} fontSize="1.25rem" color="neutral.500" />
    </Flex>
  </Box>
)

/**
 * Hover area between steps in summary view.
 * On hover, expands to reveal a "+" button (like parting the Red Sea).
 * Collapsed: just a normal ConnectionLine.
 * Expanded: ConnectionLine + "+" button + ConnectionLine with smooth height transition.
 */
const ExpandableConnectorGap = ({
  onClick,
}: {
  onClick: () => void
}): JSX.Element => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Normal chevron connector - always visible */}
      <ConnectionLine />

      {/* "+" button expands on hover */}
      <Box
        overflow="hidden"
        maxH={isHovered ? '5rem' : '0'}
        opacity={isHovered ? 1 : 0}
        transition="max-height 0.25s ease-out, opacity 0.2s ease-out"
      >
        <AddStepConnector onClick={onClick} />
        <ConnectionLine />
      </Box>
    </Box>
  )
}

export const WorkflowCanvas = ({
  isDragging = false,
}: WorkflowCanvasProps): JSX.Element => {
  const steps = useWorkflowBuilderStore(stepsSelector)
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const previewStepName = useWorkflowBuilderStore(previewStepNameSelector)
  const pendingInsertIndex = useWorkflowBuilderStore(pendingInsertIndexSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const setPendingInsertIndex = useWorkflowBuilderStore(
    (s) => s.setPendingInsertIndex,
  )

  const isAddStepsPhase =
    focusState.type === 'phase' && focusState.phase === 'add_steps'
  const isStepNaming = focusState.type === 'step_naming'
  const isStepEdit = focusState.type === 'step_edit'
  const isInAddStepsContext = isAddStepsPhase || isStepNaming || isStepEdit
  const isSummary =
    focusState.type === 'summary' ||
    (focusState.type === 'phase' && focusState.phase !== 'add_steps')

  const namingInsertIndex = isStepNaming ? focusState.insertIndex : -1
  const namingStepType = isStepNaming ? focusState.stepType : 'collect'

  // Focused insert mode: "+" was clicked, showing drop zone at that position
  // Stays active during drag so the focused drop zone persists
  const isFocusedInsert = isAddStepsPhase && pendingInsertIndex !== null

  // During step naming, step edit, or focused insert, non-focused elements fade
  const editingStepId = isStepEdit ? focusState.stepId : null
  const hasFocusedView = isStepNaming || isStepEdit || isFocusedInsert
  const fadedOpacity = hasFocusedView ? 0.5 : 1

  const handleAddStepClick = useCallback(
    (insertIndex: number) => {
      setPendingInsertIndex(insertIndex)
      setFocus({ type: 'phase', phase: 'add_steps' })
    },
    [setFocus, setPendingInsertIndex],
  )

  const stepIds = steps.map((s) => s.id)

  return (
    <Box flex={1} overflow="auto" bg="primary.100">
      <Box maxW="42.5rem" py="2rem" px="1rem" mx="auto">
        <SortableContext
          items={stepIds}
          strategy={verticalListSortingStrategy}
          disabled={!isAddStepsPhase}
        >
          {steps.map((step, i) => (
            <Fragment key={step.id}>
              {i > 0 && (
                <>
                  {/* Summary view: hover-reveal "+" between steps */}
                  {isSummary && (
                    <ExpandableConnectorGap
                      onClick={() => handleAddStepClick(i)}
                    />
                  )}

                  {/* Add Steps focused insert: drop zone at pendingInsertIndex, faded connectors elsewhere */}
                  {isFocusedInsert &&
                    (pendingInsertIndex === i ? (
                      <>
                        <Box opacity={fadedOpacity} transition="opacity 0.2s">
                          <ConnectionLine />
                        </Box>
                        <DropZone insertIndex={i} />
                        <Box opacity={fadedOpacity} transition="opacity 0.2s">
                          <ConnectionLine />
                        </Box>
                      </>
                    ) : (
                      <Box opacity={fadedOpacity} transition="opacity 0.2s">
                        <ConnectionLine />
                      </Box>
                    ))}

                  {/* Add Steps normal idle: "+" between every step */}
                  {isAddStepsPhase && !isDragging && !isFocusedInsert && (
                    <Box transition="opacity 0.2s">
                      <ConnectionLine />
                      <AddStepConnector onClick={() => handleAddStepClick(i)} />
                      <ConnectionLine />
                    </Box>
                  )}

                  {/* Add Steps dragging (non-focused): drop zones everywhere */}
                  {isAddStepsPhase && isDragging && !isFocusedInsert && (
                    <Box transition="opacity 0.2s">
                      <ConnectionLine />
                      <DropZone insertIndex={i} isDragging />
                      <ConnectionLine />
                    </Box>
                  )}

                  {/* Step naming/editing: just connection lines */}
                  {(isStepNaming || isStepEdit) && (
                    <Box opacity={fadedOpacity} transition="opacity 0.2s">
                      <ConnectionLine />
                    </Box>
                  )}
                </>
              )}

              {/* During naming, insert preview card at the right position */}
              {isStepNaming && namingInsertIndex === i && (
                <>
                  <PreviewStepCard
                    stepType={namingStepType}
                    name={previewStepName || ''}
                  />
                  <Box opacity={fadedOpacity} transition="opacity 0.2s">
                    <ConnectionLine />
                  </Box>
                </>
              )}

              <Box
                opacity={editingStepId === step.id ? 1 : fadedOpacity}
                transition="opacity 0.2s"
              >
                <CanvasStepCard
                  step={step}
                  compact={isInAddStepsContext}
                  sortable={isAddStepsPhase}
                  isFocused={editingStepId === step.id}
                />
              </Box>
            </Fragment>
          ))}
        </SortableContext>

        {/* After last step - connection line + connector */}
        {isFocusedInsert ? (
          // Focused insert: only show drop zone at the focused position
          pendingInsertIndex === steps.length ? (
            <>
              <Box opacity={fadedOpacity} transition="opacity 0.2s">
                <ConnectionLine />
              </Box>
              <DropZone insertIndex={steps.length} isDragging={isDragging} />
            </>
          ) : null
        ) : isStepNaming ? (
          // Step naming: preview card at end
          namingInsertIndex >= steps.length ? (
            <>
              <Box opacity={fadedOpacity} transition="opacity 0.2s">
                <ConnectionLine />
              </Box>
              <PreviewStepCard
                stepType={namingStepType}
                name={previewStepName || ''}
              />
            </>
          ) : null
        ) : (
          // All other states: show connection line + appropriate connector
          <>
            <Box opacity={fadedOpacity} transition="opacity 0.2s">
              <ConnectionLine />
            </Box>
            {isAddStepsPhase && !isDragging && (
              <AddStepConnector
                onClick={() => handleAddStepClick(steps.length)}
              />
            )}
            {isAddStepsPhase && isDragging && !isFocusedInsert && (
              <DropZone insertIndex={steps.length} isDragging />
            )}
          </>
        )}

        {/* Summary / naming / editing: always-visible "+" at bottom */}
        {!isAddStepsPhase && (
          <Box opacity={fadedOpacity} transition="opacity 0.2s">
            <AddStepConnector
              onClick={() => handleAddStepClick(steps.length)}
            />
          </Box>
        )}

        <Box opacity={fadedOpacity} transition="opacity 0.2s">
          <WorkflowEndDivider />
          <EmailNotificationCard />
        </Box>
      </Box>
    </Box>
  )
}
