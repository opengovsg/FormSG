const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const { otpGenerator } = require('../../config/config')
const MailService = require('./mail.service').default
const smsFactory = require('./../factories/sms.factory')
const vfnUtil = require('../../shared/util/verification')
const formsgSdk = require('../../config/formsg-sdk')

const getFormModel = require('../models/form.server.model').default
const getVerificationModel = require('../models/verification.server.model')
  .default

const Form = getFormModel(mongoose)
const Verification = getVerificationModel(mongoose)

const {
  VERIFIED_FIELDTYPES,
  SALT_ROUNDS,
  HASH_EXPIRE_AFTER_SECONDS,
  WAIT_FOR_OTP_SECONDS,
  NUM_OTP_RETRIES,
  VfnErrors,
} = vfnUtil

/**
 *  Creates a transaction for a form that has verifiable fields
 * @param {string} formId
 * @returns {object}
 */
const createTransaction = async (formId) => {
  const form = await Form.findById(formId)
  const fields = initializeVerifiableFields(form)
  if (!_.isEmpty(fields)) {
    const doc = await Verification.create({ formId, fields })
    return { transactionId: doc._id, expireAt: doc.expireAt }
  }
  return null
}

/**
 *  Retrieves a transaction's metadata by id
 * @param {string} transactionId
 * @returns {transaction._id}
 * @returns {transaction.formId}
 * @returns {transaction.expireAt}
 */
const getTransactionMetadata = async (transactionId) => {
  const transaction = await Verification.findTransactionMetadata(transactionId)
  if (transaction === null) {
    throwError(VfnErrors.TransactionNotFound)
  }
  return transaction
}

/**
 * Retrieves an entire transaction
 * @param {string} transactionId
 */
const getTransaction = async (transactionId) => {
  const transaction = await Verification.findById(transactionId)
  if (transaction === null) {
    throwError(VfnErrors.TransactionNotFound)
  }
  return transaction
}

/**
 *  Sets signedData, hashedOtp, hashCreatedAt to null for that field in that transaction
 *  @param {Mongoose.Document} transaction
 *  @param {string} fieldId
 */
const resetFieldInTransaction = async (transaction, fieldId) => {
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
 * @param {Mongoose.Document} transaction
 * @param {string} fieldId
 * @param {string} answer
 */
const getNewOtp = async (transaction, fieldId, answer) => {
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
 * @param {Mongoose.Document} transaction
 * @param {string} fieldId
 * @param {string} inputOtp
 */
const verifyOtp = async (transaction, fieldId, inputOtp) => {
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
 * @param {Mongoose.Document} form
 * @returns Array<object>
 */
const initializeVerifiableFields = (form) => {
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
 * Evaluates whether a field is verifiable
 * @param {object} field
 * @param {string} field.fieldType
 * @param {boolean} field.isVerifiable
 */
const isFieldVerifiable = (field) => {
  return (
    VERIFIED_FIELDTYPES.includes(field.fieldType) && field.isVerifiable === true
  )
}

/**
 * Send otp to recipient
 *
 * @param {string} formId
 * @param {object} field
 * @param {string} field.fieldType
 * @param {string} recipient
 * @param {string} otp
 */
const sendOTPForField = async (formId, field, recipient, otp) => {
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
 *  Checks if expireAt is in the past -- ie transaction has expired
 * @param {Date} expireAt
 * @returns boolean
 */
const isTransactionExpired = (expireAt) => {
  const currentDate = new Date()
  return expireAt < currentDate
}

/**
 *  Checks if HASH_EXPIRE_AFTER_SECONDS has elapsed since the hash was created - ie hash has expired
 * @param {Date} hashCreatedAt
 */
const isHashedOtpExpired = (hashCreatedAt) => {
  const currentDate = new Date()
  const expireAt = vfnUtil.getExpiryDate(
    HASH_EXPIRE_AFTER_SECONDS,
    hashCreatedAt,
  )
  return expireAt < currentDate
}

/**
 * Checks how many seconds remain before a new otp can be generated
 * @param {Date} hashCreatedAt
 * @returns {Number}
 */
const waitToResendOtpSeconds = (hashCreatedAt) => {
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
 * @param {Mongoose.Document} transaction
 * @param {string} fieldId
 * @returns verification field
 */
const getFieldFromTransaction = (transaction, fieldId) => {
  return transaction.fields.find((field) => field._id === fieldId)
}

/**
 *  Helper method to throw an error
 * @param {string} message
 * @param {string} name
 */
const throwError = (message, name) => {
  let error = new Error(message)
  error.name = name || message
  throw error
}

module.exports = {
  createTransaction,
  getTransactionMetadata,
  getTransaction,
  resetFieldInTransaction,
  getNewOtp,
  verifyOtp,
}
