import { useCallback, useEffect, useRef, useState } from 'react'
import { BiLeftArrowAlt, BiRightArrowAlt } from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Flex,
  IconButton as ChakraIconButton,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'

import {
  STEP_TYPE_CONFIG,
  StepTypeCard,
  StepTypeCardOverlay,
} from '~features/admin-form/create/workflow-v2/components/AddStepsPanel/StepTypeCard'
import { StepCardOverlay } from '~features/admin-form/create/workflow-v2/components/WorkflowCanvas/CanvasStepCard'
import { WorkflowCanvas } from '~features/admin-form/create/workflow-v2/components/WorkflowCanvas/WorkflowCanvas'
import type {
  StepType,
  WorkflowStep,
} from '~features/admin-form/create/workflow-v2/types'
import {
  focusStateSelector,
  notificationLabelSelector,
  pendingInsertIndexSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '~features/admin-form/create/workflow-v2/workflowBuilderStore'

import { SplitScreenLayout } from './SplitScreenLayout'

// ─── Constants ──────────────────────────────────────────

const MAX_NAME_LENGTH = 50

// ─── MapStepsWrapper ────────────────────────────────────
// Owns DndContext + SplitScreenLayout for the "Plan your process" step.

interface MapStepsWrapperProps {
  formId: string
}

export const MapStepsWrapper = ({
  formId,
}: MapStepsWrapperProps): JSX.Element => {
  const steps = useWorkflowBuilderStore(stepsSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const reorderSteps = useWorkflowBuilderStore((s) => s.reorderSteps)
  const setPendingInsertIndex = useWorkflowBuilderStore(
    (s) => s.setPendingInsertIndex,
  )
  const setJustDraggedId = useWorkflowBuilderStore((s) => s.setJustDraggedId)

  // Drag overlay state (local, only for rendering the overlay)
  const [activeStepType, setActiveStepType] = useState<StepType | null>(null)
  const [activeDragStep, setActiveDragStep] = useState<WorkflowStep | null>(
    null,
  )

  // Sensors: 8px distance prevents click-vs-drag conflict
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
      }
    },
    [steps],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      // Track which card was just dragged for the fade-back animation
      setJustDraggedId(event.active.id as string)
      setTimeout(() => setJustDraggedId(null), 200)

      // Clear overlay state
      setTimeout(() => {
        setActiveStepType(null)
        setActiveDragStep(null)
      }, 300)

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
          // No step-1 confirmation needed in creation flow (no respondents assigned yet)
          reorderSteps(fromIndex, toIndex)
        }
        return
      }
    },
    [setFocus, reorderSteps, setPendingInsertIndex, setJustDraggedId],
  )

  const isDragging = activeStepType !== null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: { strategy: MeasuringStrategy.Always },
      }}
    >
      <SplitScreenLayout
        currentStep="mapSteps"
        leftPanel={<MapStepsStep formId={formId} />}
        rightPanel={<MapStepsRightPanel isDragging={isDragging} />}
      />
      <DragOverlay dropAnimation={null}>
        {activeStepType ? (
          <StepTypeCardOverlay stepType={activeStepType} />
        ) : activeDragStep ? (
          <StepCardOverlay step={activeDragStep} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ─── MapStepsStep (left panel) ──────────────────────────
// Renders the appropriate form based on the store's focusState.

interface MapStepsStepProps {
  formId: string
}

const MapStepsStep = ({ formId }: MapStepsStepProps): JSX.Element => {
  const navigate = useNavigate()
  const loadForForm = useWorkflowBuilderStore((s) => s.loadForForm)
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!formId || hasInitialized.current) return
    hasInitialized.current = true
    loadForForm(formId, { type: 'phase', phase: 'add_steps' })
  }, [formId, loadForForm])

  const steps = useWorkflowBuilderStore(stepsSelector)
  const hasMultipleSteps = steps.length > 1

  const handleDone = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}`)
  }, [navigate, formId])

  const handleSkip = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}`)
  }, [navigate, formId])

  // Render the appropriate panel based on focusState
  if (focusState.type === 'step_naming') {
    return <CreationFlowNamingForm />
  }

  if (focusState.type === 'step_edit') {
    return <CreationFlowEditForm />
  }

  if (focusState.type === 'notification_edit') {
    return <CreationFlowNotificationEdit />
  }

  return (
    <MapStepsLeftPanel
      hasMultipleSteps={hasMultipleSteps}
      onDone={handleDone}
      onSkip={handleSkip}
    />
  )
}

