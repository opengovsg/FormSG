import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'

import {
  ErrorDto,
  FormAuthType,
  StorageModeSubmissionDto,
} from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEncryptSubmissionModel } from '../../../models/submission.server.model'
import * as CaptchaMiddleware from '../../../services/captcha/captcha.middleware'
import * as TurnstileMiddleware from '../../../services/turnstile/turnstile.middleware'
import { Pipeline } from '../../../utils/pipeline-middleware'
import { createReqMeta } from '../../../utils/request'
import { MalformedParametersError } from '../../core/core.errors'
import { ControllerHandler } from '../../core/core.types'
import { setFormTags } from '../../datadog/datadog.utils'
import * as FormService from '../../form/form.service'
import {
  ensureFormWithinSubmissionLimits,
  ensurePublicForm,
  ensureValidCaptcha,
} from '../encrypt-submission/encrypt-submission.ensures'
import { SubmissionFailedError } from '../encrypt-submission/encrypt-submission.errors'
import * as EncryptSubmissionMiddleware from '../encrypt-submission/encrypt-submission.middleware'
import {
  getEncryptedSubmissionData,
  getSubmissionPaymentDto,
  performEncryptPostSubmissionActions,
  transformAttachmentMetasToSignedUrls,
  uploadAttachments,
} from '../encrypt-submission/encrypt-submission.service'
import {
  SubmitEncryptModeFormHandlerRequest,
  SubmitEncryptModeFormHandlerType,
} from '../encrypt-submission/encrypt-submission.types'
import {
  createEncryptedSubmissionDto,
  mapRouteError,
} from '../encrypt-submission/encrypt-submission.utils'
import * as ReceiverMiddleware from '../receiver/receiver.middleware'
import { reportSubmissionResponseTime } from '../submissions.statsd-client'

import * as MultirespondentSubmissionMiddleware from './multirespondent-submission.middleware'
import { checkFormIsMultirespondent } from './multirespondent-submission.service'
import {
  UpdateMultirespondentSubmissionHandlerRequest,
  UpdateMultirespondentSubmissionHandlerType,
} from './multirespondent-submission.types'

const logger = createLoggerWithLabel(module)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

const submitMultirespondentForm = async (
  req: SubmitEncryptModeFormHandlerRequest,
  res: Parameters<SubmitEncryptModeFormHandlerType>[1],
) => {
  const { formId } = req.params

  const logMeta = {
    action: 'submitMultirespondentForm',
    ...createReqMeta(req),
    formId,
  }

  const formDef = req.formsg.formDef
  const form = req.formsg.encryptedFormDef

  setFormTags(formDef)

  const ensurePipeline = new Pipeline(
    ensurePublicForm,
    ensureValidCaptcha,
    ensureFormWithinSubmissionLimits,
  )

  const hasEnsuredAll = await ensurePipeline.execute({
    form,
    logMeta,
    req,
    res,
  })

  if (!hasEnsuredAll) {
    if (!res.headersSent) {
      const { errorMessage, statusCode } = mapRouteError(
        new SubmissionFailedError(),
      )
      return res.status(statusCode).json({ message: errorMessage })
    }
    return // required to stop submission processing
  }

  const encryptedPayload = req.formsg.encryptedPayload

  // Create Incoming Submission
  const { encryptedContent, responseMetadata } = encryptedPayload

  // Disallow form authentication for multirespondent forms
  if (formDef.authType !== FormAuthType.NIL) {
    logger.error({
      message: 'Multirespondent form is not allowed to have authorization',
      meta: logMeta,
    })
    const { errorMessage, statusCode } = mapRouteError(
      new MalformedParametersError(
        'Multirespondent form is not allowed to have authType',
      ),
    )
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Save Responses to Database
  let attachmentMetadata = new Map<string, string>()

  if (encryptedPayload.attachments) {
    const attachmentUploadResult = await uploadAttachments(
      form._id,
      encryptedPayload.attachments,
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

  const submissionContent = {
    form: form._id,
    authType: form.authType,
    myInfoFields: form.getUniqueMyInfoAttrs(),
    encryptedContent: encryptedContent,
    attachmentMetadata,
    version: req.formsg.encryptedPayload.version,
    responseMetadata,
  }

  return _createSubmission({
    req,
    res,
    logMeta,
    formId,
    responses: req.formsg.filteredResponses,
    responseMetadata,
    submissionContent,
  })
}

const updateMultirespondentSubmission = async (
  req: UpdateMultirespondentSubmissionHandlerRequest,
  res: Parameters<UpdateMultirespondentSubmissionHandlerType>[1],
) => {
  const { formId, submissionId } = req.params

  const logMeta = {
    action: 'updateEncryptModeSubmission',
    ...createReqMeta(req),
    formId,
  }

  const formDef = req.formsg.formDef
  const form = req.formsg.encryptedFormDef

  setFormTags(formDef)

  const ensurePipeline = new Pipeline(
    ensurePublicForm,
    ensureValidCaptcha,
    ensureFormWithinSubmissionLimits,
  )

  const hasEnsuredAll = await ensurePipeline.execute({
    form,
    logMeta,
    req,
    res,
  })

  if (!hasEnsuredAll) {
    if (!res.headersSent) {
      const { errorMessage, statusCode } = mapRouteError(
        new SubmissionFailedError(),
      )
      return res.status(statusCode).json({ message: errorMessage })
    }
    return // required to stop submission processing
  }

  const encryptedPayload = req.formsg.encryptedPayload

  // Create Incoming Submission
  const { encryptedContent, responseMetadata } = encryptedPayload

  // Save Responses to Database
  let attachmentMetadata = new Map<string, string>()

  if (encryptedPayload.attachments) {
    const attachmentUploadResult = await uploadAttachments(
      form._id,
      encryptedPayload.attachments,
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

  const submission = await EncryptSubmission.findById(submissionId)

  if (!submission) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'Not found',
    })
  }

  submission.encryptedContent = encryptedContent
  submission.attachmentMetadata = attachmentMetadata

  try {
    await submission.save()
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
      submissionId,
    })
  }

  logger.info({
    message: 'Saved submission to MongoDB',
    meta: {
      ...logMeta,
      submissionId,
      formId,
      responseMetadata,
    },
  })

  // Send success back to client
  res.json({
    message: 'Form submission successful.',
    submissionId,
    timestamp: (submission.created || new Date()).getTime(),
  })
}

