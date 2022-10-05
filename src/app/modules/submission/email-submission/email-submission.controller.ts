import tracer from 'dd-trace'
import { ok, okAsync, ResultAsync } from 'neverthrow'

import {
  FormAuthType,
  SubmissionErrorDto,
  SubmissionResponseDto,
} from '../../../../../shared/types'
import { IPopulatedEmailForm } from '../../../../types'
import { ParsedEmailModeSubmissionBody } from '../../../../types/api'
import { createLoggerWithLabel } from '../../../config/logger'
import * as CaptchaMiddleware from '../../../services/captcha/captcha.middleware'
import * as CaptchaService from '../../../services/captcha/captcha.service'
import MailService from '../../../services/mail/mail.service'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'
import { setFormTags } from '../../datadog/datadog.utils'
import * as FormService from '../../form/form.service'
import {
  MYINFO_COOKIE_NAME,
  MYINFO_COOKIE_OPTIONS,
} from '../../myinfo/myinfo.constants'
import { MyInfoService } from '../../myinfo/myinfo.service'
import * as MyInfoUtil from '../../myinfo/myinfo.util'
import { SgidService } from '../../sgid/sgid.service'
import { getOidcService } from '../../spcp/spcp.oidc.service'
import * as EmailSubmissionMiddleware from '../email-submission/email-submission.middleware'
import * as SubmissionService from '../submission.service'
import { extractEmailConfirmationData } from '../submission.utils'

import * as EmailSubmissionService from './email-submission.service'
import { IPopulatedEmailFormWithResponsesAndHash } from './email-submission.types'
import {
  mapAttachmentsFromResponses,
  mapRouteError,
  SubmissionEmailObj,
} from './email-submission.util'
import ParsedResponsesObject from './ParsedResponsesObject.class'

const logger = createLoggerWithLabel(module)

const submitEmailModeForm: ControllerHandler<
  { formId: string },
  SubmissionResponseDto | SubmissionErrorDto,
  ParsedEmailModeSubmissionBody,
  { captchaResponse?: unknown }
