import { FormWorkflowStep, WorkflowType } from 'formsg-shared/types'

import { EmailSources } from '~components/EmailSourceInput'

import { EditStepInputs } from '../types'

type StepRecipients = Pick<
  EditStepInputs,
  | 'workflow_type'
  | 'emails'
  | 'field'
  | 'conditional_field'
  | 'email_fields'
  | 'dropdown_fields'
>

export const stepToEmailSources = (
  step: Partial<StepRecipients> | FormWorkflowStep,
): EmailSources => {
  const values = step as Partial<StepRecipients>
  switch (values.workflow_type) {
    case WorkflowType.Dynamic:
      return {
        emails: [],
        emailFields: values.field ? [values.field] : [],
        dropdownFields: [],
      }
    case WorkflowType.Conditional:
      return {
        emails: [],
        emailFields: [],
        dropdownFields: values.conditional_field
          ? [values.conditional_field]
          : [],
      }
    case WorkflowType.Mixed:
      return {
        emails: values.emails ?? [],
        emailFields: values.email_fields ?? [],
        dropdownFields: values.dropdown_fields ?? [],
      }
    default:
      return {
        emails: values.emails ?? [],
        emailFields: [],
        dropdownFields: [],
      }
  }
}

export const emailSourcesToNarrowestStep = ({
  emails,
  emailFields,
  dropdownFields,
}: EmailSources): StepRecipients => {
  const none: Omit<StepRecipients, 'workflow_type'> = {
    emails: [],
    field: undefined,
    conditional_field: undefined,
    email_fields: [],
    dropdown_fields: [],
  }
  const fieldCount = emailFields.length + dropdownFields.length
  if (fieldCount === 0) {
    return { ...none, workflow_type: WorkflowType.Static, emails }
  }
  if (emails.length === 0 && fieldCount === 1) {
    return emailFields.length === 1
      ? { ...none, workflow_type: WorkflowType.Dynamic, field: emailFields[0] }
      : {
          ...none,
          workflow_type: WorkflowType.Conditional,
          conditional_field: dropdownFields[0],
        }
  }
  return {
    ...none,
    workflow_type: WorkflowType.Mixed,
    emails,
    email_fields: emailFields,
    dropdown_fields: dropdownFields,
  }
}
