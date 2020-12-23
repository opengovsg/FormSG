import { Request, RequestHandler } from 'express'

import { createLoggerWithLabel } from '../../../../config/logger'
import { AuthType, FieldResponse } from '../../../../types'
import { CaptchaFactory } from '../../../services/captcha/captcha.factory'
import { MyInfoFactory } from '../../../services/myinfo/myinfo.factory'
import { createReqMeta } from '../../../utils/request'
import * as FormService from '../../form/form.service'
import { SpcpFactory } from '../../spcp/spcp.factory'
import {
  createCorppassParsedResponses,
  createSingpassParsedResponses,
} from '../../spcp/spcp.util'
import * as SubmissionService from '../submission.service'

import * as EmailSubmissionService from './email-submission.service'
import {
  mapAttachmentsFromResponses,
  mapRouteError,
} from './email-submission.util'

const logger = createLoggerWithLabel(module)

export const handleEmailSubmission: RequestHandler<
  { formId: string },
  { message: string; submissionId?: string; spcpSubmissionFailure?: boolean },
  { responses: FieldResponse[]; isPreview: boolean },
  { captchaResponse?: unknown }
> = async (req, res) => {
  const { formId } = req.params
  const logMeta = {
    action: 'handleEmailSubmission',
    ...createReqMeta(req as Request),
    formId,
  }
  // Retrieve form
  const formResult = await FormService.retrieveFullFormById(
    req.params.formId,
  ).andThen((form) => EmailSubmissionService.checkFormIsEmailMode(form))
  if (formResult.isErr()) {
    logger.error({
      message: 'Error while retrieving form from database',
      meta: logMeta,
      error: formResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }
  const form = formResult.value

  // Check that form is public
  const formPublicResult = FormService.isFormPublic(form)
  if (formPublicResult.isErr()) {
    logger.warn({
      message: 'Attempt to submit non-public form',
      meta: logMeta,
      error: formPublicResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formPublicResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Check captcha
  if (form.hasCaptcha) {
    const captchaResult = await CaptchaFactory.verifyCaptchaResponse(
      req.query.captchaResponse,
      req.connection.remoteAddress,
    )
    if (captchaResult.isErr()) {
      logger.error({
        message: 'Error while verifying captcha',
        meta: logMeta,
        error: captchaResult.error,
      })
      const { errorMessage, statusCode } = mapRouteError(captchaResult.error)
      return res.status(statusCode).json({ message: errorMessage })
    }
  }

  // Validate responses
  const parsedResponsesResult = await EmailSubmissionService.validateAttachments(
    req.body.responses,
  ).andThen(() =>
    SubmissionService.getProcessedResponses(form, req.body.responses),
  )
  if (parsedResponsesResult.isErr()) {
    logger.error({
      message: 'Error processing responses',
      meta: logMeta,
      error: parsedResponsesResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(
      parsedResponsesResult.error,
    )
    return res.status(statusCode).json({ message: errorMessage })
  }
  const parsedResponses = parsedResponsesResult.value
  const attachments = mapAttachmentsFromResponses(req.body.responses)

  // Keep track of which fields are MyInfo-verified
  let hashedFields = new Set<string>()

  // Handle SingPass, CorpPass and MyInfo authentication and validation
  const { authType } = form
  if (authType === AuthType.SP || authType === AuthType.CP) {
    // Verify NRIC and/or UEN
    const jwtPayloadResult = await SpcpFactory.extractJwt(
      req.cookies,
      authType,
    ).asyncAndThen((jwt) => SpcpFactory.extractJwtPayload(jwt, authType))
    if (jwtPayloadResult.isErr()) {
      logger.error({
        message: 'Failed to verify JWT with auth client',
        meta: logMeta,
        error: jwtPayloadResult.error,
      })
      const { errorMessage, statusCode } = mapRouteError(jwtPayloadResult.error)
      return res
        .status(statusCode)
        .json({ message: errorMessage, spcpSubmissionFailure: true })
    }
    const { userName: uinFin, userInfo } = jwtPayloadResult.value

    // Verify MyInfo hashes if relevant
    const requestedMyInfoAttrs = form.getUniqueMyInfoAttrs()
    if (authType === AuthType.SP && requestedMyInfoAttrs.length > 0) {
      const verifyMyInfoResult = await MyInfoFactory.fetchMyInfoHashes(
        uinFin,
        formId,
      ).andThen((hashes) =>
        MyInfoFactory.checkMyInfoHashes(parsedResponses, hashes),
      )
      if (verifyMyInfoResult.isErr()) {
        logger.error({
          message: 'Error verifying MyInfo hashes',
          meta: logMeta,
          error: verifyMyInfoResult.error,
        })
        const { errorMessage, statusCode } = mapRouteError(
          verifyMyInfoResult.error,
        )
        return res
          .status(statusCode)
          .json({ message: errorMessage, spcpSubmissionFailure: true })
      }
      hashedFields = verifyMyInfoResult.value
    }

    // Append SingPass/CorpPass info to responses
    if (authType === AuthType.SP) {
      parsedResponses.push(...createSingpassParsedResponses(uinFin))
    } else if (authType === AuthType.CP) {
      // TODO (#317): remove usage of non-null assertion with better typing of JWT payload
      parsedResponses.push(...createCorppassParsedResponses(uinFin, userInfo!))
    }
  }

  // Create data for response email as well as email confirmation
  const emailData = EmailSubmissionService.createEmailData(
    parsedResponses,
    hashedFields,
  )

  // Save submission to database
  const submissionResult = await EmailSubmissionService.hashSubmission(
    emailData.formData,
    attachments,
  ).andThen((submissionHash) =>
    EmailSubmissionService.saveSubmissionMetadata(form, submissionHash),
  )
  if (submissionResult.isErr()) {
    logger.error({
      message: 'Error while saving metadata to database',
      meta: logMeta,
      error: submissionResult.error,
    })
    const { statusCode, errorMessage } = mapRouteError(submissionResult.error)
    return res.status(statusCode).json({
      message: errorMessage,
      spcpSubmissionFailure: false,
    })
  }
  const submission = submissionResult.value
  const logMetaWithSubmission = { ...logMeta, submissionId: submission._id }

  // Send response to admin
  logger.info({
    message: 'Sending admin mail',
    meta: logMetaWithSubmission,
  })
  const sendAdminEmailResult = await EmailSubmissionService.sendSubmissionToAdmin(
    {
      replyToEmails: EmailSubmissionService.extractEmailAnswers(
        parsedResponses,
      ),
      form,
      submission,
      attachments,
      jsonData: emailData.jsonData,
      formData: emailData.formData,
    },
  )
  if (sendAdminEmailResult.isErr()) {
    logger.error({
      message: 'Error sending submission to admin',
      meta: logMetaWithSubmission,
      error: sendAdminEmailResult.error,
    })
    const { statusCode, errorMessage } = mapRouteError(
      sendAdminEmailResult.error,
    )
    return res.status(statusCode).json({
      message: errorMessage,
      spcpSubmissionFailure: false,
    })
  }

  // Return the reply early to the submitter
  res.json({
    message: 'Form submission successful.',
    submissionId: submission.id,
  })

  // Send email confirmations
  return SubmissionService.sendEmailConfirmations({
    form,
    parsedResponses,
    submission,
    attachments,
    autoReplyData: emailData.autoReplyData,
  }).mapErr((error) => {
    logger.error({
      message: 'Error while sending email confirmations',
      meta: {
        action: 'sendEmailAutoReplies',
      },
      error,
    })
  })
}
