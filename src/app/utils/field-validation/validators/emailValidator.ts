import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import { BasicField, EmailResponseV3 } from 'shared/types'
import isEmail from 'validator/lib/isEmail'

import { ParsedClearFormFieldResponseV3 } from 'src/types/api'

import {
  IEmailFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { ProcessedSingleAnswerResponse } from '../../../modules/submission/submission.types'

import {
  makeSignatureValidator,
  makeSignatureValidatorV3,
  notEmptySingleAnswerResponse,
  notEmptyVerifiableAnswerResponseV3,
} from './common'

type EmailValidator = ResponseValidator<ProcessedSingleAnswerResponse>
type EmailValidatorConstructor = (
  emailField: OmitUnusedValidatorProps<IEmailFieldSchema>,
) => EmailValidator

/**
 * Returns a validator to check if email format is correct.
 */
const emailFormatValidator: EmailValidator = (response) => {
  const { answer } = response
  return isEmail(answer.trim())
    ? right(response)
    : left(`EmailValidator:\t answer is not a valid email`)
}

/**
 * Returns a validation function
 * to check if email domain is valid.
 */
const makeEmailDomainValidator: EmailValidatorConstructor =
  (emailField) => (response) => {
    const { hasAllowedEmailDomains, allowedEmailDomains } = emailField
    const { answer } = response
    const emailAddress = String(answer).trim()
    if (!(hasAllowedEmailDomains && allowedEmailDomains.length))
      return right(response)
    const emailDomain = ('@' + emailAddress.split('@').pop()).toLowerCase()

    return allowedEmailDomains.some(
      (domain) => domain.toLowerCase() === emailDomain,
    )
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

const isEmailFieldTypeV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  EmailResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Email) {
    return left(`EmailValidatorV3.fieldTypeMismatch:\tfield type is not email`)
  }
  return right(response)
}

/**
 * Returns a validator to check if email format is correct.
 */
const emailFormatValidatorV3: ResponseValidator<EmailResponseV3> = (
  response,
) => {
  const { value } = response.answer
  return isEmail(value.trim())
    ? right(response)
    : left(`EmailValidatorV3:\t answer value is not a valid email`)
}

/**
 * Returns a validation function
 * to check if email domain is valid.
 */
const makeEmailDomainValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IEmailFieldSchema>,
  EmailResponseV3
> = (emailField) => (response) => {
  const { hasAllowedEmailDomains, allowedEmailDomains } = emailField
  const { value } = response.answer
  const emailAddress = String(value).trim()
  if (!(hasAllowedEmailDomains && allowedEmailDomains.length))
    return right(response)
  const emailDomain = ('@' + emailAddress.split('@').pop()).toLowerCase()

  return allowedEmailDomains.some(
    (domain) => domain.toLowerCase() === emailDomain,
  )
    ? right(response)
    : left(`EmailValidatorV3:\t answer value is not a valid email domain`)
}

export const constructEmailValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IEmailFieldSchema>,
  ParsedClearFormFieldResponseV3,
  EmailResponseV3
> = (formField) =>
  flow(
    isEmailFieldTypeV3,
    chain(notEmptyVerifiableAnswerResponseV3),
    chain(emailFormatValidatorV3),
    chain(makeSignatureValidatorV3(formField)),
    chain(makeEmailDomainValidatorV3(formField)),
  )
