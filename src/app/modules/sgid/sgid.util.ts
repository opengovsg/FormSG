import { err, ok, Result } from 'neverthrow'

import { hasProp } from '../../../shared/util/has-prop'
import {
  AuthType,
  BasicField,
  IFormSchema,
  SgidFieldTitle,
} from '../../../types'
import { AuthTypeMismatchError } from '../form/form.errors'
import { ProcessedSingleAnswerResponse } from '../submission/submission.types'

import { SgidForm } from './sgid.types'

/**
 * Validates that a form is an sgID form
 * @param form Form to validate
 */
export const validateSgidForm = <T extends IFormSchema>(
  form: T,
): Result<SgidForm<T>, AuthTypeMismatchError> => {
  return isSgidForm(form)
    ? ok(form)
    : err(new AuthTypeMismatchError(AuthType.SGID, form.authType))
}

// Typeguard to ensure that form has the correct authType
const isSgidForm = <F extends IFormSchema>(form: F): form is SgidForm<F> => {
  return form.authType === AuthType.SGID
}

/**
 * Wraps sgID data in the form of parsed form fields.
 * @param uinFin the UIN/FIN number given
 */
export const createSgidParsedResponses = (
  uinFin: string,
): ProcessedSingleAnswerResponse[] => {
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
export const isSgidJwtPayload = (
  payload: unknown,
): payload is { userName: string } => {
  return (
    typeof payload === 'object' &&
    !!payload &&
    hasProp(payload, 'userName') &&
    typeof payload.userName === 'string'
  )
}
