import { Request, RequestHandler } from 'express'

import { createLoggerWithLabel } from '../../../../config/logger'
import { AuthType, FieldResponse } from '../../../../types'
import { CaptchaFactory } from '../../../services/captcha/captcha.factory'
import MailService from '../../../services/mail/mail.service'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import * as FormService from '../../form/form.service'
import {
  MYINFO_COOKIE_NAME,
  MYINFO_COOKIE_OPTIONS,
} from '../../myinfo/myinfo.constants'
import { MyInfoFactory } from '../../myinfo/myinfo.factory'
import * as MyInfoUtil from '../../myinfo/myinfo.util'
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
  SubmissionEmailObj,
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
    formId,
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
      getRequestIp(req as Request),
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

  // Check that the form has not reached submission limits
  const formSubmissionLimitResult = await FormService.checkFormSubmissionLimitAndDeactivateForm(
    form,
  )
  if (formSubmissionLimitResult.isErr()) {
    logger.warn({
      message:
        'Attempt to submit form which has just reached submission limits',
      meta: logMeta,
      error: formSubmissionLimitResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(
      formSubmissionLimitResult.error,
    )
    return res.status(statusCode).json({ message: errorMessage })
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

    // Append SingPass/CorpPass info to responses
    if (authType === AuthType.SP) {
      parsedResponses.push(...createSingpassParsedResponses(uinFin))
    } else if (authType === AuthType.CP) {
      // TODO (#317): remove usage of non-null assertion with better typing of JWT payload
      parsedResponses.push(...createCorppassParsedResponses(uinFin, userInfo!))
    }
  } else if (authType === AuthType.MyInfo) {
    const uinFinResult = MyInfoUtil.extractMyInfoCookie(req.cookies)
      .andThen(MyInfoUtil.extractAccessTokenFromCookie)
      .andThen((accessToken) => MyInfoFactory.extractUinFin(accessToken))
    if (uinFinResult.isErr()) {
      const { errorMessage, statusCode } = mapRouteError(uinFinResult.error)
      return res
        .status(statusCode)
        .json({ message: errorMessage, spcpSubmissionFailure: true })
    }
    const uinFin = uinFinResult.value
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
    parsedResponses.push(...createSingpassParsedResponses(uinFin))
  }

  // Create data for response email as well as email confirmation
  const emailData = new SubmissionEmailObj(
    parsedResponses,
    hashedFields,
    authType,
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
  const sendAdminEmailResult = await MailService.sendSubmissionToAdmin({
    replyToEmails: EmailSubmissionService.extractEmailAnswers(parsedResponses),
    form,
    submission,
    attachments,
    dataCollationData: emailData.dataCollationData,
    formData: emailData.formData,
  })
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

  // MyInfo access token is single-use, so clear it
  res.clearCookie(MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS)
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
