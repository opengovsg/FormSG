import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import {
  FormWorkflowStep,
  FormWorkflowStepBase,
  WorkflowType,
} from '~shared/types'

import { WorkflowDrawerActions } from './WorkflowDrawerActions'
import { useUser } from '~features/user/queries'

import { CreatePageDrawerContentContainer } from '../../../../common/CreatePageDrawer/CreatePageDrawerContentContainer'
import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import {
  setIsDirtySelector,
  useDirtyWorkflowStore,
} from '../../../useDirtyWorkflowStore'
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
  handleCancel?: () => void
  isLoading: boolean
}

export const FIELDS_TO_EDIT_NAME = 'edit'

export const EditStepBlock = ({
  stepNumber,
  onSubmit,
  defaultValues,
  isLoading,
  submitButtonLabel,
  handleCancel,
}: EditLogicBlockProps) => {
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const setIsDirty = useDirtyWorkflowStore(setIsDirtySelector)

  const formMethods = useForm<EditStepInputs>({
    defaultValues,
  })
  const { user, isLoading: isUserLoading } = useUser()
  const _isLoading = isLoading || isUserLoading

  // Track dirty state
  const isDirty = formMethods.formState.isDirty

  useEffect(() => {
    setIsDirty(isDirty)
    return () => setIsDirty(false) // cleanup on unmount
  }, [isDirty, setIsDirty])

  const handleSubmit = formMethods.handleSubmit((inputs: EditStepInputs) => {
    if (inputs.approval_field === '') {
      inputs.approval_field = undefined
    }

    if (inputs.step_name === '') {
      inputs.step_name = undefined
    }

    if (isFirstStepByStepNumber(stepNumber)) {
      if (inputs.field) {
        return onSubmit({
          ...inputs,
          workflow_type: WorkflowType.Dynamic,
          field: inputs.field,
        })
      }
      return onSubmit({
        ...inputs,
        workflow_type: WorkflowType.Static,
        emails: inputs.emails ?? [],
      })
    }

    let step: FormWorkflowStep

    const workflowStepBase: FormWorkflowStepBase = {
      workflow_type: inputs.workflow_type,
      edit: inputs.edit,
      approval_field: inputs.approval_field,
      step_name: inputs.step_name,
    }

    switch (inputs.workflow_type) {
      case WorkflowType.Static: {
        step = {
          ...workflowStepBase,
          // Need to explicitly set workflow_type in this object to help with typechecking.
          workflow_type: WorkflowType.Static,
          emails: inputs.emails ?? [],
        }
        break
      }
      case WorkflowType.Dynamic: {
        if (!inputs.field) return
        step = {
          ...workflowStepBase,
          workflow_type: WorkflowType.Dynamic,
          field: inputs.field,
        }
        break
      }
      case WorkflowType.Conditional: {
        if (!inputs.conditional_field) return
        step = {
          ...workflowStepBase,
          workflow_type: WorkflowType.Conditional,
          conditional_field: inputs.conditional_field,
        }
        break
      }
      default: {
        throw new Error('Invalid workflow type')
      }
    }
    onSubmit(step)
  })

  const isFirstStep = isFirstStepByStepNumber(stepNumber)
  const isCreatingStep = !defaultValues?._id

  return (
    <CreatePageDrawerContentContainer px="0">
      <StepNameBlock formMethods={formMethods} stepNumber={stepNumber} />
      <RespondentBlock
        user={user}
        stepNumber={stepNumber}
        formMethods={formMethods}
        isLoading={_isLoading}
      />
      <QuestionsBlock
        formMethods={formMethods}
        isLoading={_isLoading}
        isFirstStep={isFirstStep}
      />
      {!isFirstStep ? (
        <ApprovalsBlock formMethods={formMethods} stepNumber={stepNumber} />
      ) : null}
      <WorkflowDrawerActions
        handleSubmit={handleSubmit}
        handleCancel={handleCancel ?? setToInactive}
        submitButtonLabel={submitButtonLabel}
        isLoading={_isLoading}
      />
    </CreatePageDrawerContentContainer>
  )
}
