import { celebrate, Joi, Segments } from 'celebrate'
import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { SALT_ROUNDS } from '../../../shared/util/verification'
import { ErrorDto } from '../../../types/api'
import { createLoggerWithLabel } from '../../config/logger'
import * as FormService from '../../modules/form/form.service'
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
 * @deprecated in favour of handleCreateVerificationTransaction
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
 * @deprecated in favour of handleResetFieldVerification
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
 * @deprecated in favour of handleOtpVerification
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

/**
 * NOTE: Exported solely for testing
 * Handler for otp verification; double checks the submitted otp against the true otp
 * If the submitted otp is correct,
 * the signature that was saved will be appended to the response of the form when submitted
 * @param formId The id of the form which verification is for
 * @param transactionId The id of the transaction to validate
 * @param fieldId The id of the field to validate
 * @returns 200 when the otp is correct and the parameters are valid
 * @returns 400 when TransactionExpiredError occurs
 * @returns 400 when MissingHashDataError occurs
 * @returns 404 when FormNotFoundError occurs
 * @returns 404 when TransactionNotFoundError occurs
 * @returns 404 when FieldNotFoundInTransactionError occurs
 * @returns 422 when OtpExpiredError occurs
 * @returns 422 when OtpRetryExceededError occurs
 * @returns 422 when WrongOtpError occurs
 * @returns 500 when HashingError occurs
 * @returns 500 when DatabaseError occurs
 */
export const _handleOtpVerification: RequestHandler<
  { transactionId: string; fieldId: string; formId: string },
  string | ErrorDto,
  { otp: string }
> = async (req, res) => {
  const { transactionId, fieldId, formId } = req.params
  const { otp } = req.body
  const logMeta = {
    action: '_handleOtpVerification',
    transactionId,
    fieldId,
    ...createReqMeta(req),
  }
  return FormService.retrieveFormById(formId)
    .andThen(() => VerificationFactory.verifyOtp(transactionId, fieldId, otp))
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

/**
 * Handler with otp validation for POST /forms/:formId/fieldverifications/:id/fields/:fieldId/otp/verify
 */
export const handleOtpVerification = [
  celebrate({
    [Segments.BODY]: Joi.object({
      otp: Joi.string()
        .required()
        .regex(/^\d{6}$/)
        .message('Please enter a valid OTP'),
    }),
  }),
  _handleOtpVerification,
] as RequestHandler[]

/**
 * Handler for resetting the verification state of a field.
 * @param formId The id of the form to reset the field verification for
 * @param fieldId The id of the field to reset verification for
 * @param transactionId The transaction to reset
 * @returns 204 when reset is successful
 * @returns 400 when the transaction has expired
 * @returns 404 when the form could not be found
 * @returns 404 when the transaction could not be found
 * @returns 404 when the field could not be found
 * @returns 500 when a database error occurs
 */
export const handleResetFieldVerification: RequestHandler<
  {
    formId: string
    fieldId: string
    transactionId: string
  },
  ErrorDto
> = async (req, res) => {
  const { transactionId, fieldId, formId } = req.params
  const logMeta = {
    action: 'handleResetFieldVerification',
    transactionId,
    fieldId,
    ...createReqMeta(req),
  }
  return FormService.retrieveFormById(formId)
    .andThen(() =>
      VerificationFactory.resetFieldForTransaction(transactionId, fieldId),
    )
    .map(() => res.sendStatus(StatusCodes.NO_CONTENT))
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
