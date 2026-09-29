import { useEffect, useLayoutEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Stack } from '@chakra-ui/react'

import {
  FormAuthType,
  FormWorkflowStepBase,
  WorkflowStepFormLevelInput,
  WorkflowStepWriteDto,
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
import { useIsMrfSingpassAllSteps } from '../../../hooks/useIsMrfSingpassAllSteps'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'
import { EditStepInputs } from '../../../types'
import { getGuidedSecondaryAction } from '../../../utils/guidedStepPolicy'
import { SpotlightGroup } from '../../Spotlight'
import { StepLoginSummary } from '../StepLogin/StepLoginSummary'
import { useResolvedStepAuths } from '../StepLogin/useResolvedStepAuths'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { ApprovalsBlock } from './ApprovalsBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'
import { GuidedActionGroup } from './GuidedActionGroup'
import { LoginBlock } from './LoginBlock'
import { QuestionsBlock } from './QuestionsBlock'
import { RespondentBlock } from './RespondentBlock'
import { StepNameBlock } from './StepNameBlock'

export interface EditLogicBlockProps {
  defaultValues?: Partial<EditStepInputs>
  onSubmit: (inputs: WorkflowStepWriteDto) => void

  stepNumber: number
  submitButtonLabel: string
  handleOpenDeleteModal?: () => void
  isLoading: boolean
}

export const FIELDS_TO_EDIT_NAME = 'edit'
export const APPROVAL_FIELD_NAME = 'approval_field'
export const APPROVAL_ENABLED_NAME = 'is_approval_enabled'

const SECTION_REVEAL_SCROLL_DELAY_MS = 100

export const buildWorkflowStep = (
  rawInputs: EditStepInputs,
  isFirstStep: boolean,
): (WorkflowStepWriteDto & { _id: string }) | undefined => {
  const inputs = { ...rawInputs }
  if (inputs.approval_field === '') {
    inputs.approval_field = undefined
  }
  if (inputs.step_name === '') {
    inputs.step_name = undefined
  }
  // Staged login edits only; omitted keys keep their saved values server-side.
  const loginInput: WorkflowStepFormLevelInput &
    Pick<WorkflowStepWriteDto, 'whitelistCsvString'> = {
    ...(isFirstStep && inputs.first_step_login
      ? { first_step_login: inputs.first_step_login }
      : {}),
    ...(inputs.esrvc_id !== undefined ? { esrvc_id: inputs.esrvc_id } : {}),
    ...(inputs.whitelistCsvString !== undefined
      ? { whitelistCsvString: inputs.whitelistCsvString }
      : {}),
  }

  // Step 1 is always "anyone with the link", represented as a static step with
  // no emails. Legacy forms (pre #7794) may still store step 1 as dynamic with
  // a `field` that can point at a deleted email field, which the backend
  // rejects on save — so saving always rewrites step 1 to static, lazily
  // migrating those forms. Nothing reads step 1's `field` at runtime; step-1
  // notifications come from `stepOneEmailNotificationFieldId`.
  if (isFirstStep) {
    return {
      _id: inputs._id,
      workflow_type: WorkflowType.Static,
      edit: inputs.edit,
      approval_field: inputs.approval_field,
      is_approval_enabled: !!inputs.is_approval_enabled,
      step_name: inputs.step_name,
      emails: inputs.emails ?? [],
      ...loginInput,
    }
  }

  const workflowStepBase: Omit<FormWorkflowStepBase, 'auth'> &
    Pick<WorkflowStepWriteDto, 'auth'> & { _id: string } = {
    _id: inputs._id,
    workflow_type: inputs.workflow_type,
    edit: inputs.edit,
    approval_field: inputs.approval_field,
    is_approval_enabled: !!inputs.is_approval_enabled,
    step_name: inputs.step_name,
    // Omitted keeps the saved login, null removes it; the saved list reference is never sent.
    ...(inputs.login_auth !== undefined
      ? {
          auth: inputs.login_auth && {
            auth_type: inputs.login_auth.auth_type,
            is_submitter_id_collection_enabled:
              inputs.login_auth.is_submitter_id_collection_enabled,
          },
        }
      : {}),
    ...loginInput,
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
      } as WorkflowStepWriteDto & { _id: string }
    }
    case WorkflowType.Conditional: {
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Conditional,
        ...(inputs.conditional_field
          ? { conditional_field: inputs.conditional_field }
          : {}),
      } as WorkflowStepWriteDto & { _id: string }
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
    defaultValues: {
      ...defaultValues,
      is_approval_enabled:
        defaultValues?.is_approval_enabled ?? !!defaultValues?.approval_field,
    },
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

  // With the flag off, a saved later-step login is shown read-only and kept on save.
  const isStepLoginEnabled = useIsMrfSingpassAllSteps()
  const savedStepAuth = useResolvedStepAuths()?.[stepNumber]
  const loginSection = isStepLoginEnabled ? (
    <LoginBlock
      key="login"
      formMethods={formMethods}
      stepNumber={stepNumber}
      isLoading={_isLoading}
    />
  ) : !isFirstStep &&
    savedStepAuth?.authType !== FormAuthType.NIL &&
    savedStepAuth ? (
    <EditStepBlockContainer key="login">
      <StepLoginSummary resolved={savedStepAuth} />
    </EditStepBlockContainer>
  ) : null

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
      ? [loginSection, approvalsSection, questionsSection]
      : [loginSection, questionsSection, approvalsSection]
    ).filter((section): section is JSX.Element => section !== null),
  ]

  const reveal = useGuidedStepReveal({
    sectionCount: sections.length,
    isEnabled: isGuided,
  })

  const { visibleCount } = reveal

  useEffect(() => {
    if (pendingSwitchTo === null) {
      hasSubmittedForPendingSwitch.current = false
      return
    }

    if (isLoading || hasSubmittedForPendingSwitch.current) return

    if (isGuided && !reveal.isOnLastSection) {
      cancelPendingSwitch()
      return
    }

    if (!isCreatingState && !isDirty) {
      completeSave()
      return
    }

    hasSubmittedForPendingSwitch.current = true
    handleSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSwitchTo])

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
