import type { FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import {
  BasicField,
  FieldResponsesV3,
  FormAuthType,
  NdiResponseV3,
} from 'formsg-shared/types'
import { hasProp } from 'formsg-shared/utils/has-prop'
import {
  getVerifiedFieldTitle,
  parseVerifiedKey,
  VerifiedKeys,
} from 'formsg-shared/utils/verified-content'
import { err, ok, Result } from 'neverthrow'

import { IFormSchema, SPCPFieldTitle } from '../../../types'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
} from '../form/form.errors'
import { ProcessedSingleAnswerResponse } from '../submission/submission.types'

import {
  CorppassJwtPayloadFromCookie,
  ExtractedCorppassNDIPayload,
  RedirectTargetSpcpOidc,
  SingpassJwtPayloadFromCookie,
  SpcpForm,
} from './spcp.types'

// Matches the MongoDB ObjectID hex format exactly (24 hex characters)
const DESTINATION_REGEX = /^\/([a-fA-F0-9]{24})\/?$/

/**
 * Extracts the form ID from a redirect destination
 * @param destination Redirect destination
 */
export const extractFormId = (destination: string): string | null => {
  const regexSplit = destination.match(DESTINATION_REGEX)
  if (!regexSplit || regexSplit.length < 2) {
    return null
  }
  return regexSplit[1]
}

/**
 * Typeguard for SingPass JWT payload.
 * @param payload Payload decrypted from JWT
 */
export const isSingpassJwtPayload = (
  payload: unknown,
): payload is SingpassJwtPayloadFromCookie => {
  return (
    typeof payload === 'object' &&
    !!payload &&
    hasProp(payload, 'userName') &&
    typeof payload.userName === 'string'
  )
}

/**
 * Typeguard for Corppass JWT payload.
 * @param payload Payload decrypted from JWT
 */
export const isCorppassJwtPayload = (
  payload: unknown,
): payload is CorppassJwtPayloadFromCookie => {
  return (
    typeof payload === 'object' &&
    !!payload &&
    hasProp(payload, 'userName') &&
    typeof payload.userName === 'string' &&
    hasProp(payload, 'userInfo') &&
    typeof payload.userInfo === 'string'
  )
}

/**
 * Wraps SingPass data in the form of parsed form fields.
 * @param uinFin UIN or FIN
 */
export const createSingpassParsedResponses = (
  uinFin: string,
): ProcessedSingleAnswerResponse[] => {
  return [
    {
      _id: '',
      question: SPCPFieldTitle.SpNric,
      fieldType: BasicField.Nric,
      isVisible: true,
      answer: uinFin,
    },
  ]
}

/**
 * Wraps CorpPass data in the form of parsed form fields.
 * @param uinFin CorpPass UEN
 * @param userInfo CorpPass UID
 */
export const createCorppassParsedResponses = (
  uinFin: string,
  userInfo: string,
): ProcessedSingleAnswerResponse[] => {
  return [
    {
      _id: '',
      question: SPCPFieldTitle.CpUen,
      fieldType: BasicField.ShortText,
      isVisible: true,
      answer: uinFin,
    },
    {
      _id: '',
      question: SPCPFieldTitle.CpUid,
      fieldType: BasicField.Nric,
      isVisible: true,
      answer: userInfo,
    },
  ]
}

// sgID keys are not NDI responses and are skipped.
const NDI_FIELD_TYPES: Partial<
  Record<VerifiedKeys, NdiResponseV3['fieldType']>
> = {
  [VerifiedKeys.SpUinFin]: BasicField.Nric,
  [VerifiedKeys.CpUen]: BasicField.ShortText,
  [VerifiedKeys.CpUid]: BasicField.Nric,
}

/**
 * Iterates NDI verified entries with their output title and field type.
 * Titles keep ` (Step N)` for N > 1 so different steps do not overwrite each other.
 */
