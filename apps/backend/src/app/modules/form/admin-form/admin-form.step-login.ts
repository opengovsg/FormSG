import {
  FirstStepLoginInput,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  FormWorkflowStepAuth,
  FormWorkflowStepWriteDto,
} from 'formsg-shared/types'
import {
  canConvertSubmitterIdCollection,
  getLoginIdentityConfigErrors,
} from 'formsg-shared/utils/login-identity'
import {
  getResultingLoginErrors,
  getStepAuthType,
  getStepFields,
  getStepFieldsNeedingLogin,
  getStepLoginConfigErrors,
  StepLoginStep,
} from 'formsg-shared/utils/step-login'
import { omit } from 'lodash'
import { err, ok, Result } from 'neverthrow'

import { IPopulatedForm } from '../../../../types'
import { MalformedParametersError } from '../../core/core.errors'
import { ForbiddenFormError, FormOpenToResponsesError } from '../form.errors'
import { isFormMultirespondent } from '../form.utils'

/**
 * Authoring rules for login on MRF workflow steps. Step 1 keeps the
 * form-level login; later steps carry their own `auth`. The rollout flag
 * gates adopting a later-step login only: a saved one stays editable enough
 * to maintain or remove.
 */

export const STEP_LOGIN_NOT_AVAILABLE =
  'Login on later steps is not available for this form'
export const STEP_ONE_LOGIN_IN_SETTINGS =
  'Set Step 1 login in the form settings'
export const FIRST_STEP_LOGIN_ONLY_ON_STEP_ONE =
  'Step 1 login can only be set with Step 1'
export const CONVERT_BEFORE_LATER_STEP_LOGIN =
  'Convert the Step 1 login to NRIC/FIN fields before using login on later steps'
export const REMOVE_MYINFO_FIELDS_FIRST =
  'Remove the Myinfo fields from this step first.'
export const CLOSE_FORM_BEFORE_LOGIN_CHANGE =
  'Close your form to new responses before changing its login settings'

export type StepLoginWriteError =
  | MalformedParametersError
  | ForbiddenFormError
  | FormOpenToResponsesError

/** Form-level login as `first_step_login` writes it. */
export type FormLoginUpdate = {
  authType: FormAuthType
  esrvcId?: string
}

type LoginForm = Pick<
  IPopulatedForm,
  | 'authType'
  | 'esrvcId'
  | 'status'
  | 'responseMode'
  | 'isSubmitterIdCollectionEnabled'
  | 'form_fields'
>

const getSavedWorkflow = (form: IPopulatedForm): readonly StepLoginStep[] =>
  isFormMultirespondent(form) ? (form.workflow ?? []) : []

const isSameAuth = (
  a: FormWorkflowStepAuth | null | undefined,
  b: FormWorkflowStepAuth | null | undefined,
): boolean =>
  (a?.auth_type ?? null) === (b?.auth_type ?? null) &&
  (a?.esrvc_id ?? '') === (b?.esrvc_id ?? '')

const isLoginChanged = (
  form: Pick<LoginForm, 'authType' | 'esrvcId'>,
  update: FormLoginUpdate,
): boolean =>
  update.authType !== form.authType ||
  (update.esrvcId !== undefined && update.esrvcId !== (form.esrvcId ?? ''))

/**
 * Checks a change to the form-level login (Step 1's). Shared by the settings
 * PATCH and by `first_step_login` on a Step 1 save, which bypass the form's
 * save hooks. The resulting workflow is the one the write will leave behind.
 */
export const checkFormLoginWrite = (
  form: LoginForm,
  update: FormLoginUpdate,
  workflow: readonly StepLoginStep[],
): Result<true, MalformedParametersError | FormOpenToResponsesError> => {
  if (form.status === FormStatus.Public && isLoginChanged(form, update)) {
    return err(new FormOpenToResponsesError(CLOSE_FORM_BEFORE_LOGIN_CHANGE))
  }
  const identityErrors = getLoginIdentityConfigErrors({
    authType: update.authType,
    responseMode: form.responseMode,
    isSubmitterIdCollectionEnabled: form.isSubmitterIdCollectionEnabled,
    form_fields: form.form_fields,
    workflow,
    allowMissingLogin: form.status !== FormStatus.Public,
  })
  if (identityErrors.length > 0) {
    return err(new MalformedParametersError(identityErrors.join(' ')))
  }
  // Query updates skip the form's Myinfo field validator, so a new Step 1
  // login must still fill every Myinfo field Step 1 owns.
  if (
    form.responseMode === FormResponseMode.Multirespondent &&
    update.authType !== form.authType
  ) {
    const stepOneFields = getStepFields(form.form_fields ?? [], workflow, 0)
    if (getStepFieldsNeedingLogin(stepOneFields, update.authType).length > 0) {
      return err(new MalformedParametersError(REMOVE_MYINFO_FIELDS_FIRST))
    }
  }
  // Includes Myinfo fields no step's login fills any more.
  if (update.authType !== form.authType) {
    const loginErrors = getResultingLoginErrors({
      authType: update.authType,
      responseMode: form.responseMode,
      isSubmitterIdCollectionEnabled: form.isSubmitterIdCollectionEnabled,
      form_fields: form.form_fields,
      workflow,
      allowIncompleteDraft: form.status !== FormStatus.Public,
    })
    if (loginErrors.length > 0) {
      return err(new MalformedParametersError(loginErrors.join(' ')))
    }
  }
  return ok(true)
}

