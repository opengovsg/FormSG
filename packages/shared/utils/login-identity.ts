import {
  BasicField,
  CorppassAttribute,
  MyInfoAttribute,
  NricFieldBase,
  UenFieldBase,
} from '../types/field'
import {
  FormAuthType,
  FormResponseMode,
  FormWorkflowStepAuth,
} from '../types/form'

/**
 * Identities a Step 1 login fills into a field: MyInfo NRIC/FIN on an NRIC
 * field, and Corppass UEN or UID.
 */
export type LoginIdentityAttribute = MyInfoAttribute.UinFin | CorppassAttribute

// Structural, so schema documents, DTOs and public fields all fit.
export type LoginIdentityCandidate = {
  _id?: unknown
  fieldType: string
  myInfo?: { attr?: string } | null
  corppass?: { attr?: string } | null
}

type LoginIdentityStep = {
  edit: readonly unknown[]
  // Steps after Step 1 may carry their own login; Step 1 never does.
  auth?: FormWorkflowStepAuth | null
}

/** Names admins see in the builder and errors, and new fields' questions. */
export const LOGIN_IDENTITY_LABELS: Record<LoginIdentityAttribute, string> = {
  [MyInfoAttribute.UinFin]: 'NRIC/FIN',
  [CorppassAttribute.Uen]: 'UEN',
  [CorppassAttribute.Uid]: 'NRIC/FIN',
}

export const LOGIN_IDENTITY_SOURCES: Record<LoginIdentityAttribute, string> = {
  [MyInfoAttribute.UinFin]: 'Myinfo',
  [CorppassAttribute.Uen]: 'Myinfo',
  [CorppassAttribute.Uid]: 'Myinfo',
}

/**
 * The login that fills the field, shown on NRIC/FIN fields only, since both
 * Singpass and Corppass have one.
 */
export const LOGIN_IDENTITY_LOGINS: Partial<
  Record<LoginIdentityAttribute, string>
> = {
  [MyInfoAttribute.UinFin]: 'Singpass',
  [CorppassAttribute.Uid]: 'Corppass',
}

/** The identity the respondent's login fills into this field, if any. */
export const getLoginIdentityAttr = (
  field: LoginIdentityCandidate,
): LoginIdentityAttribute | undefined => {
  if (
    field.fieldType === BasicField.Nric &&
    field.myInfo?.attr === MyInfoAttribute.UinFin
  ) {
    return MyInfoAttribute.UinFin
  }
  if (
    field.fieldType === BasicField.Uen &&
    field.corppass?.attr === CorppassAttribute.Uen
  ) {
    return CorppassAttribute.Uen
  }
  if (
    field.fieldType === BasicField.Nric &&
    field.corppass?.attr === CorppassAttribute.Uid
  ) {
    return CorppassAttribute.Uid
  }
  return undefined
}

export type LoginIdentityFieldBase = NricFieldBase | UenFieldBase

// Not a type guard: a false result must not narrow NRIC or UEN
// fields away, since ordinary ones are not login identity fields.
export const isLoginIdentityField = (field: LoginIdentityCandidate): boolean =>
  !!getLoginIdentityAttr(field)

/**
 * Whether the field holds MyInfo data. The NRIC/FIN login identity field uses
 * `myInfo` too, but is filled from the login session, not from MyInfo.
 */
export const isMyInfoDataField = (field: LoginIdentityCandidate): boolean =>
  !!field.myInfo?.attr && !isLoginIdentityField(field)

/**
 * Whether the respondent's login fills the field: a MyInfo data field or a
 * login identity field. These share one limit per form.
 */
export const isLoginField = (field: LoginIdentityCandidate): boolean =>
  isMyInfoDataField(field) || isLoginIdentityField(field)

/**
 * Fields a login fills: MyInfo data fields and login identity fields. Their
 * owning step's login (Step 1's form-level login, or a later step's own
 * `auth`) fills them; respondents never type them.
 */
export const isLoginFilledField = (field: LoginIdentityCandidate): boolean =>
  !!field.myInfo?.attr || isLoginIdentityField(field)

/**
 * Identities each Step 1 login can fill, in the order the builder lists them
 * and Convert adds them. These match what the "Collect NRIC/FIN/UENs" toggle
 * records for the same login.
 */
export const getLoginIdentityAttrsForAuthType = (
  authType: FormAuthType,
): LoginIdentityAttribute[] => {
  switch (authType) {
    case FormAuthType.MyInfo:
      return [MyInfoAttribute.UinFin]
    case FormAuthType.CP:
      return [CorppassAttribute.Uid, CorppassAttribute.Uen]
    // Singpass-only login is being removed, so it gets no identity fields.
    case FormAuthType.SP:
    case FormAuthType.NIL:
      return []
  }
}

/** Login identity fields are supported by Storage and MRF forms. */
export const isLoginIdentityResponseMode = (
  responseMode: FormResponseMode,
): boolean =>
  responseMode === FormResponseMode.Encrypt ||
  responseMode === FormResponseMode.Multirespondent

type LoginIdentityCollectionForm = {
  authType: FormAuthType
  isSubmitterIdCollectionEnabled?: boolean
  form_fields?: readonly LoginIdentityCandidate[]
  workflow?: readonly LoginIdentityStep[]
}

