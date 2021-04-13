import { Request, RequestHandler } from 'express'
import { ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { AuthType, FieldResponse, IPopulatedEmailForm } from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import { CaptchaFactory } from '../../../services/captcha/captcha.factory'
import MailService from '../../../services/mail/mail.service'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import { ApplicationError } from '../../core/core.errors'
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
import { ProcessedFieldResponse } from '../submission.types'

import * as EmailSubmissionService from './email-submission.service'
import {
  mapAttachmentsFromResponses,
  mapRouteError,
  SubmissionEmailObj,
} from './email-submission.util'

const logger = createLoggerWithLabel(module)

export const handleEmailSubmission: RequestHandler<
  { formId: string },
  { message: string; submissionId?: string; spcpSubmissionFailure?: true },
  { responses: FieldResponse[]; isPreview: boolean },
  { captchaResponse?: unknown }
> = async (req, res) => {
  const { formId } = req.params
  const attachments = mapAttachmentsFromResponses(req.body.responses)
  let spcpSubmissionFailure: undefined | true

  // Inlined utilities
  const logMeta = {
    action: 'handleEmailSubmission',
    ...createReqMeta(req as Request),
    formId,
  }

  // Stores a predefined message and returns a function that can be used for mapErr
  const logErrorWithMeta = (
    loggerMeta: Record<string, unknown> & { action: string },
  ) => <E extends ApplicationError>(
    message: string,
    logLevel: 'warn' | 'error' = 'error',
  ) => (error: E) => {
    logger[logLevel]({
      message,
      meta: loggerMeta,
      error,
    })
    return error
  }

  const logErrorWithReqMeta = logErrorWithMeta(logMeta)

  return (
    // Retrieve form
    FormService.retrieveFullFormById(formId)
      .andThen((form) => EmailSubmissionService.checkFormIsEmailMode(form))
      // NOTE: This is on the top most level because errors are reported together for the first two
      .mapErr(logErrorWithReqMeta('Error while retrieving form from database'))
      .andThen((form) =>
        // Check that form is public
        // If it is, pass through and return the original form
        FormService.isFormPublic(form)
          .map(() => form)
          .mapErr(
            logErrorWithReqMeta('Attempt to submit non-public form', 'warn'),
          ),
      )
      .andThen((form) => {
        // Check the captcha
        if (form.hasCaptcha) {
          return CaptchaFactory.verifyCaptchaResponse(
            req.query.captchaResponse,
            getRequestIp(req as Request),
          )
            .map(() => form)
            .mapErr(logErrorWithReqMeta('Error while verifying captcha'))
        }
        return okAsync(form) as ResultAsync<IPopulatedEmailForm, never>
      })
      .andThen((form) =>
        // Check that the form has not reached submission limits
        FormService.checkFormSubmissionLimitAndDeactivateForm(form)
          .map(() => form)
          .mapErr(
            logErrorWithReqMeta(
              'Attempt to submit form which has just reached submission limits',
              'warn',
            ),
          ),
      )
      .andThen((form) =>
        // Validate responses
        EmailSubmissionService.validateAttachments(req.body.responses)
          .andThen(() =>
            SubmissionService.getProcessedResponses(form, req.body.responses),
          )
          .map((parsedResponses) => ({ parsedResponses, form }))
          .mapErr(logErrorWithReqMeta('Error processing responses')),
      )
      .andThen(({ parsedResponses, form }) => {
        const { authType } = form
        switch (authType) {
          case AuthType.CP:
            return SpcpFactory.extractJwt(req.cookies, authType)
              .asyncAndThen((jwt) => SpcpFactory.extractCorppassJwtPayload(jwt))
              .map((jwt) => ({
                form,
                parsedResponses: createCorppassParsedResponses(
                  jwt.userName,
                  jwt.userInfo,
                ),
                hashedFields: new Set<string>(),
              }))
              .mapErr((error) => {
                spcpSubmissionFailure = true
                return logErrorWithReqMeta(
                  'Failed to verify JWT with auth client',
                )(error)
              })
          case AuthType.SP:
            return SpcpFactory.extractJwt(req.cookies, authType)
              .asyncAndThen((jwt) => SpcpFactory.extractSingpassJwtPayload(jwt))
              .map((jwt) => ({
                form,
                parsedResponses: createSingpassParsedResponses(jwt.userName),
                hashedFields: new Set<string>(),
              }))
              .mapErr((error) => {
                spcpSubmissionFailure = true
                return logErrorWithReqMeta(
                  'Failed to verify JWT with auth client',
                )(error)
              })
          case AuthType.MyInfo:
            return MyInfoUtil.extractMyInfoCookie(req.cookies)
              .andThen(MyInfoUtil.extractAccessTokenFromCookie)
              .andThen((accessToken) =>
                MyInfoFactory.extractUinFin(accessToken),
              )
              .asyncAndThen((uinFin) =>
                MyInfoFactory.fetchMyInfoHashes(uinFin, formId)
                  .andThen((hashes) =>
                    MyInfoFactory.checkMyInfoHashes(parsedResponses, hashes),
                  )
                  .map((hashedFields) => ({
                    form,
                    hashedFields,
                    parsedResponses: [
                      ...parsedResponses,
                      ...createSingpassParsedResponses(uinFin),
                    ],
                  })),
              )
              .mapErr((error) => {
                spcpSubmissionFailure = true
                return logErrorWithReqMeta('Error verifying MyInfo hashes')(
                  error,
                )
              })
          default:
            return ok({
              form,
              parsedResponses,
              hashedFields: new Set<string>(),
            }) as Result<
              {
                form: IPopulatedEmailForm
                parsedResponses: ProcessedFieldResponse[]
                hashedFields: Set<string>
              },
              never
            >
        }
      })

      .andThen(({ form, parsedResponses, hashedFields }) => {
        // Create data for response email as well as email confirmation
        const emailData = new SubmissionEmailObj(
          parsedResponses,
          hashedFields,
          form.authType,
        )

        // Save submission to database
        return EmailSubmissionService.hashSubmission(
          emailData.formData,
          attachments,
        )
          .andThen((submissionHash) =>
            EmailSubmissionService.saveSubmissionMetadata(form, submissionHash),
          )
          .map((submission) => ({
            form,
            parsedResponses,
            submission,
            emailData,
          }))
          .mapErr(
            logErrorWithReqMeta('Error while saving metadata to database'),
          )
      })
      .andThen(({ form, parsedResponses, submission, emailData }) => {
        const logMetaWithSubmission = {
          ...logMeta,
          submissionId: submission._id,
        }

        const logErrorWithSubmissionMeta = logErrorWithMeta(
          logMetaWithSubmission,
        )

        // Send response to admin
        logger.info({
          message: 'Sending admin mail',
          meta: logMetaWithSubmission,
        })

        // NOTE: This should short circuit in the event of an error.
        // This is why sendSubmissionToAdmin is separated from sendEmailConfirmations in 2 blocks
        return MailService.sendSubmissionToAdmin({
          replyToEmails: EmailSubmissionService.extractEmailAnswers(
            parsedResponses,
          ),
          form,
          submission,
          attachments,
          dataCollationData: emailData.dataCollationData,
          formData: emailData.formData,
        })
          .map(() => ({ form, parsedResponses, submission, emailData }))
          .mapErr(
            logErrorWithSubmissionMeta('Error sending submission to admin'),
          )
      })
      // NOTE: The final step returns a ResultAsync so it is not a map
      .andThen(({ form, parsedResponses, submission, emailData }) => {
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
        })
      })
      .mapErr((error) => {
        const { errorMessage, statusCode } = mapRouteError(error)
        return res
          .status(statusCode)
          .json({ message: errorMessage, spcpSubmissionFailure })
      })
  )
}
