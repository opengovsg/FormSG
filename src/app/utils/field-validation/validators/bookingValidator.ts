import { right } from 'fp-ts/lib/Either'

import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

type BookingValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type BookingValidatorConstructor = () => BookingValidator

/**
 * Returns a validation function for a yesNo field when called.
 */
export const constructBookingValidator: BookingValidatorConstructor = () =>
  right
