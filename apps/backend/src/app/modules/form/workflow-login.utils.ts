import {
  FormAuthType,
  FormWorkflowDto,
  FormWorkflowStepDto,
} from 'formsg-shared/types'
import { err, ok, Result } from 'neverthrow'

import { MalformedParametersError } from '../core/core.errors'

// Step 1 providers that can prefill MyInfo fields.
const MYINFO_FORM_AUTH_TYPES: FormAuthType[] = [
  FormAuthType.MyInfo,
  FormAuthType.SGID_MyInfo,
]

// Step 1 providers whose login flow needs the e-service ID.
const ESRVC_ID_FORM_AUTH_TYPES: FormAuthType[] = [
  FormAuthType.SP,
  FormAuthType.CP,
]

export type MrfLoginConfig = {
  authType?: FormAuthType
  workflow?: Pick<FormWorkflowStepDto, 'auth' | 'edit'>[]
}

export const hasMyInfoCapableLogin = ({
  authType,
  workflow,
}: MrfLoginConfig): boolean =>
  (!!authType && MYINFO_FORM_AUTH_TYPES.includes(authType)) ||
  (workflow ?? []).some(
    (step, index) => index > 0 && step.auth?.auth_type === FormAuthType.MyInfo,
  )

export const hasCorppassLaterStep = (
  workflow: MrfLoginConfig['workflow'],
): boolean =>
  (workflow ?? []).some(
    (step, index) => index > 0 && step.auth?.auth_type === FormAuthType.CP,
  )

export const requiresEsrvcIdToPublish = ({
  authType,
  workflow,
}: MrfLoginConfig): boolean =>
  (!!authType && ESRVC_ID_FORM_AUTH_TYPES.includes(authType)) ||
  hasCorppassLaterStep(workflow)

export const MISSING_ESRVC_ID_ERROR_MESSAGE =
  'Add an e-service ID before using Singpass or Corppass login.'
export const NO_MYINFO_LOGIN_ERROR_MESSAGE =
  'Keep a Singpass step or remove the remaining MyInfo fields from the form.'

/**
 * Validates the login configuration of a multirespondent form after a change.
 * @param original the saved configuration, so pre-existing inconsistencies don't block unrelated edits
 */
export const validateMrfLoginConfiguration = ({
  formFields,
  resulting,
  original,
  esrvcId,
  isPublishing = false,
}: {
  formFields: { _id?: unknown; myInfo?: { attr?: string } }[]
  resulting: MrfLoginConfig
  original: MrfLoginConfig
  esrvcId?: string
  isPublishing?: boolean
}): Result<true, MalformedParametersError> => {
  const workflow = resulting.workflow ?? []

  if (workflow[0]?.auth) {
    return err(
      new MalformedParametersError(
        "Step 1 login is set in the form's login settings, not on the step.",
      ),
    )
  }

  const myInfoFieldIds = formFields
    .filter((field) => !!field.myInfo?.attr)
    .map((field) => String(field._id))

  for (const fieldId of myInfoFieldIds) {
    const owners = workflow
      .map((step, index) =>
        step.edit.map(String).includes(fieldId) ? index : -1,
      )
      .filter((index) => index !== -1)
    if (owners.length > 1) {
      return err(
        new MalformedParametersError(
          'A MyInfo field can only be filled in one workflow step.',
        ),
      )
    }
    const [owner] = owners
    const isOwnerMyInfoStep =
      owner === 0
        ? !!resulting.authType &&
          MYINFO_FORM_AUTH_TYPES.includes(resulting.authType)
        : workflow[owner]?.auth?.auth_type === FormAuthType.MyInfo
    if (owner !== undefined && !isOwnerMyInfoStep) {
      return err(
        new MalformedParametersError(
          'MyInfo fields can only be filled in a step that uses Singpass login.',
        ),
      )
    }
  }

  if (
    myInfoFieldIds.length > 0 &&
    !hasMyInfoCapableLogin(resulting) &&
    hasMyInfoCapableLogin(original)
  ) {
    return err(new MalformedParametersError(NO_MYINFO_LOGIN_ERROR_MESSAGE))
  }

  const needsEsrvcId =
    hasCorppassLaterStep(workflow) ||
    (isPublishing && requiresEsrvcIdToPublish(resulting))
  if (needsEsrvcId && !esrvcId?.trim()) {
    return err(new MalformedParametersError(MISSING_ESRVC_ID_ERROR_MESSAGE))
  }

  return ok(true)
}

// Raw steps keep the eligible-respondent list reference that JSON output hides.
export const getRawWorkflow = (form: {
  workflow?: FormWorkflowDto
}): FormWorkflowStepDto[] =>
  (form.workflow ?? []).map((step) =>
    'toObject' in step && typeof step.toObject === 'function'
      ? step.toObject()
      : step,
  )
