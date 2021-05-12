import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { SALT_ROUNDS } from '../../../shared/util/verification'
import { ErrorDto } from '../../../types/api'
import { createLoggerWithLabel } from '../../config/logger'
import { generateOtpWithHash } from '../../utils/otp'
import { createReqMeta } from '../../utils/request'

import { VerificationFactory } from './verification.factory'
import { Transaction } from './verification.types'
import { mapRouteError } from './verification.util'

const logger = createLoggerWithLabel(module)

/**
 * NOTE: Private handler for POST /transaction
 * When a form is loaded publicly, a transaction is created, and populated with the field ids of fields that are verifiable.
 * If no fields are verifiable, then it did not create a transaction and returns an empty object.
 * @param req
 * @param res
 * @returns 201 - transaction is created
 * @returns 200 - transaction was not created as no fields were verifiable for the form
 */
export const handleCreateTransaction: RequestHandler<
  never,
  Transaction | ErrorDto,
  { formId: string }
> = async (req, res) => {
  const { formId } = req.body
  const logMeta = {
    action: 'handleCreateTransaction',
    formId,
    ...createReqMeta(req),
  }
  return VerificationFactory.createTransaction(formId)
    .map((transaction) => {
      return transaction
        ? res.status(StatusCodes.CREATED).json({
            expireAt: transaction.expireAt,
            transactionId: transaction._id,
          })
        : res.status(StatusCodes.OK).json({})
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error creating transaction',
        meta: logMeta,
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * NOTE: Private handler for POST /forms/:formId/fieldverifications
 * When a form is loaded publicly, a transaction is created, and populated with the field ids of fields that are verifiable.
 * If no fields are verifiable, then it did not create a transaction and returns an empty object.
 * @param req
 * @param res
 * @returns 201 - transaction is created
 * @returns 200 - transaction was not created as no fields were verifiable for the form
 */
export const handleCreateVerificationTransaction: RequestHandler<
  { formId: string },
  Transaction | ErrorDto
> = async (req, res) => {
  const { formId } = req.params
  const logMeta = {
    action: 'handleCreateVerificationTransaction',
    formId,
    ...createReqMeta(req),
  }
  return VerificationFactory.createTransaction(formId)
    .map((transaction) => {
      return transaction
        ? res.status(StatusCodes.CREATED).json({
            expireAt: transaction.expireAt,
            transactionId: transaction._id,
          })
        : res.status(StatusCodes.OK).json({})
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error creating transaction',
        meta: logMeta,
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 *  When user changes the input value in the verifiable field,
 *  we reset the field in the transaction, removing the previously saved signature.
 * @param req
 * @param res
 */
export const handleResetField: RequestHandler<
  { transactionId: string },
  ErrorDto,
  { fieldId: string }
> = async (req, res) => {
  const { transactionId } = req.params
  const { fieldId } = req.body
  const logMeta = {
    action: 'handleResetField',
    transactionId,
    fieldId,
    ...createReqMeta(req),
  }
  return VerificationFactory.resetFieldForTransaction(transactionId, fieldId)
    .map(() => res.sendStatus(StatusCodes.OK))
    .mapErr((error) => {
      logger.error({
        message: 'Error resetting field in transaction',
        meta: logMeta,
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * When user requests to verify a field, an otp is generated.
 * The current answer is signed, and the signature is also saved in the transaction, with the field id as the key.
 * @param req
 * @param res
 */
export const handleGetOtp: RequestHandler<
  { transactionId: string },
  ErrorDto,
  { answer: string; fieldId: string }
> = async (req, res) => {
  const { transactionId } = req.params
  const { answer, fieldId } = req.body
  const logMeta = {
    action: 'handleGetOtp',
    transactionId,
    fieldId,
    ...createReqMeta(req),
  }
  return generateOtpWithHash(logMeta, SALT_ROUNDS)
    .andThen(({ otp, hashedOtp }) =>
      VerificationFactory.sendNewOtp({
        fieldId,
        hashedOtp,
        otp,
        recipient: answer,
        transactionId,
      }),
    )
    .map(() => res.sendStatus(StatusCodes.CREATED))
    .mapErr((error) => {
      logger.error({
        message: 'Error creating new OTP',
        meta: logMeta,
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * When user submits their otp for the field, the otp is validated.
 * If it is correct, we return the signature that was saved.
 * This signature will be appended to the response when the form is submitted.
 * @param req
 * @param res
 */
export const handleVerifyOtp: RequestHandler<
  { transactionId: string },
  string | ErrorDto,
  { otp: string; fieldId: string }
> = async (req, res) => {
  const { transactionId } = req.params
  const { fieldId, otp } = req.body
  const logMeta = {
    action: 'handleVerifyOtp',
    transactionId,
    fieldId,
    ...createReqMeta(req),
  }
  return VerificationFactory.verifyOtp(transactionId, fieldId, otp)
    .map((signedData) => res.status(StatusCodes.OK).json(signedData))
    .mapErr((error) => {
      logger.error({
        message: 'Error verifying OTP',
        meta: logMeta,
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
