import type { FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import { BasicField, FieldResponsesV3, FormAuthType } from 'formsg-shared/types'
import { hasProp } from 'formsg-shared/utils/has-prop'
import {
  mapVerifiedKeyToSPCPTitle,
  VerifiedKeys,
} from 'formsg-shared/utils/verified-content'
import { err, ok, Result } from 'neverthrow'

import { IFormSchema, SPCPFieldTitle } from '../../../types'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'
import { createLoggerWithLabel } from '../../config/logger'
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
} from './spcp.types'

const logger = createLoggerWithLabel(module)

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

export const createNdiResponsesV3FromRecord = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ndiResponses: Record<string, any>,
): FieldResponsesV3 => {
  const responses: FieldResponsesV3 = {}

  Object.entries(ndiResponses).forEach(([key, value]) => {
    const title = mapVerifiedKeyToSPCPTitle(key)

    if (key.startsWith(VerifiedKeys.SpUinFin)) {
      responses[title] = {
        fieldType: BasicField.Nric,
        answer: value as string,
      }
    } else if (key.startsWith(VerifiedKeys.CpUen)) {
      responses[title] = {
        fieldType: BasicField.ShortText,
        answer: value as string,
      }
    } else if (key.startsWith(VerifiedKeys.CpUid)) {
      responses[title] = {
        fieldType: BasicField.Nric,
        answer: value as string,
      }
    }
  })

  return responses
}

export const createNdiResponsesV4FromRecord = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ndiResponses: Record<string, any>,
): FieldResponsesV4 => {
  const responses: FieldResponsesV4 = {}
  const provenance = {}

  Object.entries(ndiResponses).forEach(([key, value]) => {
    const title = mapVerifiedKeyToSPCPTitle(key)

    if (key.startsWith(VerifiedKeys.SpUinFin)) {
      responses[title] = {
        fieldType: BasicField.Nric,
        answer: { value: value as string },
        question: title,
        provenance,
      }
    } else if (key.startsWith(VerifiedKeys.CpUen)) {
      responses[title] = {
        fieldType: BasicField.ShortText,
        answer: { value: value as string },
        question: title,
        provenance,
      }
    } else if (key.startsWith(VerifiedKeys.CpUid)) {
      responses[title] = {
        fieldType: BasicField.Nric,
        answer: { value: value as string },
        question: title,
        provenance,
      }
    }
  })

  return responses
}

export const isSPCPFieldTitle = (key: string): key is SPCPFieldTitle =>
  Object.values(SPCPFieldTitle).includes(key as SPCPFieldTitle)

export const startsWithSPCPFieldTitle = (key: string): boolean =>
  Object.values(SPCPFieldTitle).some((title) => key.startsWith(title))

/**
 * The Corppass e-service ID to log in with: FormSG's when the flag is on.
 * Falls back to the form's own ID if FormSG's is not configured, so
 * environments without it keep working.
 */
export const getCpLoginEsrvcId = (
  form: { _id?: unknown; esrvcId?: string },
  useFormsgEsrvcId: boolean,
): string | undefined => {
  if (!useFormsgEsrvcId) return form.esrvcId
  if (spcpMyInfoConfig.cpFormsgEsrvcId) return spcpMyInfoConfig.cpFormsgEsrvcId
  logger.error({
    message:
      'Corppass FormSG e-service ID flag is on but CP_FORMSG_ESRVC_ID is not set, falling back to the form e-service ID',
    meta: { action: 'getCpLoginEsrvcId', formId: String(form._id) },
  })
  return form.esrvcId
}

/**
 * Validates that a form is a SPCP form with an e-service ID to log in with
 * @param form Form to validate
 * @param useFormsgEsrvcId whether Corppass logs in with FormSG's e-service ID
 * @returns the e-service ID to log in with
 */
export const validateSpcpForm = (
  form: IFormSchema,
  useFormsgEsrvcId = false,
): Result<string, FormAuthNoEsrvcIdError | AuthTypeMismatchError> => {
  const esrvcId =
    form.authType === FormAuthType.CP
      ? getCpLoginEsrvcId(form, useFormsgEsrvcId)
      : form.esrvcId
  // This is an extra check to return the specific error encountered
  if (!esrvcId) {
    return err(new FormAuthNoEsrvcIdError(form.id))
  }
  if (form.authType === FormAuthType.SP || form.authType === FormAuthType.CP) {
    return ok(esrvcId)
  }
  return err(new AuthTypeMismatchError(FormAuthType.CP, form.authType))
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
