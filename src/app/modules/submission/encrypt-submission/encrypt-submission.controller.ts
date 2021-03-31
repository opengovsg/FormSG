import crypto from 'crypto'
import { RequestHandler } from 'express'
import { Query } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import JSONStream from 'JSONStream'
import moment from 'moment-timezone'
import mongoose from 'mongoose'
import { SetOptional } from 'type-fest'

import { aws as AwsConfig } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'
import {
  AuthType,
  EncryptedSubmissionDto,
  ResWithHashedFields,
  ResWithUinFin,
  WithParsedResponses,
} from '../../../../types'
import { ErrorDto } from '../../../../types/api'
import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import { CaptchaFactory } from '../../../services/captcha/captcha.factory'
import { checkIsEncryptedEncoding } from '../../../utils/encryption'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import { getFormAfterPermissionChecks } from '../../auth/auth.service'
import { MissingFeatureError } from '../../core/core.errors'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import * as FormService from '../../form/form.service'
import { isFormEncryptMode } from '../../form/form.utils'
import { MyInfoFactory } from '../../myinfo/myinfo.factory'
import { mapVerifyMyInfoError } from '../../myinfo/myinfo.util'
import { SpcpFactory } from '../../spcp/spcp.factory'
import { getPopulatedUserById } from '../../user/user.service'
import { VerifiedContentFactory } from '../../verified-content/verified-content.factory'
import { pushData as webhookPushData } from '../../webhook/webhook.service'
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
} from './encrypt-submission.service'
import { EncryptSubmissionBody } from './encrypt-submission.types'
import { mapRouteError } from './encrypt-submission.utils'

