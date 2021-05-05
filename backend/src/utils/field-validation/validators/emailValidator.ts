import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import isEmail from 'validator/lib/isEmail'

import { ProcessedSingleAnswerResponse } from '@root/modules/submission/submission.types'
import { IEmailFieldSchema } from '@root/types/field'
import { ResponseValidator } from '@root/types/field/utils/validation'

import { makeSignatureValidator, notEmptySingleAnswerResponse } from './common'

type EmailValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type EmailValidatorConstructor = (
  emailField: IEmailFieldSchema,
) => EmailValidator

/**
 * Returns a validator to check if email format is correct.
 */
const emailFormatValidator: EmailValidator = (response) => {
  const { answer } = response
  return isEmail(answer)
    ? right(response)
    : left(`EmailValidator:\t answer is not a valid email`)
}

/**
 * Returns a validation function
 * to check if email domain is valid.
 */
const makeEmailDomainValidator: EmailValidatorConstructor = (emailField) => (
  response,
) => {
  const {
    isVerifiable,
    hasAllowedEmailDomains,
    allowedEmailDomains,
  } = emailField
  const { answer } = response
  const emailAddress = String(answer)
  if (!(isVerifiable && hasAllowedEmailDomains && allowedEmailDomains.length))
    return right(response)
  const emailDomain = '@' + emailAddress.split('@').pop()

  return allowedEmailDomains.includes(emailDomain)
    ? right(response)
    : left(`EmailValidator:\t answer is not a valid email domain`)
}

/**
 * Returns a validation function for a email field when called.
 */
export const constructEmailValidator: EmailValidatorConstructor = (
  emailField,
) =>
  flow(
    notEmptySingleAnswerResponse,
    chain(emailFormatValidator),
    chain(makeSignatureValidator(emailField)),
    chain(makeEmailDomainValidator(emailField)),
  )
