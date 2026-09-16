import { useEffect, useLayoutEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Stack } from '@chakra-ui/react'

import {
  FormWorkflowStep,
  FormWorkflowStepBase,
  WorkflowType,
} from 'formsg-shared/types'

import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import { useUser } from '~features/user/queries'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  isCreatingStateSelector,
  isGuidedSetupSelector,
  pendingSwitchToSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useGuidedStepReveal } from '../../../hooks/useGuidedStepReveal'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'
import { EditStepInputs } from '../../../types'
import { getGuidedSecondaryAction } from '../../../utils/guidedStepPolicy'
import { SpotlightGroup } from '../../Spotlight'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { ApprovalsBlock } from './ApprovalsBlock'
import { GuidedActionGroup } from './GuidedActionGroup'
import { QuestionsBlock } from './QuestionsBlock'
import { RespondentBlock } from './RespondentBlock'
import { StepNameBlock } from './StepNameBlock'

export interface EditLogicBlockProps {
  defaultValues?: Partial<EditStepInputs>
  onSubmit: (inputs: FormWorkflowStep) => void

  stepNumber: number
  submitButtonLabel: string
  handleOpenDeleteModal?: () => void
  isLoading: boolean
}

export const FIELDS_TO_EDIT_NAME = 'edit'
export const APPROVAL_FIELD_NAME = 'approval_field'

const SECTION_REVEAL_SCROLL_DELAY_MS = 100

export const buildWorkflowStep = (
  rawInputs: EditStepInputs,
  isFirstStep: boolean,
): (FormWorkflowStep & { _id: string }) | undefined => {
  const inputs = { ...rawInputs }
  if (inputs.approval_field === '') {
    inputs.approval_field = undefined
  }
  if (inputs.step_name === '') {
    inputs.step_name = undefined
  }

  if (isFirstStep) {
    return inputs.field
      ? {
          ...inputs,
          workflow_type: WorkflowType.Dynamic,
          field: inputs.field,
        }
      : {
          ...inputs,
          workflow_type: WorkflowType.Static,
          emails: inputs.emails ?? [],
        }
  }

  const workflowStepBase: FormWorkflowStepBase & { _id: string } = {
    _id: inputs._id,
    workflow_type: inputs.workflow_type,
    edit: inputs.edit,
    approval_field: inputs.approval_field,
    step_name: inputs.step_name,
  }

  const workflowType: WorkflowType | undefined = inputs.workflow_type
  if (!workflowType) {
    return {
      ...workflowStepBase,
      workflow_type: WorkflowType.Static,
      emails: inputs.emails ?? [],
    }
  }

  switch (workflowType) {
    case WorkflowType.Static: {
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Static,
        emails: inputs.emails ?? [],
      }
    }
    case WorkflowType.Dynamic: {
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Dynamic,
        ...(inputs.field ? { field: inputs.field } : {}),
      } as FormWorkflowStep & { _id: string }
    }
    case WorkflowType.Conditional: {
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Conditional,
        ...(inputs.conditional_field
          ? { conditional_field: inputs.conditional_field }
          : {}),
      } as FormWorkflowStep & { _id: string }
    }
    default: {
      const exhaustiveCheck: never = workflowType
      return exhaustiveCheck
    }
  }
}

