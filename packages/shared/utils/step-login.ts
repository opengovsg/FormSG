import {
  FormAuthType,
  FormResponseMode,
  FormWorkflowStepAuth,
  WorkflowStepAuthType,
} from '../types/form'

import {
  getLoginIdentityAttr,
  getLoginIdentityAttrsForAuthType,
  getLoginIdentityConfigErrors,
  isLoginIdentityField,
  isMyInfoDataField,
  LOGIN_IDENTITY_LABELS,
  LoginIdentityCandidate,
} from './login-identity'

/**
 * Login on any MRF workflow step. Step 1's login is the form-level
 * `authType`; later steps carry their own `auth`. Every reader of "which
 * login does this step use" goes through `getStepAuthType`.
 */

// Structural, so schema documents, DTOs and public fields all fit.
export type SourceField = LoginIdentityCandidate & { title?: string }

export type StepLoginStep = {
  _id?: unknown
  edit: readonly unknown[]
  auth?: FormWorkflowStepAuth | null
}

export type StepLoginForm = {
  authType: FormAuthType
  workflow?: readonly StepLoginStep[] | null
}

export const STEP_LOGIN_PROVIDER_LABELS: Record<WorkflowStepAuthType, string> =
  {
    [FormAuthType.MyInfo]: 'Singpass',
    [FormAuthType.CP]: 'Corppass',
  }

export const isWorkflowStepAuthType = (
  authType: FormAuthType | undefined | null,
): authType is WorkflowStepAuthType =>
  authType === FormAuthType.MyInfo || authType === FormAuthType.CP

/**
 * The login whose data fills the field, if any: MyInfo data fields and the
 * NRIC/FIN identity field need Singpass; UEN and UID identity fields need
 * Corppass.
 */
export const getFieldSourceProvider = (
  field: SourceField,
): WorkflowStepAuthType | undefined => {
  if (field.corppass?.attr) return FormAuthType.CP
  if (field.myInfo?.attr) return FormAuthType.MyInfo
  return undefined
}

/**
 * Step 1 uses the form-level login, including legacy ones. Later steps use
 * their own `auth`, where absent means no login.
 */
export const getStepAuthType = (
  form: Pick<StepLoginForm, 'authType'>,
  workflow: readonly StepLoginStep[] | null | undefined,
  stepIndex: number,
): FormAuthType =>
  stepIndex === 0
    ? form.authType
    : ((workflow ?? [])[stepIndex]?.auth?.auth_type ?? FormAuthType.NIL)

export const hasLaterStepLogin = (
  workflow: readonly StepLoginStep[] | null | undefined,
): boolean => (workflow ?? []).slice(1).some((step) => !!step.auth)

/** Whether Step 1 or any later step uses the given login. */
export const formUsesAuthType = (
  form: StepLoginForm,
  authType: FormAuthType,
): boolean =>
  form.authType === authType ||
  (form.workflow ?? [])
    .slice(1)
    .some((step) => step.auth?.auth_type === authType)

/**
 * Whether a form or submission snapshot has saved Step 2+ login configuration.
 * The runtime keeps supporting it whatever the rollout flag says.
 */
export const hasStepLoginConfig = ({
  workflow = [],
}: {
  workflow?: readonly StepLoginStep[] | null
}): boolean => hasLaterStepLogin(workflow)

/** Fields a step may fill in. Without a workflow, Step 1 fills in all fields. */
export const getStepFields = <F extends { _id?: unknown }>(
  formFields: readonly F[],
  workflow: readonly Pick<StepLoginStep, 'edit'>[] | null | undefined,
  stepIndex: number,
): F[] => {
  const steps = workflow ?? []
  const step = steps[stepIndex]
  if (!step) {
    return stepIndex === 0 && steps.length === 0 ? [...formFields] : []
  }
  const editIds = new Set(step.edit.map(String))
  return formFields.filter((field) => editIds.has(String(field._id)))
}

/**
 * The step whose edit list holds the field, if any. A form without a
 * workflow treats its first respondent as the owner of every field.
 */
export const getOwningStepIndex = (
  field: { _id?: unknown },
  workflow: readonly Pick<StepLoginStep, 'edit'>[] | null | undefined,
): number | undefined => {
  const steps = workflow ?? []
  if (steps.length === 0) return 0
  const fieldId = String(field._id)
  const index = steps.findIndex((step) =>
    step.edit.some((id) => String(id) === fieldId),
  )
  return index === -1 ? undefined : index
}

/** Whether a step's login can fill the field. Plain fields always pass. */
export const canStepLoginFillField = (
  field: SourceField,
  stepAuthType: FormAuthType,
): boolean => {
  const provider = getFieldSourceProvider(field)
  if (!provider) return true
  if (provider !== stepAuthType) return false
  const attr = getLoginIdentityAttr(field)
  return !attr || getLoginIdentityAttrsForAuthType(stepAuthType).includes(attr)
}

/** Login-filled fields on the step that its login cannot fill. */
export const getStepFieldsNeedingLogin = <F extends SourceField>(
  stepFields: readonly F[],
  stepAuthType: FormAuthType,
): F[] =>
  stepFields.filter((field) => !canStepLoginFillField(field, stepAuthType))

const getOwnerSteps = (
  workflow: readonly StepLoginStep[],
): Map<string, number[]> => {
  const owners = new Map<string, number[]>()
  workflow.forEach((step, stepIndex) =>
    step.edit.forEach((fieldId) => {
      const id = String(fieldId)
      owners.set(id, [...(owners.get(id) ?? []), stepIndex])
    }),
  )
  return owners
}

