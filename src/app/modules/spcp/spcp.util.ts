import { err, ok, Result } from 'neverthrow'

import { BasicField, FormAuthType } from '../../../../shared/types'
import { hasProp } from '../../../../shared/utils/has-prop'
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
 * @returns
 */
export const getRedirectTargetSpcpOidc = (
  formId: string,
  authType: FormAuthType.SP | FormAuthType.CP,
  isPersistentLogin?: boolean,
  encodedQuery?: string,
): RedirectTargetSpcpOidc => {
  // Need to cast to boolean because undefined is allowed as a valid value
  const persistentLogin =
    authType === FormAuthType.SP ? !!isPersistentLogin : false
  return encodedQuery
    ? `/${formId}-${persistentLogin}-${encodedQuery}`
    : `/${formId}-${persistentLogin}`
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
