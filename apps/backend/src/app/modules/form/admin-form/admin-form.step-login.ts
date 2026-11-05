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
  getLoginIdentityFormErrors,
  isLoginIdentityField,
} from 'formsg-shared/utils/login-identity'
import {
  getAuthEsrvcId,
  getResultingLoginErrors,
  StepLoginStep,
  usesStepLoginRules,
} from 'formsg-shared/utils/step-login'
import { omit } from 'lodash'
import { err, ok, Result } from 'neverthrow'

import { IPopulatedForm } from '../../../../types'
import { MalformedParametersError } from '../../core/core.errors'
import { ForbiddenFormError, FormOpenToResponsesError } from '../form.errors'
import { getSavedWorkflow } from '../form.utils'

/**
 * Authoring rules for login on MRF workflow steps. Step 1 keeps the
 * form-level login; later steps carry their own `auth`. The rollout flag
 * gates a form's first later-step login only: a form that already has one
 * keeps every step login rule, including adding or switching logins.
 */

export const STEP_LOGIN_NOT_AVAILABLE =
  'Login on later steps is not available for this form'
export const STEP_ONE_LOGIN_IN_SETTINGS =
  'Set Step 1 login in the form settings'
export const FIRST_STEP_LOGIN_ONLY_ON_STEP_ONE =
  'Step 1 login can only be set with Step 1'
export const CONVERT_BEFORE_LATER_STEP_LOGIN =
  'Convert the Step 1 login to NRIC/FIN fields before using login on later steps'
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

const isSameAuth = (
  a: FormWorkflowStepAuth | null | undefined,
  b: FormWorkflowStepAuth | null | undefined,
): boolean =>
  (a?.auth_type ?? null) === (b?.auth_type ?? null) &&
  (getAuthEsrvcId(a) ?? '') === (getAuthEsrvcId(b) ?? '')

const isLoginChanged = (
  form: Pick<LoginForm, 'authType' | 'esrvcId'>,
  update: FormLoginUpdate,
): boolean =>
  update.authType !== form.authType ||
  (update.esrvcId !== undefined && update.esrvcId !== (form.esrvcId ?? ''))

/**
 * Checks a change to the form-level login (Step 1's) from the settings
 * PATCH, which bypasses the form's save hooks. A Step 1 save with
 * `first_step_login` gets the same checks from `checkWorkflowStepLoginWrite`
 * and the resulting-workflow check.
 */
export const checkFormLoginWrite = (
  form: LoginForm,
  update: FormLoginUpdate,
  workflow: readonly StepLoginStep[],
): Result<true, MalformedParametersError | FormOpenToResponsesError> => {
  if (form.status === FormStatus.Public && isLoginChanged(form, update)) {
    return err(new FormOpenToResponsesError(CLOSE_FORM_BEFORE_LOGIN_CHANGE))
  }
  if (update.authType === form.authType) {
    // Only the legacy toggle can change which identity rules apply.
    const identityErrors = form.form_fields?.some(isLoginIdentityField)
      ? getLoginIdentityFormErrors(form)
      : []
    return identityErrors.length > 0
      ? err(new MalformedParametersError(identityErrors.join(' ')))
      : ok(true)
  }
  const loginErrors = getResultingLoginErrors({
    ...form,
    authType: update.authType,
    workflow,
  })
  return loginErrors.length > 0
    ? err(new MalformedParametersError(loginErrors.join(' ')))
    : ok(true)
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

const REQUEST_ONLY_STEP_KEYS = [
  'auth',
  'first_step_login',
  'expected_last_modified',
  'delete_auth_field_ids',
] as const
type RequestOnlyStepKey = (typeof REQUEST_ONLY_STEP_KEYS)[number]

/**
 * The step as it is saved: `first_step_login`, `expected_last_modified` and
 * `delete_auth_field_ids` are request-only, and a null `auth` means no login.
 */
export const toSavedWorkflowStep = <T extends FormWorkflowStepWriteDto>(
  step: T,
): Omit<T, RequestOnlyStepKey> & { auth?: FormWorkflowStepAuth } => {
  const saved = omit(step, REQUEST_ONLY_STEP_KEYS)
  return step.auth ? { ...saved, auth: step.auth } : saved
}

/**
 * Checks the step-specific login rules for creating or updating the step at
 * `stepNumber`: where Step 1's login goes, the rollout flag, open forms and
 * the legacy toggle. The caller checks the fields of the resulting form with
 * `getResultingLoginErrors`.
 */
export const checkWorkflowStepLoginWrite = ({
  form,
  stepNumber,
  step,
  isStepLoginEnabled,
}: {
  form: IPopulatedForm
  stepNumber: number
  step: Pick<FormWorkflowStepWriteDto, 'auth' | 'first_step_login'>
  isStepLoginEnabled: boolean
}): Result<{ formLogin?: FormLoginUpdate }, StepLoginWriteError> => {
  if (form.responseMode !== FormResponseMode.Multirespondent) return ok({})

  const isFirstStep = stepNumber === 0
  const nextAuth = step.auth
  if (isFirstStep && nextAuth) {
    return err(new MalformedParametersError(STEP_ONE_LOGIN_IN_SETTINGS))
  }
  if (!isFirstStep && step.first_step_login) {
    return err(new MalformedParametersError(FIRST_STEP_LOGIN_ONLY_ON_STEP_ONE))
  }

  const savedAuth = getSavedWorkflow(form)[stepNumber]?.auth
  const isAuthChanged = !isSameAuth(savedAuth, nextAuth)
  // Adding a login or switching provider is new adoption; keeping, removing
  // or re-keying a saved one is maintenance.
  const isAuthAdopted =
    !!nextAuth && savedAuth?.auth_type !== nextAuth.auth_type
  if (
    isAuthAdopted &&
    !usesStepLoginRules(getSavedWorkflow(form), isStepLoginEnabled)
  ) {
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

  return ok(formLogin ? { formLogin } : {})
}