// ─── MapStepsLeftPanel ──────────────────────────────────
// Default view: step type cards + done/skip buttons.

interface MapStepsLeftPanelProps {
  hasMultipleSteps: boolean
  onDone: () => void
  onSkip: () => void
}

const MapStepsLeftPanel = ({
  hasMultipleSteps,
  onDone,
  onSkip,
}: MapStepsLeftPanelProps): JSX.Element => {
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const pendingInsertIndex = useWorkflowBuilderStore(pendingInsertIndexSelector)
  const setPendingInsertIndex = useWorkflowBuilderStore(
    (s) => s.setPendingInsertIndex,
  )

  const handleStepTypeClick = useCallback(
    (stepType: StepType) => {
      const insertIndex = pendingInsertIndex ?? steps.length
      setPendingInsertIndex(null)
      setFocus({
        type: 'step_naming',
        stepType,
        insertIndex,
      })
    },
    [setPendingInsertIndex, pendingInsertIndex, steps.length, setFocus],
  )

  return (
    <Stack spacing="1.5rem" maxW="32rem">
      <Box>
        <Text textStyle="h2" color="secondary.700" mb="0.5rem">
          Plan your process
        </Text>
        <Text textStyle="body-1" color="secondary.400">
          Add the steps your form needs. Some processes require multiple people
          to fill in or approve responses.
        </Text>
      </Box>

      <Stack spacing="0.75rem">
        <StepTypeCard
          stepType="collect"
          onClick={() => handleStepTypeClick('collect')}
        />
        <StepTypeCard
          stepType="review"
          onClick={() => handleStepTypeClick('review')}
        />
      </Stack>

      <Stack spacing="0.75rem" pt="0.5rem">
        <Button
          rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
          onClick={onDone}
          isFullWidth
        >
          Done adding steps
        </Button>
        <Button variant="outline" onClick={onSkip} isFullWidth>
          My form only has one step
        </Button>
      </Stack>
    </Stack>
  )
}

// ─── CreationFlowNamingForm ─────────────────────────────
// Shown when focusState.type === 'step_naming'.
// Adds a new step and updates the canvas preview in real time.

const CreationFlowNamingForm = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const addStep = useWorkflowBuilderStore((s) => s.addStep)
  const setPreviewStepName = useWorkflowBuilderStore(
    (s) => s.setPreviewStepName,
  )

  if (focusState.type !== 'step_naming') return <></>

  const { stepType, insertIndex } = focusState

  return (
    <CreationFlowNamingFormInner
      key={`${stepType}-${insertIndex}`}
      stepType={stepType}
      insertIndex={insertIndex}
      setFocus={setFocus}
      addStep={addStep}
      setPreviewStepName={setPreviewStepName}
    />
  )
}

type NamingFormInnerProps = {
  stepType: StepType
  insertIndex: number
  setFocus: ReturnType<typeof setFocusSelector>
  addStep: (type: StepType, name: string, index: number) => void
  setPreviewStepName: (name: string | null) => void
}

