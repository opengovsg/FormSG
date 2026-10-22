import { useEffect, useLayoutEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Stack } from '@chakra-ui/react'

import {
  FirstStepLoginInput,
  FormAuthType,
  FormWorkflowStepAuth,
  FormWorkflowStepBase,
  FormWorkflowStepWriteDto,
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
import { useIsStepLoginShown } from '../../../hooks/useIsStepLoginShown'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'
import { EditStepInputs } from '../../../types'
import { getGuidedSecondaryAction } from '../../../utils/guidedStepPolicy'
import { SpotlightGroup } from '../../Spotlight'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { ApprovalsBlock } from './ApprovalsBlock'
import { GuidedActionGroup } from './GuidedActionGroup'
import { LoginBlock } from './LoginBlock'
import { QuestionsBlock } from './QuestionsBlock'
import { RespondentBlock } from './RespondentBlock'
import { StepNameBlock } from './StepNameBlock'

export interface EditLogicBlockProps {
  defaultValues?: Partial<EditStepInputs>
  onSubmit: (inputs: FormWorkflowStepWriteDto) => void

  stepNumber: number
  submitButtonLabel: string
  handleOpenDeleteModal?: () => void
  isLoading: boolean
}

export const FIELDS_TO_EDIT_NAME = 'edit'
export const APPROVAL_FIELD_NAME = 'approval_field'
export const APPROVAL_ENABLED_NAME = 'is_approval_enabled'

const SECTION_REVEAL_SCROLL_DELAY_MS = 100

type WriteStep = FormWorkflowStepWriteDto & { _id: string }

// Corppass is the only login with an e-service ID; an empty one is omitted.
const normaliseEsrvcId = (
  authType: FormAuthType,
  esrvcId: string | undefined,
): { esrvc_id?: string } => {
  const trimmed = esrvcId?.trim()
  return authType === FormAuthType.CP && trimmed ? { esrvc_id: trimmed } : {}
}

/** A later step's login as sent: absent when the step has none. */
export const normaliseStepAuth = (
  auth: FormWorkflowStepAuth | null | undefined,
): FormWorkflowStepAuth | undefined =>
  auth
    ? {
        auth_type: auth.auth_type,
        ...normaliseEsrvcId(auth.auth_type, auth.esrvc_id),
      }
    : undefined

// Step 1's login updates the form-level settings, where a missing e-service
// ID means "unchanged". Send a cleared Corppass ID as '' so it is saved.
const normaliseFirstStepLogin = (
  login: FirstStepLoginInput | undefined,
): { first_step_login?: FirstStepLoginInput } =>
  login
    ? {
        first_step_login: {
          auth_type: login.auth_type,
          ...(login.auth_type === FormAuthType.CP
            ? { esrvc_id: login.esrvc_id?.trim() ?? '' }
            : {}),
        },
      }
    : {}

export const buildWorkflowStep = (
  rawInputs: EditStepInputs,
  isFirstStep: boolean,
): WriteStep | undefined => {
  const inputs = { ...rawInputs }
  if (inputs.approval_field === '') {
    inputs.approval_field = undefined
  }
  if (inputs.step_name === '') {
    inputs.step_name = undefined
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
      // Only sent once the admin changed Step 1's login in the editor.
      ...normaliseFirstStepLogin(inputs.first_step_login),
    }
  }

  // A saved login is always sent back, even while the login block is hidden,
  // so a save never drops it.
  const workflowStepBase: Omit<FormWorkflowStepBase, 'auth'> & {
    _id: string
    auth?: FormWorkflowStepAuth
  } = {
    _id: inputs._id,
    workflow_type: inputs.workflow_type,
    edit: inputs.edit,
    approval_field: inputs.approval_field,
    is_approval_enabled: !!inputs.is_approval_enabled,
    step_name: inputs.step_name,
    auth: normaliseStepAuth(inputs.auth),
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
      } as WriteStep
    }
    case WorkflowType.Conditional: {
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Conditional,
        ...(inputs.conditional_field
          ? { conditional_field: inputs.conditional_field }
          : {}),
      } as WriteStep
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
  const isLoginShown = useIsStepLoginShown(stepNumber)
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
      stepNumber={stepNumber}
    />
  )
  const loginSection = isLoginShown ? (
    <LoginBlock
      key="login"
      formMethods={formMethods}
      stepNumber={stepNumber}
      isLoading={_isLoading}
    />
  ) : null
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
    // Login follows the respondent in both orders: who fills the step, then
    // how they log in, then what they do.
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
