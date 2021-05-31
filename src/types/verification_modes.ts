import { identity } from 'lodash'
import { err, ok, Result } from 'neverthrow'
import { BaseOf, Brand, make } from 'ts-brand'
import isEmail from 'validator/lib/isEmail'

import { ApplicationError } from 'src/app/modules/core/core.errors'
import { InvalidMailAddressError } from 'src/app/services/mail/mail.errors'
import { InvalidNumberError } from 'src/app/services/sms/sms.errors'
import { isPhoneNumber } from 'src/shared/util/phone-num-validation'

type UnknownBrand = Brand<unknown, unknown>

// Generic function whose concrete types get inferred by compiler
const _assert = <T extends UnknownBrand>(
  possibleBrand: unknown,
): possibleBrand is T => {
  // NOTE: Not using !!possibleBrand because potential future uses might allow potentially empty values (0 or '')
  // Instead, aim to prevent run-time errors
  return (
    possibleBrand !== null &&
    possibleBrand !== undefined &&
    (possibleBrand as T).__witness__ !== undefined
  )
}

type CompanionObjectOf<B extends UnknownBrand, E extends ApplicationError> = {
  parse: (s: string) => Result<B, E>
  extract: (b: B) => BaseOf<B>
  // Assert is a typeguard; extract is meant for users to chain
  assert: (t: unknown) => t is B
}

export type Email = Brand<string, 'email'>

type EmailCompanionObject = CompanionObjectOf<Email, InvalidMailAddressError>

const mkEmail = make<Email>()

// NOTE: Declarations are merged so ts infers the context as appropriate
export const Email: EmailCompanionObject = {
  parse: (s: string) => {
    return isEmail(s) ? ok(mkEmail(s)) : err(new Error())
  },

  extract: identity,
  assert: _assert,
}

export type PhoneNumber = Brand<string, 'phoneNumber'>

type PhoneCompanionObject = CompanionObjectOf<PhoneNumber, InvalidNumberError>

const mkPhoneNumber = make<PhoneNumber>()

// NOTE: Declarations are merged so ts infers the context as appropriate
export const PhoneNumber: PhoneCompanionObject = {
  parse: (s: string) => {
    return isPhoneNumber(s)
      ? ok(mkPhoneNumber(s))
      : err(new InvalidNumberError())
  },

  extract: identity,
  assert: _assert,
}