/**
 * The step whose edit list holds the field, if any. A form without a
 * workflow treats its first respondent as the owner of every field.
 */
export const getOwningStepIndex = (
  field: { _id?: unknown },
  workflow: readonly Pick<LoginIdentityStep, 'edit'>[] | null | undefined,
): number | undefined => {
  const steps = workflow ?? []
  if (steps.length === 0) return 0
  const fieldId = String(field._id)
  const index = steps.findIndex((step) =>
    step.edit.some((id) => String(id) === fieldId),
  )
  return index === -1 ? undefined : index
}

/** The login of the step that owns the field, if any step does. */
export const getLoginIdentityFieldOwnerAuthType = (
  field: LoginIdentityCandidate,
  form: { authType: FormAuthType },
  workflow: readonly LoginIdentityStep[] | null | undefined,
): FormAuthType | undefined => {
  const index = getOwningStepIndex(field, workflow)
  if (index === undefined) return undefined
  return index === 0
    ? form.authType
    : (workflow?.[index]?.auth?.auth_type ?? FormAuthType.NIL)
}

/** Whether Step 1 fills the field. Step 1's login is the form-level login. */
export const isLoginIdentityFieldOwned = (
  field: LoginIdentityCandidate,
  workflow?: readonly LoginIdentityStep[],
): boolean => getOwningStepIndex(field, workflow) === 0

/**
 * Whether submissions record the respondent's login identity: through the
 * legacy toggle, or through an owned identity field the login fills.
 */
export const isSubmitterIdCollected = ({
  authType,
  isSubmitterIdCollectionEnabled,
  form_fields = [],
  workflow,
}: LoginIdentityCollectionForm): boolean => {
  if (isSubmitterIdCollectionEnabled) return true
  const loginAttrs = getLoginIdentityAttrsForAuthType(authType)
  return form_fields.some((field) => {
    const attr = getLoginIdentityAttr(field)
    return (
      !!attr &&
      loginAttrs.includes(attr) &&
      isLoginIdentityFieldOwned(field, workflow)
    )
  })
}

/** Whether a form can still convert its legacy toggle into fields. */
export const canConvertSubmitterIdCollection = ({
  authType,
  responseMode,
  isSubmitterIdCollectionEnabled,
}: {
  authType: FormAuthType
  responseMode: FormResponseMode
  isSubmitterIdCollectionEnabled?: boolean
}): boolean =>
  !!isSubmitterIdCollectionEnabled &&
  isLoginIdentityResponseMode(responseMode) &&
  getLoginIdentityAttrsForAuthType(authType).length > 0

/** A new login identity field, as the builder and Convert create it. */
export const createLoginIdentityField = (
  attr: LoginIdentityAttribute,
): LoginIdentityFieldBase => {
  const base = {
    title: LOGIN_IDENTITY_LABELS[attr],
    description: '',
    required: true,
    disabled: false,
  }
  switch (attr) {
    case MyInfoAttribute.UinFin:
      return { ...base, fieldType: BasicField.Nric, myInfo: { attr } }
    case CorppassAttribute.Uen:
      return { ...base, fieldType: BasicField.Uen, corppass: { attr } }
    case CorppassAttribute.Uid:
      return { ...base, fieldType: BasicField.Nric, corppass: { attr } }
  }
}

/** Problems with the form's login identity fields, if any. */
export const getLoginIdentityConfigErrors = ({
  authType,
  responseMode,
  isSubmitterIdCollectionEnabled,
  form_fields = [],
  workflow = [],
}: LoginIdentityCollectionForm & {
  responseMode: FormResponseMode
}): string[] => {
  const identityFields = form_fields.flatMap((field) => {
    const attr = getLoginIdentityAttr(field)
    return attr ? [{ field, attr }] : []
  })
  if (identityFields.length === 0) return []

  if (!isLoginIdentityResponseMode(responseMode)) {
    return [
      'NRIC/FIN/UEN login fields are only available in storage mode and multi-respondent forms.',
    ]
  }

  const errors: string[] = []
  if (isSubmitterIdCollectionEnabled) {
    errors.push(
      'NRIC/FIN/UEN login fields and the "Collect NRIC/FIN/UENs" setting cannot both be used. Convert the setting, or remove the fields.',
    )
  }

  for (const { field, attr } of identityFields) {
    const label = LOGIN_IDENTITY_LABELS[attr]

    // The owning step's login must be able to fill the field. With a
    // workflow, an unassigned field collects nothing and needs no login.
    const ownerAuthType = getLoginIdentityFieldOwnerAuthType(
      field,
      { authType },
      workflow,
    )
    if (
      ownerAuthType !== undefined &&
      !getLoginIdentityAttrsForAuthType(ownerAuthType).includes(attr)
    ) {
      errors.push(
        attr === MyInfoAttribute.UinFin
          ? `${label} fields need Singpass login.`
          : `${label} fields need Corppass login.`,
      )
    }
    if (field.myInfo && field.corppass) {
      errors.push(`${label} fields can't also be MyInfo fields.`)
    }
  }
  return errors
}
