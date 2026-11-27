import {
  FormWorkflowStepAuth,
  FormWorkflowStepBase,
  FormWorkflowStepWriteDto,
  WorkflowType,
} from 'formsg-shared/types'

import { EditStepInputs } from '../../../types'
import {
  normaliseFirstStepLogin,
  normaliseStepAuth,
} from '../../../workflow.utils'

type WriteStep = FormWorkflowStepWriteDto & { _id: string }

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

  const fieldDeletion = {
    ...(inputs.expected_last_modified
      ? { expected_last_modified: inputs.expected_last_modified }
      : {}),
    ...(inputs.delete_auth_field_ids?.length
      ? { delete_auth_field_ids: inputs.delete_auth_field_ids }
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
      ...fieldDeletion,
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
    auth: FormWorkflowStepAuth | null
  } = {
    _id: inputs._id,
    ...fieldDeletion,
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
    case WorkflowType.Hybrid: {
      return {
        ...workflowStepBase,
        workflow_type: WorkflowType.Hybrid,
        emails: inputs.emails ?? [],
        email_fields: inputs.email_fields ?? [],
        dropdown_fields: inputs.dropdown_fields ?? [],
      }
    }
    default: {
      const exhaustiveCheck: never = workflowType
      return exhaustiveCheck
    }
  }
}
