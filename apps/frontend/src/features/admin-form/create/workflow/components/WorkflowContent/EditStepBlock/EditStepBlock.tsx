import { useEffect, useLayoutEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Divider, Stack } from '@chakra-ui/react'

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
  pendingSwitchToSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { EditStepInputs } from '../../../types'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { ApprovalsBlock } from './ApprovalsBlock'
import { QuestionsBlock } from './QuestionsBlock'
import { RespondentBlock } from './RespondentBlock'
import { StepNameBlock } from './StepNameBlock'

export interface EditLogicBlockProps {
  /** Sets default values of inputs if this is provided */
  defaultValues?: Partial<EditStepInputs>
  onSubmit: (inputs: FormWorkflowStep) => void

  stepNumber: number
  submitButtonLabel: string
  handleOpenDeleteModal?: () => void
  isLoading: boolean
}

export const FIELDS_TO_EDIT_NAME = 'edit'
export const APPROVAL_FIELD_NAME = 'approval_field'

/**
 * Builds a workflow step from form inputs, or undefined if they cannot form a
 * valid step. Inputs are assumed already validated (both save paths run
 * handleSubmit first), so the field narrowing here is a type guarantee, not the
 * validation gate.
 */
const buildWorkflowStep = (
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

  switch (inputs.workflow_type) {
    case WorkflowType.Static: {
      return {
        ...workflowStepBase,
        // Need to explicitly set workflow_type in this object to help with typechecking.
        workflow_type: WorkflowType.Static,
        emails: inputs.emails ?? [],
      }
    }
    case WorkflowType.Dynamic: {
      if (!inputs.field) return undefined
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Dynamic,
        field: inputs.field,
      }
    }
    case WorkflowType.Conditional: {
      if (!inputs.conditional_field) return undefined
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Conditional,
        conditional_field: inputs.conditional_field,
      }
    }
    default: {
      // Exhaustiveness check: a new WorkflowType breaks the build here until handled.
      const exhaustiveCheck: never = inputs
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
  const isRedesign = useIsWorkflowBuilderRedesign()

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
        // Block required so parent (with overflow:hidden) will not be scrolled
        // and causing unscrollable white space.
        // See https://stackoverflow.com/questions/48634459/scrollintoview-block-vs-inline/48635751#48635751
        block: 'nearest',
      })
    }
  }, [])

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  // RATIONALE: Returned formState is wrapped with a Proxy to improve
  // render performance, we must ead it before a render in order to enable
  // the state update.
  const { isDirty } = formMethods.formState

  // Shared by the Save button and the auto-save-on-switch effect. An invalid
  // submit cancels any pending switch so the card stays open; the Save-button
  // path never has a pending switch, so that cancel is a no-op there.
  const handleSubmit = formMethods.handleSubmit((inputs: EditStepInputs) => {
    const step = buildWorkflowStep(inputs, isFirstStep)
    if (!step) {
      // Inputs passed validation but cannot form a step. Without this the
      // pending switch would never resolve and the card would be stuck open.
      cancelPendingSwitch()
      return
    }
    onSubmit(step)
  }, cancelPendingSwitch)

  // Guards the auto-save effect against re-entry: the mutation's isLoading
  // only flips true on the render after mutate() is called, and handleSubmit's
  // validation is promise-based, so a second card click landing in that window
  // would pass the isLoading check and submit again (double-saving an existing
  // step, or creating a new step twice). Set synchronously before submitting;
  // cleared when the pending switch resolves (pendingSwitchTo returns to null
  // on cancel, or this card unmounts on success).
  const hasSubmittedForPendingSwitch = useRef(false)

  // Auto-save when another step is clicked while this one is open.
  // InactiveStepBlock sets pendingSwitchTo; this effect is dormant until it does.
  useEffect(() => {
    if (pendingSwitchTo === null) {
      hasSubmittedForPendingSwitch.current = false
      return
    }

    // A save is already in flight; its onSuccess completes the switch.
    // Submitting again would double-save and collapse the target.
    if (isLoading || hasSubmittedForPendingSwitch.current) return

    // A new step has nothing persisted yet, so it must always run validation
    // (like the Add step button): an incomplete new step blocks the switch. An
    // existing step that wasn't touched can switch directly without a
    // redundant save.
    if (!isCreatingState && !isDirty) {
      completeSave()
      return
    }

    hasSubmittedForPendingSwitch.current = true
    handleSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSwitchTo])

  // Only the order differs between flag states, so build each section once and
  // swap the sequence rather than duplicating the subtree per branch.
  const questionsSection = (
    <>
      <Divider />
      <QuestionsBlock
        formMethods={formMethods}
        isLoading={_isLoading}
        isFirstStep={isFirstStep}
      />
    </>
  )
  const approvalsSection = isFirstStep ? null : (
    <>
      <Divider />
      <ApprovalsBlock formMethods={formMethods} stepNumber={stepNumber} />
    </>
  )

  return (
    <Stack
      ref={wrapperRef}
      py="2rem"
      spacing="1.5rem"
      borderRadius="4px"
      bg="white"
      border="1px solid"
      borderColor="primary.500"
      boxShadow="0 0 0 1px var(--chakra-colors-primary-500)"
      transitionProperty="common"
      transitionDuration="normal"
    >
      <StepNameBlock formMethods={formMethods} stepNumber={stepNumber} />
      <Divider />
      <RespondentBlock
        user={user}
        stepNumber={stepNumber}
        formMethods={formMethods}
        isLoading={_isLoading}
      />
      {isRedesign ? (
        <>
          {approvalsSection}
          {questionsSection}
        </>
      ) : (
        <>
          {questionsSection}
          {approvalsSection}
        </>
      )}
      <Divider />
      <SaveActionGroup
        isLoading={_isLoading}
        handleSubmit={handleSubmit}
        handleDelete={isFirstStep ? undefined : handleOpenDeleteModal}
        handleCancel={setToInactive}
        submitButtonLabel={submitButtonLabel}
        ariaLabelName="step"
      />
    </Stack>
  )
}
