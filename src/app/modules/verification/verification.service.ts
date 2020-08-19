import bcrypt from 'bcrypt'
import _ from 'lodash'
import mongoose from 'mongoose'

import { otpGenerator } from '../../../config/config'
import formsgSdk from '../../../config/formsg-sdk'
import * as vfnUtil from '../../../shared/util/verification'
import {
  IEmailFieldSchema,
  IFieldSchema,
  IFormSchema,
  IMobileFieldSchema,
  IVerificationFieldSchema,
  IVerificationSchema,
} from '../../../types'
import smsFactory from '../../factories/sms.factory'
import getFormModel from '../../models/form.server.model'
import getVerificationModel from '../../models/verification.server.model'
import MailService from '../../services/mail.service'

const Form = getFormModel(mongoose)
const Verification = getVerificationModel(mongoose)
const {
  HASH_EXPIRE_AFTER_SECONDS,
  NUM_OTP_RETRIES,
  SALT_ROUNDS,
  VERIFIED_FIELDTYPES,
  VfnErrors,
  WAIT_FOR_OTP_SECONDS,
} = vfnUtil

interface ITransaction {
  transactionId: IVerificationSchema['_id']
  expireAt: IVerificationSchema['expireAt']
}

/**
 *  Creates a transaction for a form that has verifiable fields
 * @param formId
 */
export const createTransaction = async (
  formId: string,
): Promise<ITransaction | null> => {
  const form = await Form.findById(formId)
  const fields = initializeVerifiableFields(form)
  if (!_.isEmpty(fields)) {
    const verification = new Verification({ formId, fields })
    const doc = await verification.save()
    return { transactionId: doc._id, expireAt: doc.expireAt }
  }
  return null
}

type TransactionMetadata = ReturnType<
  typeof Verification.findTransactionMetadata
>
/**
 *  Retrieves a transaction's metadata by id
 * @param transactionId
 */
export const getTransactionMetadata = async (
  transactionId: string,
): Promise<TransactionMetadata> => {
  const transaction = await Verification.findTransactionMetadata(transactionId)
  if (transaction === null) {
    throwError(VfnErrors.TransactionNotFound)
  }
  return transaction
}

/**
 * Retrieves an entire transaction
 * @param transactionId
 */
export const getTransaction = async (
  transactionId: string,
): Promise<IVerificationSchema> => {
  const transaction = await Verification.findById(transactionId)
  if (transaction === null) {
    throwError(VfnErrors.TransactionNotFound)
  }
  return transaction
}

/**
 *  Sets signedData, hashedOtp, hashCreatedAt to null for that field in that transaction
 *  @param transaction
 *  @param fieldId
 */
export const resetFieldInTransaction = async (
  transaction: IVerificationSchema,
  fieldId: string,
): Promise<void> => {
  const { _id: transactionId } = transaction
  const { n } = await Verification.updateOne(
    { _id: transactionId, 'fields._id': fieldId },
    {
      $set: {
        'fields.$.hashCreatedAt': null,
        'fields.$.hashedOtp': null,
        'fields.$.signedData': null,
        'fields.$.hashRetries': 0,
      },
    },
  )
  if (n === 0) {
    throwError('Field not found in transaction', VfnErrors.FieldNotFound)
  }
}

/**
 *  Generates hashed otp and signed data for the given transaction, fieldId, and answer
 * @param transaction
 * @param fieldId
 * @param answer
 */
export const getNewOtp = async (
  transaction: IVerificationSchema,
  fieldId: string,
  answer: string,
): Promise<void> => {
  if (isTransactionExpired(transaction.expireAt)) {
    throwError(VfnErrors.TransactionNotFound)
  }
  const field = getFieldFromTransaction(transaction, fieldId)
  if (field === undefined) {
    throwError('Field not found in transaction', VfnErrors.FieldNotFound)
  }
  const { _id: transactionId, formId } = transaction
  const waitForSeconds = waitToResendOtpSeconds(field.hashCreatedAt)
  if (waitForSeconds > 0) {
    throwError(
      `Wait for ${waitForSeconds} seconds before requesting for a new otp`,
      VfnErrors.WaitForOtp,
    )
  } else {
    const hashCreatedAt = new Date()
    const otp = otpGenerator()
    const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS)
    const signedData = formsgSdk.verification.generateSignature({
      transactionId,
      formId,
      fieldId,
      answer,
    })
    try {
      await sendOTPForField(formId, field, answer, otp)
    } catch (err) {
      throwError(err.message, VfnErrors.SendOtpFailed)
    }
    await Verification.updateOne(
      { _id: transactionId, 'fields._id': fieldId },
      {
        $set: {
          'fields.$.hashCreatedAt': hashCreatedAt,
          'fields.$.hashedOtp': hashedOtp,
          'fields.$.signedData': signedData,
          'fields.$.hashRetries': 0,
        },
      },
    )
  }
}

