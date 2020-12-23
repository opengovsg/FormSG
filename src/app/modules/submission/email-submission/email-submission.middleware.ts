import { celebrate, Joi } from 'celebrate'
import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import { Merge, SetOptional } from 'type-fest'

import { createLoggerWithLabel } from '../../../../config/logger'
import {
  BasicField,
  EmailData,
  FieldResponse,
  ResWithHashedFields,
  WithAttachments,
  WithEmailData,
  WithForm,
} from '../../../../types'
import { createReqMeta } from '../../../utils/request'
import { getProcessedResponses } from '../submission.service'
import {
  ProcessedCheckboxResponse,
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
} from '../submission.types'

import * as EmailSubmissionReceiver from './email-submission.receiver'
import * as EmailSubmissionService from './email-submission.service'
import { WithAdminEmailData } from './email-submission.types'
import {
  mapAttachmentsFromResponses,
  mapRouteError,
} from './email-submission.util'

const logger = createLoggerWithLabel(module)

/**
 * Construct autoReply data and data to send admin from responses submitted
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const prepareEmailSubmission: RequestHandler<
  ParamsDictionary,
  unknown,
  { parsedResponses: ProcessedFieldResponse[] }
> = (req, res, next) => {
  const hashedFields =
    (res as ResWithHashedFields<typeof res>).locals.hashedFields || new Set()
  let emailData: EmailData
  // TODO (#847): remove when we are sure of the shape of responses
  try {
    emailData = EmailSubmissionService.createEmailData(
      req.body.parsedResponses,
      hashedFields,
    )
  } catch (error) {
    logger.error({
      message: 'Failed to create email data',
      meta: {
        action: 'prepareEmailSubmission',
        ...createReqMeta(req),
        responseMetaData: req.body.parsedResponses.map((response) => ({
          question: response?.question,
          // Cast just for logging purposes
          answerType: typeof (response as ProcessedSingleAnswerResponse)
            ?.answer,
          isAnswerTruthy: !!(response as ProcessedSingleAnswerResponse)?.answer,
          isAnswerArrayAnArray: Array.isArray(
            (response as ProcessedCheckboxResponse)?.answerArray,
          ),
          isAnswerArrayTruthy: !!(response as ProcessedCheckboxResponse)
            ?.answerArray,
          _id: response?._id,
          fieldType: response?.fieldType,
        })),
      },
      error,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({
      message:
        'There was something wrong with your submission. Please refresh and try again.',
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-extra-semi
  ;(req as WithEmailData<typeof req>).autoReplyData = emailData.autoReplyData
  ;(req as WithEmailData<typeof req>).jsonData = emailData.jsonData
  ;(req as WithEmailData<typeof req>).formData = emailData.formData
  return next()
}

/**
 * Parses multipart-form data request. Parsed attachments are
 * placed into req.attachments and parsed fields are placed into
 * req.body.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const receiveEmailSubmission: RequestHandler<
  ParamsDictionary,
  { message: string },
  { responses: FieldResponse[] }
> = async (req, res, next) => {
  const logMeta = {
    action: 'receiveEmailSubmission',
    ...createReqMeta(req),
  }
  return EmailSubmissionReceiver.createMultipartReceiver(req.headers)
    .asyncAndThen((receiver) => {
      const result = EmailSubmissionReceiver.configureMultipartReceiver(
        receiver,
      )
      req.pipe(receiver)
      return result
    })
    .map((parsed) => {
      req.body = parsed
      return next()
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while receiving multipart data',
        meta: logMeta,
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Extracts relevant fields, injects questions, verifies visibility of field and validates answers
 * to produce req.body.parsedResponses
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const validateEmailSubmission: RequestHandler<
  ParamsDictionary,
  { message: string },
  { responses: FieldResponse[] }
> = async (req, res, next) => {
  const { form } = req as WithForm<typeof req>

  return EmailSubmissionService.validateAttachments(req.body.responses)
    .andThen(() => getProcessedResponses(form, req.body.responses))
    .map((parsedResponses) => {
      // Creates an array of attachments from the validated responses
      // TODO (#42): remove these types when merging middlewares into controller
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;(req as WithAttachments<
        typeof req
      >).attachments = mapAttachmentsFromResponses(req.body.responses)
      ;(req.body as Merge<
        typeof req.body,
        { parsedResponses: ProcessedFieldResponse[] }
      >).parsedResponses = parsedResponses
      delete (req.body as SetOptional<typeof req.body, 'responses'>).responses // Prevent downstream functions from using responses by deleting it
      return next()
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error processing responses',
        meta: {
          action: 'validateEmailSubmission',
          ...createReqMeta(req),
          formId: form._id,
        },
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({
        message: errorMessage,
      })
    })
}

/**
 * Sends response email to admin
 * @param req - Express request object
 * @param req.form - form object from req
 * @param req.formData - the submission for the form
 * @param req.jsonData - data to be included in JSON section of email
 * @param req.submission - submission which was saved to database
 * @param req.attachments - submitted attachments, parsed by
 * exports.receiveSubmission
 * @param res - Express response object
 * @param next - the next expressjs callback, invoked once attachments
 * are processed
 */
export const sendAdminEmail: RequestHandler<
  ParamsDictionary,
  { message: string; spcpSubmissionFailure: boolean },
  { parsedResponses: ProcessedFieldResponse[] }
> = async (req, res, next) => {
  const {
    form,
    formData,
    jsonData,
    submission,
    attachments,
  } = req as WithAdminEmailData<typeof req>
  const logMeta = {
    action: 'sendAdminEmail',
    submissionId: submission.id,
    formId: form._id,
    ...createReqMeta(req),
    submissionHash: submission.responseHash,
  }
  logger.info({
    message: 'Sending admin mail',
    meta: logMeta,
  })
  return EmailSubmissionService.sendSubmissionToAdmin({
    replyToEmails: EmailSubmissionService.extractEmailAnswers(
      req.body.parsedResponses,
    ),
    form,
    submission,
    attachments,
    jsonData,
    formData,
  })
    .map(() => next())
    .mapErr((error) => {
      logger.error({
        message: 'Error sending submission to admin',
        meta: logMeta,
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({
        message: errorMessage,
        spcpSubmissionFailure: false,
      })
    })
}

export const validateResponseParams = celebrate({
  body: Joi.object({
    responses: Joi.array()
      .items(
        Joi.object()
          .keys({
            _id: Joi.string().required(),
            question: Joi.string(),
            fieldType: Joi.string()
              .required()
              .valid(...Object.values(BasicField)),
            answer: Joi.string().allow(''),
            answerArray: Joi.array(),
            filename: Joi.string(),
            content: Joi.binary(),
            isHeader: Joi.boolean(),
            myInfo: Joi.object(),
            signature: Joi.string().allow(''),
          })
          .xor('answer', 'answerArray') // only answer or answerArray can be present at once
          .with('filename', 'content'), // if filename is present, content must be present
      )
      .required(),
    isPreview: Joi.boolean().required(),
  }),
})
