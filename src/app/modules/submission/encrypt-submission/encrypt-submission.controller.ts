import JoiDate from '@joi/date'
import { celebrate, Joi as BaseJoi, Segments } from 'celebrate'
import { RequestHandler } from 'express'
import { Query } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import JSONStream from 'JSONStream'
import mongoose from 'mongoose'
import { SetOptional } from 'type-fest'

import {
  AuthType,
  EncryptedSubmissionDto,
  SubmissionMetadataList,
} from '../../../../types'
import { EncryptSubmissionDto, ErrorDto } from '../../../../types/api'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import { CaptchaFactory } from '../../../services/captcha/captcha.factory'
import { checkIsEncryptedEncoding } from '../../../utils/encryption'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import { getFormAfterPermissionChecks } from '../../auth/auth.service'
import {
  MalformedParametersError,
  MissingFeatureError,
} from '../../core/core.errors'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import * as FormService from '../../form/form.service'
import { isFormEncryptMode } from '../../form/form.utils'
import { SpcpFactory } from '../../spcp/spcp.factory'
import { getPopulatedUserById } from '../../user/user.service'
import { VerifiedContentFactory } from '../../verified-content/verified-content.factory'
import { WebhookFactory } from '../../webhook/webhook.factory'
import {
  getProcessedResponses,
  sendEmailConfirmations,
} from '../submission.service'

import {
  checkFormIsEncryptMode,
  getEncryptedSubmissionData,
  getSubmissionCursor,
  getSubmissionMetadata,
  getSubmissionMetadataList,
  transformAttachmentMetasToSignedUrls,
  transformAttachmentMetaStream,
  uploadAttachments,
} from './encrypt-submission.service'
import {
  createEncryptedSubmissionDto,
  mapRouteError,
} from './encrypt-submission.utils'

const logger = createLoggerWithLabel(module)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

// NOTE: Refer to this for documentation: https://github.com/sideway/joi-date/blob/master/API.md
const Joi = BaseJoi.extend(JoiDate)