const forEachNdiEntry = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ndiResponses: Record<string, any>,
  callback: (
    title: string,
    fieldType: NdiResponseV3['fieldType'],
    value: string,
  ) => void,
): void => {
  Object.entries(ndiResponses).forEach(([key, value]) => {
    const parsed = parseVerifiedKey(key)
    const fieldType = parsed && NDI_FIELD_TYPES[parsed.baseKey]
    if (!parsed || !fieldType) return
    callback(getVerifiedFieldTitle(parsed), fieldType, value as string)
  })
}

export const createNdiResponsesV3FromRecord = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ndiResponses: Record<string, any>,
): FieldResponsesV3 => {
  const responses: FieldResponsesV3 = {}

  forEachNdiEntry(ndiResponses, (title, fieldType, value) => {
    responses[title] = { fieldType, answer: value }
  })

  return responses
}

export const createNdiResponsesV4FromRecord = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ndiResponses: Record<string, any>,
): FieldResponsesV4 => {
  const responses: FieldResponsesV4 = {}
  const provenance = {}

  forEachNdiEntry(ndiResponses, (title, fieldType, value) => {
    responses[title] = {
      fieldType,
      answer: { value },
      question: title,
      provenance,
    }
  })

  return responses
}

export const isSPCPFieldTitle = (key: string): key is SPCPFieldTitle =>
  Object.values(SPCPFieldTitle).includes(key as SPCPFieldTitle)

export const startsWithSPCPFieldTitle = (key: string): boolean =>
  Object.values(SPCPFieldTitle).some((title) => key.startsWith(title))

/**
 * Validates that a form is a SPCP form with an e-service ID
 * @param form Form to validate
 */
export const validateSpcpForm = <T extends IFormSchema>(
  form: T,
): Result<SpcpForm<T>, FormAuthNoEsrvcIdError | AuthTypeMismatchError> => {
  // This is an extra check to return the specific error encountered
  if (!form.esrvcId) {
    return err(new FormAuthNoEsrvcIdError(form.id))
  }
  if (isSpcpForm(form)) {
    return ok(form)
  }
  return err(new AuthTypeMismatchError(FormAuthType.CP, form.authType))
}

// Typeguard to ensure that form has eserviceId and correct authType
const isSpcpForm = <F extends IFormSchema>(form: F): form is SpcpForm<F> => {
  return (
    !!form.authType &&
    [FormAuthType.SP, FormAuthType.CP].includes(form.authType) &&
    !!form.esrvcId
  )
}

/**
 * Generates the redirect target for the form
 * Differs from SAML implementation in using hyphen separation because NDI OIDC does not allow comma in state
 * @param formId
 * @param isPersistentLogin
 * @param encodedQuery
 * @param nonce per-login-attempt nonce used to scope the PKCE code_verifier
 * cookie to this login. Omitted when the spcpOidcStateNonce flag is off, which
 * emits the legacy state format.
 * @returns
 */
export const getRedirectTargetSpcpOidc = (
  formId: string,
  authType: FormAuthType.SP | FormAuthType.CP,
  isPersistentLogin?: boolean,
  encodedQuery?: string,
  nonce?: string,
): RedirectTargetSpcpOidc => {
  // Need to cast to boolean because undefined is allowed as a valid value
  const persistentLogin =
    authType === FormAuthType.SP ? !!isPersistentLogin : false
  // TODO [CP-PKCE]: drop the legacy branch once the spcpOidcStateNonce flag is
  // permanently on and no legacy state can still be in flight.
  if (!nonce) {
    return encodedQuery
      ? `/${formId}-${persistentLogin}-${encodedQuery}`
      : `/${formId}-${persistentLogin}`
  }
  // RATIONALE: The encodedQuery segment is always emitted so that a nonce state always has
  // exactly 4 segments, which no legacy state can have.
  return `/${formId}-${persistentLogin}-${nonce}-${encodedQuery ?? ''}`
}

// Typeguards

export const isExtractedCorppassNDIPayload = (
  payload: unknown,
): payload is ExtractedCorppassNDIPayload => {
  return (
    typeof payload === 'object' &&
    !!payload &&
    hasProp(payload, 'userInfo') &&
    hasProp(payload, 'userName') &&
    typeof payload.userInfo === 'string' &&
    typeof payload.userName === 'string'
  )
}
