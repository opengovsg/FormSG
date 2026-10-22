import { FormFieldDto } from 'formsg-shared/types/field'
import {
  FormAuthType,
  MrfStepAuthSessionDto,
  StrippedFormWorkflowDto,
  WorkflowStepAuthType,
} from 'formsg-shared/types/form'
import { isLoginIdentityField } from 'formsg-shared/utils/login-identity'
import { getStepFields, SourceField } from 'formsg-shared/utils/step-login'

/**
 * The saved login of the step a continuing respondent fills in, if any.
 * Read from the submission's workflow snapshot, never the live form.
 */
export const getPendingStepAuthType = (submission?: {
  workflow: StrippedFormWorkflowDto
  workflowStep: number
}): WorkflowStepAuthType | undefined =>
  submission?.workflow[submission.workflowStep + 1]?.auth?.auth_type

/**
 * Merges a later step's login session into the submission's saved fields.
 * Only that step's fields take prefills, so earlier answers are never
 * replaced. MyInfo profile prefills are read once, so after a reload the
 * respondent logs in again, as on Step 1.
 */
export const mergeStepLoginSession = ({
  formFields,
  workflow,
  workflowStep,
  session,
}: {
  formFields: FormFieldDto[]
  workflow: StrippedFormWorkflowDto
  workflowStep: number
  session: MrfStepAuthSessionDto
}): { formFields: FormFieldDto[]; isLoggedIn: boolean } => {
  const stepFields = getStepFields(formFields, workflow, workflowStep)
  const stepFieldIds = new Set(stepFields.map(({ _id }) => _id))
  const prefilledFields = new Map(
    (session.prefilledFields ?? [])
      .filter(({ _id }) => stepFieldIds.has(_id))
      .map((field) => [field._id, field]),
  )
  // Identity fields come back on every session read; MyInfo data fields
  // only right after the login, so their absence means the profile is gone.
  const hasMyInfoProfile = stepFields.every((field) => {
    // Table fields carry no myInfo, so the structural type is needed here.
    const source = field as SourceField
    return (
      !source.myInfo?.attr ||
      isLoginIdentityField(source) ||
      prefilledFields.has(field._id)
    )
  })

  return {
    formFields: formFields.map(
      (field) => prefilledFields.get(field._id) ?? field,
    ),
    isLoggedIn:
      !!session.spcpSession &&
      (session.authType !== FormAuthType.MyInfo || hasMyInfoProfile),
  }
}