const fieldLabel = (field: SourceField): string => {
  const attr = getLoginIdentityAttr(field)
  const title = field.title ?? (attr ? LOGIN_IDENTITY_LABELS[attr] : undefined)
  return `"${title ?? 'Untitled field'}"`
}

/**
 * Problems with which steps fill in MyInfo and identity fields:
 * - a login-filled field belongs to at most one step;
 * - the owning step's login must be able to fill the field;
 * - a step collects each login identity once.
 * Unassigned fields are allowed: they collect nothing.
 */
export const getStepLoginConfigErrors = ({
  form,
  formFields,
  workflow,
}: {
  form: Pick<StepLoginForm, 'authType'>
  formFields: readonly SourceField[]
  workflow: readonly StepLoginStep[] | null | undefined
}): string[] => {
  const errors: string[] = []
  const steps = workflow ?? []
  if (steps.length === 0) return errors
  const owners = getOwnerSteps(steps)
  const identitiesByStep = new Map<number, Set<string>>()

  for (const field of formFields) {
    const provider = getFieldSourceProvider(field)
    if (!provider) continue
    const fieldOwners = owners.get(String(field._id)) ?? []
    const label = fieldLabel(field)

    if (fieldOwners.length > 1) {
      errors.push(`${label} can only be filled in by one step.`)
    }

    for (const stepIndex of fieldOwners) {
      const stepAuthType = getStepAuthType(form, steps, stepIndex)
      if (!canStepLoginFillField(field, stepAuthType)) {
        errors.push(
          `Step ${stepIndex + 1} needs ${STEP_LOGIN_PROVIDER_LABELS[provider]} login to fill in ${label}.`,
        )
      }
      const attr = getLoginIdentityAttr(field)
      if (attr) {
        const stepIdentities = identitiesByStep.get(stepIndex) ?? new Set()
        if (stepIdentities.has(attr)) {
          errors.push(
            `Step ${stepIndex + 1} can only collect ${LOGIN_IDENTITY_LABELS[attr]} once.`,
          )
        }
        identitiesByStep.set(stepIndex, stepIdentities.add(attr))
      }
    }
  }
  return errors
}

export const MYINFO_FIELDS_NEED_SINGPASS_STEP =
  "Myinfo fields need a step with Singpass login. Set a step's login to Singpass, or remove the Myinfo fields."

/** For a form left without steps, e.g. after deleting the workflow. */
export const MYINFO_FIELDS_NEED_FORM_SINGPASS =
  'Myinfo fields need Singpass login. Remove the Myinfo fields, or turn on Singpass in Settings first.'

/**
 * Login problems the form's save hooks would reject, for writes that skip
 * them (workflow, settings and duplicate writes). Mirrors the `form_fields`
 * Myinfo validator, `getLoginIdentityConfigErrors` and
 * `getStepLoginConfigErrors`.
 */
export const getResultingLoginErrors = ({
  authType,
  responseMode,
  isSubmitterIdCollectionEnabled,
  form_fields = [],
  workflow,
  allowIncompleteDraft = false,
}: {
  authType: FormAuthType
  responseMode: FormResponseMode
  isSubmitterIdCollectionEnabled?: boolean
  form_fields?: readonly SourceField[]
  workflow?: readonly StepLoginStep[] | null
  allowIncompleteDraft?: boolean
}): string[] => {
  const steps = workflow ?? []
  // Any step's Singpass login may fill Myinfo fields.
  const myInfoErrors =
    !allowIncompleteDraft &&
    form_fields.some(isMyInfoDataField) &&
    !formUsesAuthType({ authType, workflow: steps }, FormAuthType.MyInfo)
      ? [
          steps.length > 0
            ? MYINFO_FIELDS_NEED_SINGPASS_STEP
            : MYINFO_FIELDS_NEED_FORM_SINGPASS,
        ]
      : []
  return [
    ...getLoginIdentityConfigErrors({
      authType,
      responseMode,
      isSubmitterIdCollectionEnabled,
      form_fields,
      workflow: steps,
      allowMissingLogin: allowIncompleteDraft,
    }),
    ...getStepLoginConfigErrors({
      form: { authType },
      formFields: form_fields,
      workflow: steps,
    }),
    ...myInfoErrors,
  ]
}

/** Incomplete authentication fields are allowed in drafts, never in a published form. */
export const getLoginFieldPublishErrors = (
  config: Parameters<typeof getResultingLoginErrors>[0],
): string[] => {
  const errors = getResultingLoginErrors({
    ...config,
    allowIncompleteDraft: false,
  })
  const workflow = config.workflow ?? []
  const owners = getOwnerSteps(workflow)
  for (const field of config.form_fields ?? []) {
    const provider = getFieldSourceProvider(field)
    if (!provider) continue
    const providerLabel = STEP_LOGIN_PROVIDER_LABELS[provider]
    if (config.responseMode === FormResponseMode.Multirespondent) {
      const fieldOwners = owners.get(String(field._id)) ?? []
      if (fieldOwners.length === 0) {
        errors.push(
          `${fieldLabel(field)} must be assigned to a step with ${providerLabel} authentication before publishing.`,
        )
      }
    } else if (!canStepLoginFillField(field, config.authType)) {
      errors.push(
        `${fieldLabel(field)} needs ${providerLabel} authentication before publishing.`,
      )
    }
  }
  return Array.from(new Set(errors))
}

export { isLoginIdentityField }
