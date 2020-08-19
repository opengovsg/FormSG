import HttpStatus from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { VfnErrors } from '../../../shared/util/verification'

import * as verificationService from './verification.service'

const logger = createLoggerWithLabel('verification')
/**
 * When a form is loaded publicly, a transaction is created, and populated with the field ids of fields that are verifiable.
 * If no fields are verifiable, then it did not create a transaction and returns an empty object.
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @returns 201 - transaction is created
 * @returns 200 - transaction was not created as no fields were verifiable for the form
 */
export const createTransaction = async (req, res) => {
  try {
    const { formId } = req.body
    const transaction = await verificationService.createTransaction(formId)
    return transaction
      ? res.status(HttpStatus.CREATED).json(transaction)
      : res.sendStatus(HttpStatus.OK)
  } catch (error) {
    logger.error(`createTransaction: ${error}`)
    return handleError(error, res)
  }
}
/**
 * Returns a transaction's id and expiry time if it exists
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
export const getTransactionMetadata = async (req, res) => {
  try {
    const { transactionId } = req.params
    const transaction = await verificationService.getTransactionMetadata(
      transactionId,
    )
    return res.status(HttpStatus.OK).json(transaction)
  } catch (error) {
    logger.error(`getTransaction: ${error}`)
    return handleError(error, res)
  }
}
/**
 *  When user changes the input value in the verifiable field,
 *  we reset the field in the transaction, removing the previously saved signature.
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
export const resetFieldInTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params
    const { fieldId } = req.body
    const transaction = await verificationService.getTransaction(transactionId)
    await verificationService.resetFieldInTransaction(transaction, fieldId)
    return res.sendStatus(HttpStatus.OK)
  } catch (error) {
    logger.error(`resetFieldInTransaction: ${error}`)
    return handleError(error, res)
  }
}
/**
 * When user requests to verify a field, an otp is generated.
 * The current answer is signed, and the signature is also saved in the transaction, with the field id as the key.
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
export const getNewOtp = async (req, res) => {
  try {
    const { transactionId } = req.params
    const { answer, fieldId } = req.body
    const transaction = await verificationService.getTransaction(transactionId)
    await verificationService.getNewOtp(transaction, fieldId, answer)
    return res.sendStatus(HttpStatus.CREATED)
  } catch (error) {
    logger.error(`getNewOtp: ${error}`)
    return handleError(error, res)
  }
}
/**
 * When user submits their otp for the field, the otp is validated.
 * If it is correct, we return the signature that was saved.
 * This signature will be appended to the response when the form is submitted.
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
export const verifyOtp = async (req, res) => {
  try {
    const { transactionId } = req.params
    const { fieldId, otp } = req.body
    const transaction = await verificationService.getTransaction(transactionId)
    const data = await verificationService.verifyOtp(transaction, fieldId, otp)
    return res.status(HttpStatus.OK).json(data)
  } catch (error) {
    logger.error(`verifyOtp: ${error}`)
    return handleError(error, res)
  }
}
/**
 * Returns relevant http status code for different verification failures
 * @param {Error} error
 * @param {Express.Response} res
 */
const handleError = (error, res) => {
  let status = HttpStatus.INTERNAL_SERVER_ERROR
  let message = error.message
  switch (error.name) {
    case VfnErrors.SendOtpFailed:
      status = HttpStatus.BAD_REQUEST
      break
    case VfnErrors.WaitForOtp:
      status = HttpStatus.ACCEPTED
      break
    case VfnErrors.ResendOtp:
    case VfnErrors.InvalidOtp:
      status = HttpStatus.UNPROCESSABLE_ENTITY
      break
    case VfnErrors.FieldNotFound:
    case VfnErrors.TransactionNotFound:
      status = HttpStatus.NOT_FOUND
      break
    default:
      message = 'An error occurred'
  }
  return res.status(status).json(message)
}