export const EditStepBlock = ({
  stepNumber,
  onSubmit,
  defaultValues,
  isLoading,
  submitButtonLabel,
  handleOpenDeleteModal,
}: EditLogicBlockProps) => {
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const pendingSwitchTo = useAdminWorkflowStore(pendingSwitchToSelector)
  const completeSave = useAdminWorkflowStore(completeSaveSelector)
  const cancelPendingSwitch = useAdminWorkflowStore(cancelPendingSwitchSelector)
  const isCreatingState = useAdminWorkflowStore(isCreatingStateSelector)
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)
  const isRedesign = useIsWorkflowBuilderRedesign()
  const { cardRadius, activeCardBg, activeCardBorderWidth, activeCardShadow } =
    useWorkflowSurfaces()

  const formMethods = useForm<EditStepInputs>({
    defaultValues,
  })
  const { user, isLoading: isUserLoading } = useUser()
  const _isLoading = isLoading || isUserLoading

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [])

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  const { isDirty } = formMethods.formState

  const handleSubmit = formMethods.handleSubmit((inputs: EditStepInputs) => {
    const step = buildWorkflowStep(inputs, isFirstStep)
    if (!step) {
      cancelPendingSwitch()
      return
    }
    onSubmit(step)
  }, cancelPendingSwitch)

  const hasSubmittedForPendingSwitch = useRef(false)

  useEffect(() => {
    if (pendingSwitchTo === null) {
      hasSubmittedForPendingSwitch.current = false
      return
    }

    if (isLoading || hasSubmittedForPendingSwitch.current) return

    if (!isCreatingState && !isDirty) {
      completeSave()
      return
    }

    hasSubmittedForPendingSwitch.current = true
    handleSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSwitchTo])

  const isGuided = isRedesign && isCreatingState && isGuidedSetup

  const questionsSection = (
    <QuestionsBlock
      key="fields"
      formMethods={formMethods}
      isLoading={_isLoading}
      isFirstStep={isFirstStep}
    />
  )
  const approvalsSection = isFirstStep ? null : (
    <ApprovalsBlock
      key="what-they-do"
      formMethods={formMethods}
      stepNumber={stepNumber}
    />
  )

  const sections: JSX.Element[] = [
    <StepNameBlock
      key="name"
      formMethods={formMethods}
      stepNumber={stepNumber}
    />,
    <RespondentBlock
      key="people"
      user={user}
      stepNumber={stepNumber}
      formMethods={formMethods}
      isLoading={_isLoading}
    />,
    ...(isRedesign
      ? [approvalsSection, questionsSection]
      : [questionsSection, approvalsSection]
    ).filter((section): section is JSX.Element => section !== null),
  ]

  const reveal = useGuidedStepReveal({
    sectionCount: sections.length,
    isEnabled: isGuided,
  })

  const { visibleCount } = reveal

  useEffect(() => {
    if (!isGuided || visibleCount <= 1) return
    const timeout = setTimeout(() => {
      wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, SECTION_REVEAL_SCROLL_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [isGuided, visibleCount])

  return (
    <Stack
      ref={wrapperRef}
      spacing="0"
      pt="0.5rem"
      pb="2rem"
      borderRadius={cardRadius}
      bg={isGuided ? 'white' : activeCardBg}
      border={isGuided ? '1px solid' : `${activeCardBorderWidth} solid`}
      borderColor={isGuided ? 'neutral.300' : 'primary.500'}
      boxShadow={isGuided ? 'none' : activeCardShadow}
      transitionProperty="common"
      transitionDuration="normal"
    >
      <SpotlightGroup activeIndex={reveal.activeIndex} isEnabled={isGuided}>
        {sections.slice(0, visibleCount)}
      </SpotlightGroup>
      <Box pt="1.5rem">
        {isGuided ? (
          <GuidedActionGroup
            secondaryAction={getGuidedSecondaryAction({
              sectionIndex: visibleCount - 1,
              canCancel: !isFirstStep,
            })}
            isOnLastSection={reveal.isOnLastSection}
            isLoading={isLoading}
            onBack={reveal.goBack}
            onCancel={setToInactive}
            onContinue={reveal.advance}
            onDone={handleSubmit}
          />
        ) : (
          <SaveActionGroup
            isLoading={_isLoading}
            handleSubmit={handleSubmit}
            handleDelete={
              !isFirstStep || isRedesign ? handleOpenDeleteModal : undefined
            }
            handleCancel={setToInactive}
            submitButtonLabel={submitButtonLabel}
            ariaLabelName="step"
          />
        )}
      </Box>
    </Stack>
  )
}