/**
 * Compares the given otp. If correct, returns signedData, else returns an error
 * @param transaction
 * @param fieldId
 * @param inputOtp
 */
export const verifyOtp = async (
  transaction: IVerificationSchema,
  fieldId: string,
  inputOtp: string,
): Promise<string> => {
  if (isTransactionExpired(transaction.expireAt)) {
    throwError(VfnErrors.TransactionNotFound)
  }
  const field = getFieldFromTransaction(transaction, fieldId)
  if (field === undefined) {
    throwError('Field not found in transaction', VfnErrors.FieldNotFound)
  }
  const { hashedOtp, hashCreatedAt, signedData, hashRetries } = field
  if (
    hashedOtp &&
    hashCreatedAt &&
    !isHashedOtpExpired(hashCreatedAt) &&
    hashRetries < NUM_OTP_RETRIES
  ) {
    await Verification.updateOne(
      { _id: transaction._id, 'fields._id': fieldId },
      {
        $set: {
          'fields.$.hashRetries': hashRetries + 1,
        },
      },
    )
    const validOtp = await bcrypt.compare(inputOtp, hashedOtp)
    return validOtp ? signedData : throwError(VfnErrors.InvalidOtp)
  }
  throwError(VfnErrors.ResendOtp)
}

/**
 * Gets verifiable fields from form and initializes the values to be stored in a transaction
 * @param form
 */
const initializeVerifiableFields = (
  form: IFormSchema,
): Pick<IFieldSchema, '_id' | 'fieldType'>[] => {
  return _.get(form, 'form_fields', [])
    .filter(isFieldVerifiable)
    .map(({ _id, fieldType }) => {
      return {
        _id,
        fieldType,
      }
    })
}

/**
 * Whether a field is of a type that can be verified.
 * @param field
 */
const isPossiblyVerifiable = (
  field: IFieldSchema,
): field is IEmailFieldSchema | IMobileFieldSchema => {
  return VERIFIED_FIELDTYPES.includes(field.fieldType)
}

/**
 * Evaluates whether a field is verifiable
 * @param field
 */
const isFieldVerifiable = (field: IFieldSchema): boolean => {
  return isPossiblyVerifiable(field) && field.isVerifiable === true
}

/**
 * Send otp to recipient
 *
 * @param formId
 * @param field
 * @param field.fieldType
 * @param recipient
 * @param otp
 */
const sendOTPForField = async (
  formId: string,
  field: IVerificationFieldSchema,
  recipient: string,
  otp: string,
): Promise<void> => {
  const { fieldType } = field
  switch (fieldType) {
    case 'mobile':
      // call sms - it should validate the recipient
      await smsFactory.sendVerificationOtp(recipient, otp, formId)
      break
    case 'email':
      // call email - it should validate the recipient
      await MailService.sendVerificationOtp(recipient, otp)
      break
    default:
      throw new Error(`sendOTPForField: ${fieldType} is unsupported`)
  }
}

/**
 * Checks if expireAt is in the past -- ie transaction has expired
 * @param expireAt
 * @returns boolean
 */
const isTransactionExpired = (expireAt: Date): boolean => {
  const currentDate = new Date()
  return expireAt < currentDate
}

/**
 * Checks if HASH_EXPIRE_AFTER_SECONDS has elapsed since the hash was created - ie hash has expired
 * @param hashCreatedAt
 */
const isHashedOtpExpired = (hashCreatedAt: Date): boolean => {
  const currentDate = new Date()
  const expireAt = vfnUtil.getExpiryDate(
    HASH_EXPIRE_AFTER_SECONDS,
    hashCreatedAt,
  )
  return expireAt < currentDate
}

/**
 * Checks how many seconds remain before a new otp can be generated
 * @param hashCreatedAt
 */
const waitToResendOtpSeconds = (hashCreatedAt: Date): number => {
  if (!hashCreatedAt) {
    // Hash has not been created
    return 0
  }
  const expireAtMs = vfnUtil
    .getExpiryDate(WAIT_FOR_OTP_SECONDS, hashCreatedAt)
    .getTime()
  const currentMs = Date.now()
  return Math.ceil((expireAtMs - currentMs) / 1000)
}

/**
 *  Finds a field by id in a transaction
 * @param transaction
 * @param fieldId
 * @returns verification field
 */
const getFieldFromTransaction = (
  transaction: IVerificationSchema,
  fieldId: string,
): IVerificationFieldSchema | undefined => {
  return transaction.fields.find((field) => field._id === fieldId)
}

/**
 * Helper method to throw an error
 * message
 * name
 */
const throwError = (message: string, name?: string): never => {
  let error = new Error(message)
  error.name = name || message
  throw error
}