export const handleEncryptedSubmission: RequestHandler = async (req, res) => {
  const { formId } = req.params
  const logMeta = {
    action: 'handleEncryptedSubmission',
    ...createReqMeta(req),
    formId,
  }

  // Retrieve form
  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    logger.warn({
      message: 'Failed to retrieve form from database',
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
    const { statusCode } = mapRouteError(formPublicResult.error)
    if (statusCode === StatusCodes.GONE) {
      return res.sendStatus(statusCode)
    } else {
      return res.status(statusCode).json({
        message: form.inactiveMessage,
        isPageFound: true,
        formTitle: form.title,
      })
    }
  }

  // Check captcha
  if (form.hasCaptcha) {
    const captchaResult = await CaptchaFactory.verifyCaptchaResponse(
      req.query.captchaResponse,
      getRequestIp(req),
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
    const { statusCode } = mapRouteError(formSubmissionLimitResult.error)
    return res.status(statusCode).json({
      message: form.inactiveMessage,
      isPageFound: true,
      formTitle: form.title,
    })
  }

  // Validate encrypted submission
  const { encryptedContent, responses } = req.body
  const encryptedEncodingResult = await checkIsEncryptedEncoding(
    encryptedContent,
  )
  if (encryptedEncodingResult.isErr()) {
    logger.error({
      message: 'Error verifying content has encrypted encoding.',
      meta: logMeta,
      error: encryptedEncodingResult.error,
    })
    const { statusCode, errorMessage } = mapRouteError(
      encryptedEncodingResult.error,
    )
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }

  // Process encrypted submission
  const processedResponsesResult = await getProcessedResponses(form, responses)
  if (processedResponsesResult.isErr()) {
    logger.error({
      message: 'Error processing encrypted submission.',
      meta: logMeta,
      error: processedResponsesResult.error,
    })
    const { statusCode, errorMessage } = mapRouteError(
      processedResponsesResult.error,
    )
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }
  const processedResponses = processedResponsesResult.value
  delete (req.body as SetOptional<EncryptSubmissionDto, 'responses'>).responses

  // Checks if user is SPCP-authenticated before allowing submission
  let uinFin
  let userInfo
  const { authType } = form
  switch (authType) {
    case AuthType.MyInfo: {
      logger.error({
        message:
          'Storage mode form is not allowed to have MyInfo authorisation',
        meta: logMeta,
      })
      const { errorMessage, statusCode } = mapRouteError(
        new MalformedParametersError(
          'Storage mode form is not allowed to have MyInfo authType',
        ),
      )
      return res.status(statusCode).json({ message: errorMessage })
    }
    case AuthType.SP: {
      const jwtPayloadResult = await SpcpFactory.extractJwt(
        req.cookies,
        authType,
      ).asyncAndThen((jwt) => SpcpFactory.extractSingpassJwtPayload(jwt))
      if (jwtPayloadResult.isErr()) {
        const { statusCode, errorMessage } = mapRouteError(
          jwtPayloadResult.error,
        )
        logger.error({
          message: 'Failed to verify Singpass JWT with auth client',
          meta: logMeta,
          error: jwtPayloadResult.error,
        })
        return res.status(statusCode).json({
          message: errorMessage,
          spcpSubmissionFailure: true,
        })
      }
      uinFin = jwtPayloadResult.value.userName
      break
    }
    case AuthType.CP: {
      const jwtPayloadResult = await SpcpFactory.extractJwt(
        req.cookies,
        authType,
      ).asyncAndThen((jwt) => SpcpFactory.extractCorppassJwtPayload(jwt))
      if (jwtPayloadResult.isErr()) {
        const { statusCode, errorMessage } = mapRouteError(
          jwtPayloadResult.error,
        )
        logger.error({
          message: 'Failed to verify Corppass JWT with auth client',
          meta: logMeta,
          error: jwtPayloadResult.error,
        })
        return res.status(statusCode).json({
          message: errorMessage,
          spcpSubmissionFailure: true,
        })
      }
      uinFin = jwtPayloadResult.value.userName
      userInfo = jwtPayloadResult.value.userInfo
      break
    }
  }

  // Encrypt Verified SPCP Fields
  if (!isFormEncryptMode(form)) {
    logger.error({
      message:
        'Trying to encrypt verified SpCp fields on non-encrypt mode form',
      meta: logMeta,
    })
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message:
        'Unable to encrypt verified SPCP fields on non storage mode forms',
    })
  }

  let verified
  if (form.authType === AuthType.SP || form.authType === AuthType.CP) {
    const encryptVerifiedContentResult = VerifiedContentFactory.getVerifiedContent(
      { type: form.authType, data: { uinFin, userInfo } },
    ).andThen((verifiedContent) =>
      VerifiedContentFactory.encryptVerifiedContent({
        verifiedContent,
        formPublicKey: form.publicKey,
      }),
    )

    if (encryptVerifiedContentResult.isErr()) {
      const { error } = encryptVerifiedContentResult
      logger.error({
        message: 'Unable to encrypt verified content',
        meta: logMeta,
        error,
      })

      // Passthrough if feature is not activated.
      if (!(error instanceof MissingFeatureError)) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: 'Invalid data was found. Please submit again.' })
      }
    } else {
      // No errors, set local variable to the encrypted string.
      verified = encryptVerifiedContentResult.value
    }
  }

  // Save Responses to Database
  const formData = req.body.encryptedContent
  let attachmentMetadata = new Map<string, string>()

  if (req.body.attachments) {
    const attachmentUploadResult = await uploadAttachments(
      form._id,
      req.body.attachments,
    )

    if (attachmentUploadResult.isErr()) {
      const { statusCode, errorMessage } = mapRouteError(
        attachmentUploadResult.error,
      )
      return res.status(statusCode).json({
        message: errorMessage,
      })
    } else {
      attachmentMetadata = attachmentUploadResult.value
    }
  }

  const submission = new EncryptSubmission({
    form: form._id,
    authType: form.authType,
    myInfoFields: form.getUniqueMyInfoAttrs(),
    encryptedContent: formData,
    verifiedContent: verified,
    attachmentMetadata,
    version: req.body.version,
  })

  let savedSubmission
  try {
    savedSubmission = await submission.save()
  } catch (err) {
    logger.error({
      message: 'Encrypt submission save error',
      meta: {
        action: 'onEncryptSubmissionFailure',
        ...createReqMeta(req),
      },
      error: err,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({
      message:
        'Could not send submission. For assistance, please contact the person who asked you to fill in this form.',
      submissionId: submission._id,
      spcpSubmissionFailure: false,
    })
  }

  logger.info({
    message: 'Saved submission to MongoDB',
    meta: {
      ...logMeta,
      submissionId: savedSubmission._id,
    },
  })

  // Fire webhooks if available
  // Note that we push data to webhook endpoints on a best effort basis
  // As such, we should not await on these post requests
  const webhookUrl = form.webhook?.url
  if (webhookUrl) {
    void WebhookFactory.sendWebhook(
      submission,
      webhookUrl,
    ).andThen((response) =>
      WebhookFactory.saveWebhookRecord(submission._id, response),
    )
  }

  // Send Email Confirmations
  res.json({
    message: 'Form submission successful.',
    submissionId: submission.id,
  })

  return sendEmailConfirmations({
    form,
    parsedResponses: processedResponses,
    submission: savedSubmission,
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

// Validates that the ending date is greater than the starting date
const validateDateRange = celebrate({
  [Segments.QUERY]: Joi.object()
    .keys({
      startDate: Joi.date().format('YYYY-MM-DD').raw(),
      endDate: Joi.date()
        .format('YYYY-MM-DD')
        .greater(Joi.ref('startDate'))
        .raw(),
      downloadAttachments: Joi.boolean().default(false),
    })
    .and('startDate', 'endDate'),
})

/**
 * NOTE: This is exported solely for testing
 * Streams and downloads for GET /:formId([a-fA-F0-9]{24})/adminform/submissions/download
 * @security session
 *
 * @returns 200 with stream of encrypted responses
 * @returns 400 if form is not an encrypt mode form
 * @returns 400 if req.query.startDate or req.query.endDate is malformed
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 if any errors occurs in stream pipeline or error retrieving form
 */
export const streamEncryptedResponses: RequestHandler<
  { formId: string },
  unknown,
  unknown,
  Query & { startDate?: string; endDate?: string; downloadAttachments: boolean }
> = async (req, res) => {
  const sessionUserId = (req.session as Express.AuthedSession).user._id
  const { formId } = req.params
  const { startDate, endDate } = req.query

  // Step 1: Retrieve currently logged in user.
  const cursorResult = await getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      // Step 2: Check whether user has read permissions to form
      getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Read,
      }),
    )
    // Step 3: Check whether form is encrypt mode.
    .andThen(checkFormIsEncryptMode)
    // Step 4: Retrieve submissions cursor.
    .andThen(() =>
      getSubmissionCursor(formId, {
        startDate,
        endDate,
      }),
    )

  const logMeta = {
    action: 'handleStreamEncryptedResponses',
    ...createReqMeta(req),
    formId,
  }

  if (cursorResult.isErr()) {
    logger.error({
      message: 'Error occurred whilst retrieving submission cursor',
      meta: logMeta,
      error: cursorResult.error,
    })

    const { statusCode, errorMessage } = mapRouteError(cursorResult.error)
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }

  const cursor = cursorResult.value

  cursor
    .on('error', (error) => {
      logger.error({
        message: 'Error streaming submissions from database',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving from database.',
      })
    })
    .pipe(
      transformAttachmentMetaStream({
        enabled: req.query.downloadAttachments,
        urlValidDuration: (req.session?.cookie.maxAge ?? 0) / 1000,
      }),
    )
    .on('error', (error) => {
      logger.error({
        message: 'Error retrieving URL for attachments',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving URL for attachments',
      })
    })
    // If you call JSONStream.stringify(false) the elements will only be
    // seperated by a newline.
    .pipe(JSONStream.stringify(false))
    .on('error', (error) => {
      logger.error({
        message: 'Error converting submissions to JSON',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error converting submissions to JSON',
      })
    })
    .pipe(res.type('application/x-ndjson'))
    .on('error', (error) => {
      logger.error({
        message: 'Error writing submissions to HTTP stream',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error writing submissions to HTTP stream',
      })
    })
    .on('close', () => {
      logger.info({
        message: 'Stream encrypted responses closed',
        meta: logMeta,
      })

      return res.end()
    })
}

// Handler for GET /:formId([a-fA-F0-9]{24})/submissions/download
export const handleStreamEncryptedResponses = [
  validateDateRange,
  streamEncryptedResponses,
] as RequestHandler[]

/**
 * Handler for GET /:formId/adminform/submissions
 * @security session
 *
 * @returns 200 with encrypted submission data response
 * @returns 400 when form is not an encrypt mode form
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when submissionId cannot be found in the database
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when any errors occurs in database query or generating signed URL
 */
export const handleGetEncryptedResponse: RequestHandler<
  { formId: string },
  EncryptedSubmissionDto | ErrorDto,
  unknown,
  { submissionId: string }
> = async (req, res) => {
  const sessionUserId = (req.session as Express.AuthedSession).user._id
  const { submissionId } = req.query
  const { formId } = req.params

  return (
    // Step 1: Retrieve logged in user.
    getPopulatedUserById(sessionUserId)
      // Step 2: Check whether user has read permissions to form.
      .andThen((user) =>
        getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        }),
      )
      // Step 3: Check whether form is encrypt mode.
      .andThen(checkFormIsEncryptMode)
      // Step 4: Is encrypt mode form, retrieve submission data.
      .andThen(() => getEncryptedSubmissionData(formId, submissionId))
      // Step 5: Retrieve presigned URLs for attachments.
      .andThen((submissionData) => {
        // Remaining login duration in seconds.
        const urlExpiry = (req.session?.cookie.maxAge ?? 0) / 1000
        return transformAttachmentMetasToSignedUrls(
          submissionData.attachmentMetadata,
          urlExpiry,
        ).map((presignedUrls) =>
          createEncryptedSubmissionDto(submissionData, presignedUrls),
        )
      })
      .map((responseData) => res.json(responseData))
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving encrypted submission response',
          meta: {
            action: 'handleGetEncryptedResponse',
            submissionId,
            formId,
            ...createReqMeta(req),
          },
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({
          message: errorMessage,
        })
      })
  )
}