const logger = createLoggerWithLabel(module)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

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
    if (statusCode == StatusCodes.GONE) {
      return res.status(statusCode)
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
  // eslint-disable-next-line @typescript-eslint/no-extra-semi
  ;(req.body as WithParsedResponses<
    typeof req.body
  >).parsedResponses = processedResponses
  // Prevent downstream functions from using responses by deleting it.
  // TODO(#1104): We want to remove the mutability of state that comes with delete.
  delete (req.body as SetOptional<EncryptSubmissionBody, 'responses'>).responses

  // Checks if user is SPCP-authenticated before allowing submission
  const { authType } = form
  if (authType === AuthType.SP || authType === AuthType.CP) {
    const spcpResult = await SpcpFactory.extractJwt(
      req.cookies,
      authType,
    ).asyncAndThen((jwt) => SpcpFactory.extractJwtPayload(jwt, authType))
    if (spcpResult.isErr()) {
      const { statusCode, errorMessage } = mapRouteError(spcpResult.error)
      logger.error({
        message: 'Failed to verify JWT with auth client',
        meta: logMeta,
        error: spcpResult.error,
      })
      return res.status(statusCode).json({
        message: errorMessage,
        spcpSubmissionFailure: true,
      })
    }
    res.locals.uinFin = spcpResult.value.userName
    res.locals.userInfo = spcpResult.value.userInfo
  }

  // validating that submitted MyInfo field values match the values
  // originally retrieved from MyInfo.
  // TODO(frankchn): Roll into a single service call as part of internal refactoring
  const uinFin = (res as ResWithUinFin<typeof res>).locals.uinFin
  const requestedAttributes = form.getUniqueMyInfoAttrs()
  if (authType === AuthType.SP && requestedAttributes.length > 0) {
    if (!uinFin) {
      return res.status(StatusCodes.UNAUTHORIZED).send({
        message: 'Please log in to SingPass and try again.',
        spcpSubmissionFailure: true,
      })
    }
    const myinfoResult = await MyInfoFactory.fetchMyInfoHashes(
      uinFin,
      formId,
    ).andThen((hashes) =>
      MyInfoFactory.checkMyInfoHashes(req.body.parsedResponses, hashes),
    )
    if (myinfoResult.isErr()) {
      logger.error({
        message: 'Error verifying MyInfo hashes',
        meta: logMeta,
        error: myinfoResult.error,
      })
      const { statusCode, errorMessage } = mapVerifyMyInfoError(
        myinfoResult.error,
      )
      return res.status(statusCode).send({
        message: errorMessage,
        spcpSubmissionFailure: true,
      })
    }
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;(res as ResWithHashedFields<typeof res>).locals.hashedFields =
      myinfoResult.value
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

  if (form.authType === AuthType.SP || form.authType === AuthType.CP) {
    const encryptVerifiedContentResult = VerifiedContentFactory.getVerifiedContent(
      { type: form.authType, data: res.locals },
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
      res.locals.verified = encryptVerifiedContentResult.value
    }
  }

  // Save Responses to Database
  // TODO(frankchn): Extract S3 upload functionality to a service
  const formData = req.body.encryptedContent
  const attachmentData = req.body.attachments || {}
  const { verified } = res.locals
  const attachmentMetadata = new Map()
  const attachmentUploadPromises = []

  // Object.keys(attachmentData[fieldId].encryptedFile) [ 'submissionPublicKey', 'nonce', 'binary' ]
  for (const fieldId in attachmentData) {
    const individualAttachment = JSON.stringify(attachmentData[fieldId])

    const hashStr = crypto
      .createHash('sha256')
      .update(individualAttachment)
      .digest('hex')

    const uploadKey =
      form._id + '/' + crypto.randomBytes(20).toString('hex') + '/' + hashStr

    attachmentMetadata.set(fieldId, uploadKey)
    attachmentUploadPromises.push(
      AwsConfig.s3
        .upload({
          Bucket: AwsConfig.attachmentS3Bucket,
          Key: uploadKey,
          Body: Buffer.from(individualAttachment),
        })
        .promise(),
    )
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

  try {
    await Promise.all(attachmentUploadPromises)
  } catch (err) {
    logger.error({
      message: 'Attachment upload error',
      meta: logMeta,
      error: err,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({
      message:
        'Could not send submission. For assistance, please contact the person who asked you to fill in this form.',
      submissionId: submission._id,
      spcpSubmissionFailure: false,
    })
  }

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
  const webhookUrl = form.webhook?.url
  const submissionWebhookView = submission.getWebhookView()
  if (webhookUrl) {
    // Note that we push data to webhook endpoints on a best effort basis
    // As such, we should not await on these post requests
    void webhookPushData(webhookUrl, submissionWebhookView)
  }

  // Send Email Confirmations
  res.json({
    message: 'Form submission successful.',
    submissionId: submission.id,
  })

  return sendEmailConfirmations({
    form,
    parsedResponses: req.body.parsedResponses,
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

/**
 * Handler for GET /:formId([a-fA-F0-9]{24})/adminform/submissions/download
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
export const handleStreamEncryptedResponses: RequestHandler<
  { formId: string },
  unknown,
  unknown,
  Query & { startDate?: string; endDate?: string; downloadAttachments: boolean }
> = async (req, res) => {
  const sessionUserId = (req.session as Express.AuthedSession).user._id
  const { formId } = req.params
  const { startDate, endDate } = req.query

  // Step 1: Retrieve currently logged in user.
  // eslint-disable-next-line typesafe/no-await-without-trycatch
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

/**
 * Handler for GET /:formId/adminform/submissions
 *
 * @returns 200 with encrypted submission data response
 * @returns 404 if submissionId cannot be found in the database
 * @returns 500 if any errors occurs in database query or generating signed URL
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
        ).map((presignedUrls) => {
          // Successfully retrieved both submission and transforming presigned
          // URLs, create and return new DTO.
          const responseData: EncryptedSubmissionDto = {
            refNo: submissionData._id,
            submissionTime: moment(submissionData.created)
              .tz('Asia/Singapore')
              .format('ddd, D MMM YYYY, hh:mm:ss A'),
            content: submissionData.encryptedContent,
            verified: submissionData.verifiedContent,
            attachmentMetadata: presignedUrls,
          }
          return responseData
        })
      })
      .map((responseData) => res.json(responseData))
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving encrypted submission response',
          meta: {
            action: 'handleGetEncryptedResponse',
            submissionId,
            formId,
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
 * @returns 500 if any errors occurs whilst querying database
 */
export const handleGetMetadata: RequestHandler<
  { formId: string },
  unknown,
  unknown,
  Query & { page?: number; submissionId?: string }
> = async (req, res) => {
  const { formId } = req.params
  const { page, submissionId } = req.query

  const logMeta = {
    action: 'handleGetMetadata',
    formId,
    submissionId,
    page,
    ...createReqMeta(req),
  }

  // Specific query.
  if (submissionId) {
    return getSubmissionMetadata(formId, submissionId)
      .map((metadata) => {
        return metadata
          ? res.json({ metadata: [metadata], count: 1 })
          : res.json({ metadata: [], count: 0 })
      })
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
  }

  // General query
  return getSubmissionMetadataList(formId, page)
    .map((result) => res.json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Failure retrieving metadata list from database',
        meta: logMeta,
        error,
      })

      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({
        message: errorMessage,
      })
    })
}
