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
import { CanvasStepCard, type StepCardMode } from './CanvasStepCard'
import { DropZone } from './DropZone'
import { EmailNotificationCard } from './EmailNotificationCard'

type WorkflowCanvasProps = {
  isDragging?: boolean
  isDraggingRespondent?: boolean
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
  isDraggingRespondent: _isDraggingRespondent = false,
}: WorkflowCanvasProps): JSX.Element => {
  const steps = useWorkflowBuilderStore(stepsSelector)
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const previewStepName = useWorkflowBuilderStore(previewStepNameSelector)
  const pendingInsertIndex = useWorkflowBuilderStore(pendingInsertIndexSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const setPendingInsertIndex = useWorkflowBuilderStore(
    (s) => s.setPendingInsertIndex,
  )

  // Add Steps phase flags
  const isAddStepsPhase =
    focusState.type === 'phase' && focusState.phase === 'add_steps'
  const isStepNaming = focusState.type === 'step_naming'
  const isStepEdit = focusState.type === 'step_edit' && !focusState.fromSummary
  const isStepEditFromSummary =
    focusState.type === 'step_edit' && !!focusState.fromSummary
  const stepEditFromSummaryId = isStepEditFromSummary ? focusState.stepId : null
  const isInAddStepsContext = isAddStepsPhase || isStepNaming || isStepEdit

  // Respondent phase flags
  const isRespondentPoolPhase =
    focusState.type === 'phase' && focusState.phase === 'add_respondents'
  const isRespondentStepFocus =
    focusState.type === 'step_focus' && focusState.phase === 'add_respondents'
  const respondentStepFocusId = isRespondentStepFocus ? focusState.stepId : null
  const isNewRespondent = focusState.type === 'new_respondent'
  const isEditRespondent = focusState.type === 'edit_respondent'
  const isNotificationFocus = focusState.type === 'notification_focus'
  const isNotificationEdit = focusState.type === 'notification_edit'
  const isInRespondentContext =
    isRespondentPoolPhase ||
    isRespondentStepFocus ||
    isNewRespondent ||
    isEditRespondent ||
    isNotificationFocus

  // Field phase flags
  const isFieldPoolPhase =
    focusState.type === 'phase' && focusState.phase === 'assign_fields'
  const isFieldStepFocus =
    focusState.type === 'step_focus' && focusState.phase === 'assign_fields'
  const fieldStepFocusId = isFieldStepFocus ? focusState.stepId : null
  const isInFieldContext = isFieldPoolPhase || isFieldStepFocus

  // Summary: default view or any non-add-steps/non-respondent/non-field phase
  const isSummary =
    !isInAddStepsContext &&
    !isInRespondentContext &&
    !isInFieldContext &&
    !isStepEditFromSummary &&
    !isNotificationEdit

  const namingInsertIndex = isStepNaming ? focusState.insertIndex : -1
  const namingStepType = isStepNaming ? focusState.stepType : 'collect'

  // Focused insert mode: "+" was clicked, showing drop zone at that position
  const isFocusedInsert = isAddStepsPhase && pendingInsertIndex !== null

  // During step naming, step edit, focused insert, or respondent step focus, non-focused elements fade
  const editingStepId = isStepEdit ? focusState.stepId : null
  const hasFocusedView =
    isStepNaming ||
    isStepEdit ||
    isFocusedInsert ||
    isRespondentStepFocus ||
    isNotificationFocus ||
    isNotificationEdit ||
    isFieldStepFocus ||
    isStepEditFromSummary
  const fadedOpacity = hasFocusedView ? 0.5 : 1

  // Determine step card mode
  const getStepCardMode = (): StepCardMode => {
    if (isInAddStepsContext) return 'add_steps'
    if (isRespondentStepFocus || isNotificationFocus) return 'respondent_focus'
    if (isInRespondentContext) return 'respondent_pool'
    if (isFieldStepFocus) return 'field_focus'
    if (isInFieldContext) return 'field_pool'
    return 'summary'
  }
  const stepCardMode = getStepCardMode()

  const handleAddStepClick = useCallback(
    (insertIndex: number) => {
      setPendingInsertIndex(insertIndex)
      setFocus({ type: 'phase', phase: 'add_steps' })
    },
    [setFocus, setPendingInsertIndex],
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only trigger if clicking the canvas background itself, not a child
      if (e.target !== e.currentTarget) return

      if (isNotificationEdit) {
        setFocus({ type: 'summary' })
      } else if (isRespondentStepFocus || isNotificationFocus) {
        setFocus({ type: 'phase', phase: 'add_respondents' })
      } else if (isFieldStepFocus) {
        setFocus({ type: 'phase', phase: 'assign_fields' })
      } else if (isStepEdit) {
        setFocus({ type: 'phase', phase: 'add_steps' })
      } else if (isStepEditFromSummary) {
        setFocus({ type: 'summary' })
      }
    },
    [
      isNotificationEdit,
      isRespondentStepFocus,
      isNotificationFocus,
      isFieldStepFocus,
      isStepEdit,
      isStepEditFromSummary,
      setFocus,
    ],
  )

  const stepIds = steps.map((s) => s.id)

  return (
    <Box flex={1} overflow="auto" bg="primary.100" onClick={handleCanvasClick}>
      <Box
        maxW="42.5rem"
        py="2rem"
        px="1rem"
        mx="auto"
        onClick={handleCanvasClick}
      >
        <SortableContext
          items={stepIds}
          strategy={verticalListSortingStrategy}
          disabled={!isAddStepsPhase && !isSummary}
        >
          {steps.map((step, i) => (
            <Fragment key={step.id}>
              {i > 0 && (
                <>
                  {/* Between-step connectors: crossfade between summary and add-steps modes */}
                  {(() => {
                    const showAddStepsConnectors = isAddStepsPhase
                    const hasVisibleMiddle =
                      showAddStepsConnectors &&
                      ((!isDragging && !isFocusedInsert) ||
                        (isDragging && !isFocusedInsert) ||
                        (isFocusedInsert && pendingInsertIndex === i))

                    return (
                      <Box position="relative">
                        {/* Summary mode: hover-expandable gap (hidden during add steps and respondent phases) */}
                        <Box
                          opacity={isSummary ? 1 : 0}
                          maxH={isSummary ? 'none' : 0}
                          overflow={isSummary ? 'visible' : 'hidden'}
                          transition="opacity 0.35s ease, max-height 0.35s ease"
                          pointerEvents={isSummary ? 'auto' : 'none'}
                        >
                          <ExpandableConnectorGap
                            onClick={() => handleAddStepClick(i)}
                          />
                        </Box>

                        {/* Add Steps mode: connection line + connectors (fades in from summary) */}
                        <Box
                          opacity={showAddStepsConnectors ? 1 : 0}
                          maxH={showAddStepsConnectors ? '12rem' : 0}
                          overflow="hidden"
                          transition="opacity 0.35s ease, max-height 0.35s ease"
                          pointerEvents={
                            showAddStepsConnectors ? 'auto' : 'none'
                          }
                        >
                          <Box
                            opacity={fadedOpacity}
                            transition="opacity 0.3s ease"
                          >
                            <ConnectionLine />
                          </Box>

                          <Box
                            opacity={!isDragging && !isFocusedInsert ? 1 : 0}
                            maxH={!isDragging && !isFocusedInsert ? '4rem' : 0}
                            overflow="hidden"
                            transition="opacity 0.3s ease, max-height 0.3s ease"
                            pointerEvents={
                              !isDragging && !isFocusedInsert ? 'auto' : 'none'
                            }
                          >
                            <AddStepConnector
                              onClick={() => handleAddStepClick(i)}
                            />
                          </Box>

                          {isDragging && !isFocusedInsert && (
                            <DropZone insertIndex={i} isDragging />
                          )}

                          {isFocusedInsert && pendingInsertIndex === i && (
                            <DropZone insertIndex={i} isDragging={isDragging} />
                          )}

                          {hasVisibleMiddle && (
                            <Box
                              opacity={fadedOpacity}
                              transition="opacity 0.3s ease"
                            >
                              <ConnectionLine />
                            </Box>
                          )}
                        </Box>

                        {/* Step naming/editing: just a connection line */}
                        <Box
                          opacity={
                            isStepNaming || isStepEdit ? fadedOpacity : 0
                          }
                          maxH={isStepNaming || isStepEdit ? '4rem' : 0}
                          overflow="hidden"
                          transition="opacity 0.35s ease, max-height 0.35s ease"
                        >
                          <ConnectionLine />
                        </Box>

                        {/* Respondent phase: just a connection line (no "+" buttons) */}
                        <Box
                          opacity={isInRespondentContext ? fadedOpacity : 0}
                          maxH={isInRespondentContext ? '4rem' : 0}
                          overflow="hidden"
                          transition="opacity 0.35s ease, max-height 0.35s ease"
                        >
                          <ConnectionLine />
                        </Box>

                        {/* Field phase: just a connection line (no "+" buttons) */}
                        <Box
                          opacity={isInFieldContext ? fadedOpacity : 0}
                          maxH={isInFieldContext ? '4rem' : 0}
                          overflow="hidden"
                          transition="opacity 0.35s ease, max-height 0.35s ease"
                        >
                          <ConnectionLine />
                        </Box>

                        {/* Step edit from summary: just a connection line */}
                        <Box
                          opacity={isStepEditFromSummary ? fadedOpacity : 0}
                          maxH={isStepEditFromSummary ? '4rem' : 0}
                          overflow="hidden"
                          transition="opacity 0.35s ease, max-height 0.35s ease"
                        >
                          <ConnectionLine />
                        </Box>

                        {/* Notification edit: just a connection line */}
                        <Box
                          opacity={isNotificationEdit ? fadedOpacity : 0}
                          maxH={isNotificationEdit ? '4rem' : 0}
                          overflow="hidden"
                          transition="opacity 0.35s ease, max-height 0.35s ease"
                        >
                          <ConnectionLine />
                        </Box>
                      </Box>
                    )
                  })()}
                </>
              )}

              {/* During naming, insert preview card at the right position */}
              {isStepNaming && namingInsertIndex === i && (
                <>
                  <PreviewStepCard
                    stepType={namingStepType}
                    name={previewStepName || ''}
                  />
                  <Box opacity={fadedOpacity} transition="opacity 0.3s ease">
                    <ConnectionLine />
                  </Box>
                </>
              )}

              <Box
                opacity={
                  editingStepId === step.id ||
                  respondentStepFocusId === step.id ||
                  fieldStepFocusId === step.id ||
                  stepEditFromSummaryId === step.id
                    ? 1
                    : fadedOpacity
                }
                transition="opacity 0.3s ease"
              >
                <CanvasStepCard
                  step={step}
                  mode={stepCardMode}
                  isFocused={
                    editingStepId === step.id ||
                    respondentStepFocusId === step.id ||
                    fieldStepFocusId === step.id ||
                    stepEditFromSummaryId === step.id
                  }
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
              <Box opacity={fadedOpacity} transition="opacity 0.3s ease">
                <ConnectionLine />
              </Box>
              <DropZone insertIndex={steps.length} isDragging={isDragging} />
            </>
          ) : null
        ) : isStepNaming ? (
          // Step naming: preview card at end
          namingInsertIndex >= steps.length ? (
            <>
              <Box opacity={fadedOpacity} transition="opacity 0.3s ease">
                <ConnectionLine />
              </Box>
              <PreviewStepCard
                stepType={namingStepType}
                name={previewStepName || ''}
              />
            </>
          ) : null
        ) : isInRespondentContext ||
          isInFieldContext ||
          isStepEdit ||
          isStepEditFromSummary ||
          isNotificationEdit ? null : (
          // All other states: show connection line + appropriate connector
          <>
            <Box opacity={fadedOpacity} transition="opacity 0.3s ease">
              <ConnectionLine />
            </Box>
            {isAddStepsPhase && (
              <>
                <Box
                  opacity={isDragging ? 0 : 1}
                  maxH={isDragging ? 0 : '4rem'}
                  overflow="hidden"
                  transition="opacity 0.3s ease, max-height 0.3s ease"
                >
                  <AddStepConnector
                    onClick={() => handleAddStepClick(steps.length)}
                  />
                </Box>
                {!isFocusedInsert && isDragging && (
                  <DropZone insertIndex={steps.length} isDragging />
                )}
              </>
            )}
          </>
        )}

        {/* Summary: always-visible "+" at bottom (hidden during naming, editing, respondent phase, field phase, and step edit from summary) */}
        {!isAddStepsPhase &&
          !isStepNaming &&
          !isStepEdit &&
          !isStepEditFromSummary &&
          !isInRespondentContext &&
          !isInFieldContext &&
          !isNotificationEdit && (
            <Box opacity={fadedOpacity} transition="opacity 0.3s ease">
              <AddStepConnector
                onClick={() => handleAddStepClick(steps.length)}
              />
            </Box>
          )}

        <Box
          opacity={isNotificationFocus || isNotificationEdit ? 1 : fadedOpacity}
          transition="opacity 0.3s ease"
          _hover={
            hasFocusedView && !isNotificationFocus && !isNotificationEdit
              ? { opacity: 0.85 }
              : undefined
          }
        >
          <WorkflowEndDivider />
          <EmailNotificationCard
            isRespondentPhase={isInRespondentContext}
            isFocused={isNotificationFocus}
            isNotificationEdit={isNotificationEdit}
            isSummaryMode={isSummary || isStepEditFromSummary}
            anotherElementFocused={isRespondentStepFocus}
            isDisabled={isInAddStepsContext || isInFieldContext}
          />
        </Box>
      </Box>
    </Box>
  )
}