const toFormLoginUpdate = (
  input: FirstStepLoginInput | undefined,
): FormLoginUpdate | undefined =>
  input
    ? {
        authType: input.auth_type,
        ...(input.esrvc_id !== undefined ? { esrvcId: input.esrvc_id } : {}),
      }
    : undefined

/**
 * The step as it is saved: `first_step_login` is request-only and a null
 * `auth` means no login.
 */
export const toSavedWorkflowStep = <T extends FormWorkflowStepWriteDto>(
  step: T,
): Omit<T, 'auth' | 'first_step_login'> & { auth?: FormWorkflowStepAuth } => {
  const saved = omit(step, ['auth', 'first_step_login'])
  return step.auth ? { ...saved, auth: step.auth } : saved
}

/**
 * Checks the login side of creating or updating a workflow step.
 * `stepNumber` is the index the step takes in `resultingWorkflow`, which
 * already holds the saved shape of the step.
 */
export const checkWorkflowStepLoginWrite = ({
  form,
  stepNumber,
  step,
  resultingWorkflow,
  isStepLoginEnabled,
}: {
  form: IPopulatedForm
  stepNumber: number
  step: Pick<FormWorkflowStepWriteDto, 'auth' | 'first_step_login'>
  resultingWorkflow: readonly StepLoginStep[]
  isStepLoginEnabled: boolean
}): Result<{ formLogin?: FormLoginUpdate }, StepLoginWriteError> => {
  if (form.responseMode !== FormResponseMode.Multirespondent) return ok({})

  const isFirstStep = stepNumber === 0
  const nextAuth = step.auth ?? undefined
  if (isFirstStep && nextAuth) {
    return err(new MalformedParametersError(STEP_ONE_LOGIN_IN_SETTINGS))
  }
  if (!isFirstStep && step.first_step_login) {
    return err(new MalformedParametersError(FIRST_STEP_LOGIN_ONLY_ON_STEP_ONE))
  }

  const savedAuth = getSavedWorkflow(form)[stepNumber]?.auth ?? undefined
  const isAuthChanged = !isSameAuth(savedAuth, nextAuth)
  // Adding a login or switching provider is new adoption; keeping, removing
  // or re-keying a saved one is maintenance.
  const isAuthAdopted =
    !!nextAuth && savedAuth?.auth_type !== nextAuth.auth_type
  if (isAuthAdopted && !isStepLoginEnabled) {
    return err(new ForbiddenFormError(STEP_LOGIN_NOT_AVAILABLE))
  }

  const formLogin = toFormLoginUpdate(step.first_step_login)
  const isFormLoginChanged = !!formLogin && isLoginChanged(form, formLogin)
  if (
    form.status === FormStatus.Public &&
    (isAuthChanged || isFormLoginChanged)
  ) {
    return err(new FormOpenToResponsesError(CLOSE_FORM_BEFORE_LOGIN_CHANGE))
  }

  // The legacy toggle records Step 1's identity on every submission. Later
  // steps need identity fields instead, so the toggle converts first.
  if (isAuthAdopted && canConvertSubmitterIdCollection(form)) {
    return err(new MalformedParametersError(CONVERT_BEFORE_LATER_STEP_LOGIN))
  }

  const resultingForm = { authType: formLogin?.authType ?? form.authType }
  const stepAuthType = getStepAuthType(
    resultingForm,
    resultingWorkflow,
    stepNumber,
  )
  const stepFields = getStepFields(
    form.form_fields,
    resultingWorkflow,
    stepNumber,
  )
  if (getStepFieldsNeedingLogin(stepFields, stepAuthType).length > 0) {
    return err(new MalformedParametersError(REMOVE_MYINFO_FIELDS_FIRST))
  }

  const [configError] = getStepLoginConfigErrors({
    form: resultingForm,
    formFields: form.form_fields,
    workflow: resultingWorkflow,
  })
  if (configError) return err(new MalformedParametersError(configError))

  if (formLogin) {
    const loginCheck = checkFormLoginWrite(form, formLogin, resultingWorkflow)
    if (loginCheck.isErr()) return err(loginCheck.error)
  }
  return ok(formLogin ? { formLogin } : {})
}