const CreationFlowNamingFormInner = ({
  stepType,
  insertIndex,
  setFocus,
  addStep,
  setPreviewStepName,
}: NamingFormInnerProps): JSX.Element => {
  const config = STEP_TYPE_CONFIG[stepType]
  const displayTitle =
    stepType === 'review' ? 'Review and approve' : config.title
  const defaultName = `Step ${insertIndex + 1}`
  const [name, setName] = useState(defaultName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreviewStepName(defaultName)
    inputRef.current?.focus()
    inputRef.current?.select()
    return () => {
      setPreviewStepName(null)
    }
  }, [defaultName, setPreviewStepName])

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length <= MAX_NAME_LENGTH) {
        setName(e.target.value)
        setPreviewStepName(e.target.value)
      }
    },
    [setPreviewStepName],
  )

  const handleCancel = useCallback(() => {
    setPreviewStepName(null)
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [setFocus, setPreviewStepName])

  const handleSave = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return
    setPreviewStepName(null)
    addStep(stepType, trimmed, insertIndex)
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [name, stepType, insertIndex, addStep, setFocus, setPreviewStepName])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave()
      if (e.key === 'Escape') handleCancel()
    },
    [handleSave, handleCancel],
  )

  return (
    <Stack spacing="1.5rem" maxW="32rem">
      <Flex align="center" gap="0.5rem">
        <ChakraIconButton
          aria-label="Back to step types"
          icon={<BiLeftArrowAlt fontSize="1.25rem" />}
          variant="ghost"
          size="sm"
          _focusVisible={{ boxShadow: 'none' }}
          onClick={handleCancel}
        />
        <Text textStyle="h2" color="secondary.700">
          Add &ldquo;{displayTitle}&rdquo;
        </Text>
      </Flex>

      <Stack spacing="0.5rem">
        <Text textStyle="subhead-2" color="secondary.500">
          Step name
        </Text>
        <Input
          ref={inputRef}
          value={name}
          onChange={handleNameChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_NAME_LENGTH}
        />
        <Text textStyle="caption-1" color="secondary.400" textAlign="right">
          ({name.length}/{MAX_NAME_LENGTH})
        </Text>
      </Stack>

      <Flex gap="0.75rem">
        <Button variant="outline" onClick={handleCancel} flex={1}>
          Cancel
        </Button>
        <Button onClick={handleSave} isDisabled={!name.trim()} flex={1}>
          Save step
        </Button>
      </Flex>
    </Stack>
  )
}

// ─── CreationFlowEditForm ───────────────────────────────
// Shown when focusState.type === 'step_edit'.
// Edits an existing step's name.

const CreationFlowEditForm = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const renameStep = useWorkflowBuilderStore((s) => s.renameStep)

  if (focusState.type !== 'step_edit') return <></>

  const step = steps.find((s) => s.id === focusState.stepId)
  if (!step) return <></>

  return (
    <CreationFlowEditFormInner
      key={step.id}
      stepId={step.id}
      currentName={step.name}
      setFocus={setFocus}
      renameStep={renameStep}
    />
  )
}

type EditFormInnerProps = {
  stepId: string
  currentName: string
  setFocus: ReturnType<typeof setFocusSelector>
  renameStep: (stepId: string, name: string) => void
}

const CreationFlowEditFormInner = ({
  stepId,
  currentName,
  setFocus,
  renameStep,
}: EditFormInnerProps): JSX.Element => {
  const [name, setName] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleBack = useCallback(() => {
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [setFocus])

  const handleSave = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return
    renameStep(stepId, trimmed)
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [name, stepId, renameStep, setFocus])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave()
      if (e.key === 'Escape') handleBack()
    },
    [handleSave, handleBack],
  )

  return (
    <Stack spacing="1.5rem" maxW="32rem">
      <Flex align="center" gap="0.5rem">
        <ChakraIconButton
          aria-label="Back to step types"
          icon={<BiLeftArrowAlt fontSize="1.25rem" />}
          variant="ghost"
          size="sm"
          _focusVisible={{ boxShadow: 'none' }}
          onClick={handleBack}
        />
        <Text textStyle="h2" color="secondary.700">
          Edit step name
        </Text>
      </Flex>

      <Stack spacing="0.5rem">
        <Text textStyle="subhead-2" color="secondary.500">
          Step name
        </Text>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => {
            if (e.target.value.length <= MAX_NAME_LENGTH) {
              setName(e.target.value)
            }
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_NAME_LENGTH}
        />
        <Text textStyle="caption-1" color="secondary.400" textAlign="right">
          ({name.length}/{MAX_NAME_LENGTH})
        </Text>
      </Stack>

      <Flex gap="0.75rem">
        <Button variant="outline" onClick={handleBack} flex={1}>
          Cancel
        </Button>
        <Button onClick={handleSave} isDisabled={!name.trim()} flex={1}>
          Save
        </Button>
      </Flex>
    </Stack>
  )
}

