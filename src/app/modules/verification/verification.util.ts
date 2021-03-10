import {
  HASH_EXPIRE_AFTER_SECONDS,
  VERIFIED_FIELDTYPES,
  WAIT_FOR_OTP_SECONDS,
} from '../../../shared/util/verification'
import { IFieldSchema, IVerificationSchema } from '../../../types'

/**
 * Evaluates whether a field is verifiable
 * @param field
 */
const isFieldVerifiable = (field: IFieldSchema): boolean => {
  return (
    VERIFIED_FIELDTYPES.includes(field.fieldType) && field.isVerifiable === true
  )
}

/**
 * Gets verifiable fields from form and initializes the values to be stored in a transaction
 * @param form
 */
export const extractTransactionFields = (
  formFields: IFieldSchema[],
): Pick<IFieldSchema, '_id' | 'fieldType'>[] => {
  return formFields.filter(isFieldVerifiable).map(({ _id, fieldType }) => ({
    _id,
    fieldType,
  }))
}

export const getExpiryDate = (
  expireAfterSeconds: number,
  fromDate?: Date,
): Date => {
  const expireAt = fromDate ? new Date(fromDate) : new Date()
  expireAt.setTime(expireAt.getTime() + expireAfterSeconds * 1000)
  return expireAt
}

/**
 * Checks if expireAt is in the past -- ie transaction has expired
 * @param expireAt
 * @returns boolean
 */
export const isTransactionExpired = (
  transaction: IVerificationSchema,
): boolean => {
  const currentDate = new Date()
  return transaction.expireAt < currentDate
}

/**
 * Checks if HASH_EXPIRE_AFTER_SECONDS has elapsed since the field's hash was created - ie hash has expired
 * @param hashCreatedAt
 */
export const isOtpExpired = (hashCreatedAt: Date): boolean => {
  const currentDate = new Date()
  const expireAt = getExpiryDate(HASH_EXPIRE_AFTER_SECONDS, hashCreatedAt)
  return expireAt < currentDate
}

export const isOtpWaitTimeElapsed = (hashCreatedAt: Date | null): boolean => {
  // No hash created yet, so no wait time
  if (!hashCreatedAt) return true

  const expireAtMs = getExpiryDate(
    WAIT_FOR_OTP_SECONDS,
    hashCreatedAt,
  ).getTime()
  const currentMs = Date.now()
  return Math.ceil((expireAtMs - currentMs) / 1000) > 0
}