const _createSubmission = async ({
  req,
  res,
  submissionContent,
  logMeta,
  formId,
  responseMetadata,
  responses,
}: {
  req: Parameters<SubmitEncryptModeFormHandlerType>[0]
  res: Parameters<SubmitEncryptModeFormHandlerType>[1]
  [others: string]: any
}) => {
  const submission = new EncryptSubmission(submissionContent)

  try {
    await submission.save()
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
    })
  }

  const submissionId = submission.id
  logger.info({
    message: 'Saved submission to MongoDB',
    meta: {
      ...logMeta,
      submissionId,
      formId,
      responseMetadata,
    },
  })

  // TODO 6395 make responseMetadata mandatory
  if (responseMetadata) {
    reportSubmissionResponseTime(responseMetadata, {
      mode: 'encrypt',
      payment: 'true',
    })
  }

  // Send success back to client
  res.json({
    message: 'Form submission successful.',
    submissionId,
    timestamp: (submission.created || new Date()).getTime(),
  })

  return await performEncryptPostSubmissionActions(submission, responses)
}

export const handleMultirespondentSubmission = [
  CaptchaMiddleware.validateCaptchaParams,
  TurnstileMiddleware.validateTurnstileParams,
  ReceiverMiddleware.receiveStorageSubmission,
  EncryptSubmissionMiddleware.validateStorageSubmissionParams,
  MultirespondentSubmissionMiddleware.createFormsgAndRetrieveForm,
  EncryptSubmissionMiddleware.checkNewBoundaryEnabled,
  EncryptSubmissionMiddleware.scanAndRetrieveAttachments,
  EncryptSubmissionMiddleware.validateStorageSubmission,
  EncryptSubmissionMiddleware.encryptSubmission,
  submitMultirespondentForm,
] as ControllerHandler[]

export const handleUpdateMultirespondentSubmission = [
  CaptchaMiddleware.validateCaptchaParams,
  TurnstileMiddleware.validateTurnstileParams,
  ReceiverMiddleware.receiveStorageSubmission,
  EncryptSubmissionMiddleware.validateStorageSubmissionParams,
  MultirespondentSubmissionMiddleware.createFormsgAndRetrieveForm,
  EncryptSubmissionMiddleware.checkNewBoundaryEnabled,
  EncryptSubmissionMiddleware.scanAndRetrieveAttachments,
  EncryptSubmissionMiddleware.validateStorageSubmission,
  EncryptSubmissionMiddleware.encryptSubmission,
  updateMultirespondentSubmission,
] as ControllerHandler[]

/**
 * Handler for GET /forms/:formId/submissions/:submissionId
 * @returns 200 with encrypted submission data response
 * @returns 400 when form is not an encrypt mode form
 * @returns 404 when submissionId cannot be found in the database
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 500 when any errors occurs in database query, generating signed URL or retrieving payment data
 */
export const handleGetMultirespondentSubmissionForRespondent: ControllerHandler<
  { formId: string; submissionId: string },
  StorageModeSubmissionDto | ErrorDto
> = async (req, res) => {
  const { formId, submissionId } = req.params

  const logMeta = {
    action: 'handleGetMultirespondentSubmissionForRespondent',
    submissionId,
    formId,
    ...createReqMeta(req),
  }

  logger.info({
    message: 'Get encrypted response using submissionId start',
    meta: logMeta,
  })

  return (
    // Step 1: Retrieve the full form object.
    FormService.retrieveFullFormById(formId)
      // TODO Step 2: Check whether form is not archived.
      // Step 3: Check whether form is encrypt mode.
      .andThen(checkFormIsMultirespondent)
      // Step 4: Is encrypt mode form, retrieve submission data.
      .andThen(() => getEncryptedSubmissionData(formId, submissionId))
      // Step 5: If there is an associated payment, get the payment details.
      .andThen((submissionData) => {
        if (!submissionData.paymentId) {
          return okAsync({ submissionData, paymentData: undefined })
        }

        return getSubmissionPaymentDto(submissionData.paymentId).map(
          (paymentData) => ({
            submissionData,
            paymentData,
          }),
        )
      })
      // Step 6: Retrieve presigned URLs for attachments.
      .andThen(({ submissionData, paymentData }) => {
        // Remaining login duration in seconds.
        const urlExpiry = (req.session?.cookie.maxAge ?? 0) / 1000
        return transformAttachmentMetasToSignedUrls(
          submissionData.attachmentMetadata,
          urlExpiry,
        ).map((presignedUrls) =>
          createEncryptedSubmissionDto(
            submissionData,
            presignedUrls,
            paymentData,
          ),
        )
      })
      .map((responseData) => {
        logger.info({
          message: 'Get encrypted response using submissionId success',
          meta: logMeta,
        })
        return res.json(responseData)
      })
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving encrypted submission response',
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
