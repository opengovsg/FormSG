import {
  FormWorkflowStep,
  FormWorkflowStepBase,
  WorkflowType,
} from 'formsg-shared/types'

import { EditStepInputs } from '../../../types'

/**
 * Builds a workflow step from form inputs, or undefined if they cannot form a
 * valid step. Inputs are assumed already validated (both save paths run
 * handleSubmit first), so the field narrowing here is a type guarantee, not the
 * validation gate.
 */
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

  switch (inputs.workflow_type) {
    case WorkflowType.Static: {
      return {
        ...workflowStepBase,
        // Need to explicitly set workflow_type in this object to help with typechecking.
        workflow_type: WorkflowType.Static,
        emails: inputs.emails ?? [],
      }
    }
    // FRM-2489: a respondent that has not been chosen yet leaves its key out of
    // the payload entirely. It must not be sent as '' — the API rejects an
    // empty string, and it would not cast to an ObjectId.
    //
    // The cast is needed because the shared types still declare these keys as
    // required, while the schema and validators no longer do. Whether to make
    // the types optional is still open.
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
      // Exhaustiveness check: a new WorkflowType breaks the build here until handled.
      const exhaustiveCheck: never = inputs
      return exhaustiveCheck
    }
  }
}
