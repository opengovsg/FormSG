import { err, ok, Result } from 'neverthrow'

import {
  BasicField,
  FormAuthType,
  NricResponse,
} from '../../../../shared/types'
import { hasProp } from '../../../../shared/utils/has-prop'
import { IFormSchema, SgidFieldTitle } from '../../../types'
import { AuthTypeMismatchError } from '../form/form.errors'
import { ProcessedSingleAnswerResponse } from '../submission/submission.types'

import {
  SgidForm,
  SGIDJwtAccessPayload,
  SGIDJwtSingpassPayload,
} from './sgid.types'

/**
 * Validates that a form is an sgID form
 * @param form Form to validate
 */
export const validateSgidForm = <T extends IFormSchema>(
  form: T,
): Result<SgidForm<T>, AuthTypeMismatchError> => {
  return isSgidForm(form)
    ? ok(form)
    : err(new AuthTypeMismatchError(FormAuthType.SGID, form.authType))
}

// Typeguard to ensure that form has the correct authType
const isSgidForm = <F extends IFormSchema>(form: F): form is SgidForm<F> => {
  return (
    form.authType === FormAuthType.SGID ||
    form.authType === FormAuthType.SGID_MyInfo
  )
}

/**
 * Wraps sgID data in the form of parsed form fields.
 * @param uinFin the UIN/FIN number given
 */
export const createSgidParsedResponses = (
  uinFin: string,
): ProcessedSingleAnswerResponse<NricResponse>[] => {
  return [
    {
      _id: '',
      question: SgidFieldTitle.SgidNric,
      fieldType: BasicField.Nric,
      isVisible: true,
      answer: uinFin,
    },
  ]
}

/**
 * Typeguard for SingPass JWT payload.
 * @param payload Payload decrypted from JWT
 */
export const isSgidJwtSingpassPayload = (
  payload: unknown,
): payload is SGIDJwtSingpassPayload => {
  return (
    typeof payload === 'object' &&
    !!payload &&
    hasProp(payload, 'userName') &&
    typeof payload.userName === 'string'
  )
}

/**
 * Typeguard for SGID JWT access token payload.
 * @param payload Payload decrypted from JWT
 */
export const isSgidJwtAccessPayload = (
  payload: unknown,
): payload is SGIDJwtAccessPayload => {
  return (
    typeof payload === 'object' &&
    !!payload &&
    hasProp(payload, 'accessToken') &&
    typeof payload.accessToken === 'string'
  )
}