> = async (req, res) => {
  const { formId } = req.params
  const attachments = mapAttachmentsFromResponses(req.body.responses)

  if ('isPreview' in req.body) {
    logger.info({
      message: 'isPreview is still being sent when submitting email mode form',
      meta: {
        action: 'submitEmailModeForm',
        type: 'deprecatedCheck',
      },
    })
  }

  let spcpSubmissionFailure: undefined | true

  const logMeta = {
    action: 'handleEmailSubmission',
    ...createReqMeta(req),
    formId,
  }

  return (
    // Retrieve form
    FormService.retrieveFullFormById(formId)
      .mapErr((error) => {
        logger.error({
          message: 'Error while retrieving form from database',
          meta: logMeta,
          error,
        })
        return error
      })
      .andThen((form) => {
        setFormTags(form)

        return EmailSubmissionService.checkFormIsEmailMode(form).mapErr(
          (error) => {
            logger.warn({
              message: 'Attempt to submit non-email-mode form',
              meta: logMeta,
              error,
            })
            return error
          },
        )
      })
      .andThen((form) =>
        // Check that form is public
        // If it is, pass through and return the original form
        FormService.isFormPublic(form)
          .map(() => form)
          .mapErr((error) => {
            logger.warn({
              message: 'Attempt to submit non-public form',
              meta: logMeta,
              error,
            })
            return error
          }),
      )
      .andThen((form) => {
        // Check the captcha
        if (form.hasCaptcha) {
          return CaptchaService.verifyCaptchaResponse(
            req.query.captchaResponse,
            getRequestIp(req),
          )
            .map(() => form)
            .mapErr((error) => {
              logger.error({
                message: 'Error while verifying captcha',
                meta: logMeta,
                error,
              })
              return error
            })
        }
        return okAsync(form) as ResultAsync<IPopulatedEmailForm, never>
      })
      .andThen((form) =>
        // Check that the form has not reached submission limits
        FormService.checkFormSubmissionLimitAndDeactivateForm(form)
          .map(() => form)
          .mapErr((error) => {
            logger.warn({
              message:
                'Attempt to submit form which has just reached submission limits',
              meta: logMeta,
              error,
            })
            return error
          }),
      )
      .andThen((form) =>
        // Validate responses
        EmailSubmissionService.validateAttachments(req.body.responses)
          .andThen(() =>
            ParsedResponsesObject.parseResponses(form, req.body.responses),
          )
          .map((parsedResponses) => ({ parsedResponses, form }))
          .mapErr((error) => {
            logger.error({
              message: 'Error processing responses',
              meta: logMeta,
              error,
            })
            return error
          }),
      )
      .andThen(({ parsedResponses, form }) => {
        const { authType } = form
        switch (authType) {
          case FormAuthType.CP: {
            const oidcService = getOidcService(FormAuthType.CP)
            return oidcService
              .extractJwt(req.cookies)
              .asyncAndThen((jwt) => oidcService.extractJwtPayload(jwt))
              .map<IPopulatedEmailFormWithResponsesAndHash>((jwt) => ({
                form,
                parsedResponses: parsedResponses.addNdiResponses({
                  authType,
                  uinFin: jwt.userName,
                  userInfo: jwt.userInfo,
                }),
              }))
              .mapErr((error) => {
                spcpSubmissionFailure = true
                logger.error({
                  message: 'Failed to verify Corppass JWT with oidc client',
                  meta: logMeta,
                  error,
                })
                return error
              })
          }
          case FormAuthType.SP: {
            const oidcService = getOidcService(FormAuthType.SP)
            return oidcService
              .extractJwt(req.cookies)
              .asyncAndThen((jwt) => oidcService.extractJwtPayload(jwt))
              .map<IPopulatedEmailFormWithResponsesAndHash>((jwt) => ({
                form,
                parsedResponses: parsedResponses.addNdiResponses({
                  authType,
                  uinFin: jwt.userName,
                }),
              }))
              .mapErr((error) => {
                spcpSubmissionFailure = true
                logger.error({
                  message: 'Failed to verify Singpass JWT with auth client',
                  meta: logMeta,
                  error,
                })
                return error
              })
          }
          case FormAuthType.MyInfo:
            return MyInfoUtil.extractMyInfoCookie(req.cookies)
              .andThen(MyInfoUtil.extractAccessTokenFromCookie)
              .andThen((accessToken) =>
                MyInfoService.extractUinFin(accessToken),
              )
              .asyncAndThen((uinFin) =>
                MyInfoService.fetchMyInfoHashes(uinFin, formId)
                  .andThen((hashes) =>
                    MyInfoService.checkMyInfoHashes(
                      parsedResponses.responses,
                      hashes,
                    ),
                  )
                  .map<IPopulatedEmailFormWithResponsesAndHash>(
                    (hashedFields) => ({
                      form,
                      hashedFields,
                      parsedResponses: parsedResponses.addNdiResponses({
                        authType,
                        uinFin,
                      }),
                    }),
                  ),
              )
              .mapErr((error) => {
                spcpSubmissionFailure = true
                logger.error({
                  message: 'Error verifying MyInfo hashes',
                  meta: logMeta,
                  error,
                })
                return error
              })
          case FormAuthType.SGID:
            return SgidService.extractSgidJwtPayload(req.cookies.jwtSgid)
              .map<IPopulatedEmailFormWithResponsesAndHash>(
                ({ userName: uinFin }) => ({
                  form,
                  parsedResponses: parsedResponses.addNdiResponses({
                    authType,
                    uinFin,
                  }),
                }),
              )
              .mapErr((error) => {
                spcpSubmissionFailure = true
                logger.error({
                  message: 'Failed to verify sgID JWT with auth client',
                  meta: logMeta,
                  error,
                })
                return error
              })
          default:
            return ok<IPopulatedEmailFormWithResponsesAndHash, never>({
              form,
              parsedResponses,
            })
        }
      })
      .andThen(({ form, parsedResponses, hashedFields }) => {
        // Create data for response email as well as email confirmation
        const emailData = new SubmissionEmailObj(
          parsedResponses.getAllResponses(),
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
          .mapErr((error) => {
            logger.error({
              message: 'Error while saving metadata to database',
              meta: logMeta,
              error,
            })
            return error
          })
      })
      .andThen(({ form, parsedResponses, submission, emailData }) => {
        const logMetaWithSubmission = {
          ...logMeta,
          submissionId: submission._id,
        }

        logger.info({
          message: 'Sending admin mail',
          meta: logMetaWithSubmission,
        })

        // Send response to admin
        // NOTE: This should short circuit in the event of an error.
        // This is why sendSubmissionToAdmin is separated from sendEmailConfirmations in 2 blocks
        // TODO: Remove tracer span once email performance issue is identified.
        return tracer.trace('sendSubmissionToAdmin', () =>
          MailService.sendSubmissionToAdmin({
            replyToEmails: EmailSubmissionService.extractEmailAnswers(
              parsedResponses.getAllResponses(),
            ),
            form,
            submission,
            attachments,
            dataCollationData: emailData.dataCollationData,
            formData: emailData.formData,
          })
            .map(() => ({
              form,
              parsedResponses,
              submission,
              emailData,
              logMetaWithSubmission,
            }))
            .mapErr((error) => {
              logger.error({
                message: 'Error sending submission to admin',
                meta: logMetaWithSubmission,
                error,
              })
              return error
            }),
        )
      })
      .map(
        ({
          form,
          parsedResponses,
          submission,
          emailData,
          logMetaWithSubmission,
        }) => {
          // Send email confirmations
          // TODO: Remove tracer span once email performance issue is identified.
          tracer.trace(
            'sendEmailConfirmations',
            () =>
              void SubmissionService.sendEmailConfirmations({
                form,
                submission,
                attachments,
                responsesData: emailData.autoReplyData,
                recipientData: extractEmailConfirmationData(
                  parsedResponses.getAllResponses(),
                  form.form_fields,
                ),
              }).mapErr((error) => {
                // NOTE: MyInfo access token is not cleared here.
                // This is because if the reason for failure is not on the users' end,
                // they should not be randomly signed out.
                logger.error({
                  message: 'Error while sending email confirmations',
                  meta: logMetaWithSubmission,
                  error,
                })
              }),
          )
          // MyInfo access token is single-use, so clear it
          return res
            .clearCookie(MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS)
            .json({
              // Return the reply early to the submitter
              message: 'Form submission successful.',
              submissionId: submission.id,
            })
        },
      )
      .mapErr((error) => {
        const { errorMessage, statusCode } = mapRouteError(error)
        return res
          .status(statusCode)
          .json({ message: errorMessage, spcpSubmissionFailure })
      })
  )
}

export const handleEmailSubmission = [
  CaptchaMiddleware.validateCaptchaParams,
  EmailSubmissionMiddleware.receiveEmailSubmission,
  EmailSubmissionMiddleware.validateResponseParams,
  submitEmailModeForm,
] as ControllerHandler[]
