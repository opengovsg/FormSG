import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import validator from 'validator'

import getTokenModel from 'src/app/models/token.server.model'

import config, { otpGenerator } from '../../../config/config'
import getAgencyModel from '../../models/agency.server.model'

import { InvalidDomainError } from './auth.errors'

const TokenModel = getTokenModel(mongoose)
const AgencyModel = getAgencyModel(mongoose)

const DEFAULT_SALT_ROUNDS = 10

/**
 * Validates the domain of the given email. A domain is valid if it exists in
 * the Agency collection in the database.
 * @param email the email to validate the domain for
 * @returns true only if the domain of the email is valid.
 * @throws error if database query fails or if agency cannot be found.
 */
export const validateDomain = async (email: string) => {
  // Extra guard even if Joi validation has already checked.
  if (!validator.isEmail(email)) {
    throw new InvalidDomainError()
  }

  const emailDomain = email.split('@').pop()
  const agency = await AgencyModel.findOne({ emailDomain })
  if (!agency) {
    throw new InvalidDomainError()
  }

  return true
}

export const createLoginOtp = async (email: string) => {
  if (!validator.isEmail(email)) {
    throw new InvalidDomainError()
  }

  const otp = otpGenerator()
  const hashedOtp = await bcrypt.hash(otp, DEFAULT_SALT_ROUNDS)

  await TokenModel.upsertOtp({
    email,
    hashedOtp,
    expireAt: new Date(Date.now() + config.otpLifeSpan),
  })

  return otp
}