// ─── CreationFlowNotificationEdit ───────────────────────
// Shown when focusState.type === 'notification_edit'.
// Edits the email notification card label.

const CreationFlowNotificationEdit = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const notificationLabel = useWorkflowBuilderStore(notificationLabelSelector)
  const renameNotificationLabel = useWorkflowBuilderStore(
    (s) => s.renameNotificationLabel,
  )

  if (focusState.type !== 'notification_edit') return <></>

  return (
    <CreationFlowNotificationEditInner
      key="notification"
      currentLabel={notificationLabel}
      setFocus={setFocus}
      renameNotificationLabel={renameNotificationLabel}
    />
  )
}

type NotificationEditInnerProps = {
  currentLabel: string
  setFocus: ReturnType<typeof setFocusSelector>
  renameNotificationLabel: (name: string) => void
}

const CreationFlowNotificationEditInner = ({
  currentLabel,
  setFocus,
  renameNotificationLabel,
}: NotificationEditInnerProps): JSX.Element => {
  const [label, setLabel] = useState(currentLabel)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleBack = useCallback(() => {
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [setFocus])

  const handleSave = useCallback(() => {
    const trimmed = label.trim()
    if (!trimmed) return
    renameNotificationLabel(trimmed)
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [label, renameNotificationLabel, setFocus])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave()
      if (e.key === 'Escape') handleBack()
    },
    [handleSave, handleBack],
  )

  return (
    <Stack spacing="1.5rem" maxW="32rem">
      <Flex align="center" gap="0.5rem">
        <ChakraIconButton
          aria-label="Back to step types"
          icon={<BiLeftArrowAlt fontSize="1.25rem" />}
          variant="ghost"
          size="sm"
          _focusVisible={{ boxShadow: 'none' }}
          onClick={handleBack}
        />
        <Text textStyle="h2" color="secondary.700">
          Edit email notification
        </Text>
      </Flex>

      <Stack spacing="0.5rem">
        <Text textStyle="subhead-2" color="secondary.500">
          Notification label
        </Text>
        <Input
          ref={inputRef}
          value={label}
          onChange={(e) => {
            if (e.target.value.length <= MAX_NAME_LENGTH) {
              setLabel(e.target.value)
            }
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_NAME_LENGTH}
        />
        <Text textStyle="caption-1" color="secondary.400" textAlign="right">
          ({label.length}/{MAX_NAME_LENGTH})
        </Text>
      </Stack>

      <Flex gap="0.75rem">
        <Button variant="outline" onClick={handleBack} flex={1}>
          Cancel
        </Button>
        <Button onClick={handleSave} isDisabled={!label.trim()} flex={1}>
          Save
        </Button>
      </Flex>
    </Stack>
  )
}

// ─── MapStepsRightPanel ─────────────────────────────────

interface MapStepsRightPanelProps {
  isDragging: boolean
}

const MapStepsRightPanel = ({
  isDragging,
}: MapStepsRightPanelProps): JSX.Element => {
  return (
    <Box w="100%" p="2rem">
      <WorkflowCanvas isDragging={isDragging} />
    </Box>
  )
}