/**
 * Handler for GET /:formId([a-fA-F0-9]{24})/adminform/submissions/metadata
 *
 * @returns 200 with single submission metadata if query.submissionId is provided
 * @returns 200 with list of submission metadata with total count (and optional offset if query.page is provided) if query.submissionId is not provided
 * @returns 400 if form is not an encrypt mode form
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 if any errors occurs whilst querying database
 */
export const handleGetMetadata: RequestHandler<
  { formId: string },
  SubmissionMetadataList | ErrorDto,
  unknown,
  Query & { page?: number; submissionId?: string }
> = async (req, res) => {
  const sessionUserId = (req.session as Express.AuthedSession).user._id
  const { formId } = req.params
  const { page, submissionId } = req.query

  const logMeta = {
    action: 'handleGetMetadata',
    formId,
    submissionId,
    page,
    ...createReqMeta(req),
  }

  return (
    // Step 1: Retrieve logged in user.
    getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Check whether user has read permissions to form.
        getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        }),
      )
      // Step 3: Check whether form is encrypt mode.
      .andThen(checkFormIsEncryptMode)
      // Step 4: Retrieve submission metadata.
      .andThen(() => {
        // Step 4a: Retrieve specific submission id.
        if (submissionId) {
          return getSubmissionMetadata(formId, submissionId).map((metadata) => {
            const metadataList: SubmissionMetadataList = metadata
              ? { metadata: [metadata], count: 1 }
              : { metadata: [], count: 0 }
            return metadataList
          })
        }
        // Step 4b: Retrieve all submissions of given form id.
        return getSubmissionMetadataList(formId, page)
      })
      .map((metadataList) => res.json(metadataList))
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving metadata from database',
          meta: logMeta,
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({
          message: errorMessage,
        })
      })
  )
}
