import { StatusCodes } from 'http-status-codes'
import { errAsync } from 'neverthrow'

import {
  ErrorDto,
  FormAuthType,
  MultirespondentSubmissionDto,
  SubmissionType,
} from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import * as CaptchaMiddleware from '../../../services/captcha/captcha.middleware'
import * as TurnstileMiddleware from '../../../services/turnstile/turnstile.middleware'
import { Pipeline } from '../../../utils/pipeline-middleware'
import { createReqMeta } from '../../../utils/request'
import { MalformedParametersError } from '../../core/core.errors'
import { ControllerHandler } from '../../core/core.types'
import { setFormTags } from '../../datadog/datadog.utils'
import { assertFormAvailable } from '../../form/admin-form/admin-form.utils'
import * as FormService from '../../form/form.service'
import {
  ensureFormWithinSubmissionLimits,
  ensurePublicForm,
  ensureValidCaptcha,
} from '../encrypt-submission/encrypt-submission.ensures'
import * as ReceiverMiddleware from '../receiver/receiver.middleware'
import {
  InvalidSubmissionTypeError,
  SubmissionFailedError,
  SubmissionSaveError,
} from '../submission.errors'
import {
  getEncryptedSubmissionData,
  transformAttachmentMetasToSignedUrls,
} from '../submission.service'
import { mapRouteError } from '../submission.utils'

import * as MultirespondentSubmissionMiddleware from './multirespondent-submission.middleware'
import {
  checkFormIsMultirespondent,
  createMultiRespondentFormSubmission,
  performMultiRespondentPostSubmissionCreateActions,
  performMultiRespondentPostSubmissionUpdateActions,
  updateMultiRespondentFormSubmission,
} from './multirespondent-submission.service'
import {
  SubmitMultirespondentFormHandlerRequest,
  SubmitMultirespondentFormHandlerType,
  UpdateMultirespondentSubmissionHandlerRequest,
  UpdateMultirespondentSubmissionHandlerType,
} from './multirespondent-submission.types'
import { createMultirespondentSubmissionDto } from './multirespondent-submission.utils'

const logger = createLoggerWithLabel(module)

const submitMultirespondentForm = async (
  req: SubmitMultirespondentFormHandlerRequest,
  res: Parameters<SubmitMultirespondentFormHandlerType>[1],
) => {
  const { formId } = req.params

  const logMeta = {
    action: 'submitMultirespondentForm',
    ...createReqMeta(req),
    formId,
  }

  const form = req.formsg.formDef

  setFormTags(form)

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

  // Disallow form authentication for multirespondent forms
  if (form.authType !== FormAuthType.NIL) {
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

  const encryptedPayload = req.formsg.encryptedPayload

  const createMultiRespondentFormSubmissionResult =
    await createMultiRespondentFormSubmission({
      form,
      encryptedPayload,
      logMeta,
    })

  if (createMultiRespondentFormSubmissionResult.isErr()) {
    const error = createMultiRespondentFormSubmissionResult.error

    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  const submission = createMultiRespondentFormSubmissionResult.value

  // Send success back to client
  res.json({
    message: 'Form submission successful.',
    submissionId: submission._id,
    timestamp: (submission.created || new Date()).getTime(),
  })

  await performMultiRespondentPostSubmissionCreateActions({
    submissionId: submission._id.toString(),
    form,
    encryptedPayload,
    logMeta,
  })
}

export const submitMultirespondentFormForTest = submitMultirespondentForm

const updateMultirespondentSubmission = async (
  req: UpdateMultirespondentSubmissionHandlerRequest,
  res: Parameters<UpdateMultirespondentSubmissionHandlerType>[1],
) => {
  const { formId, submissionId } = req.params

  const logMeta = {
    action: 'updateMultirespondentSubmission',
    ...createReqMeta(req),
    formId,
  }

  const form = req.formsg.formDef

  setFormTags(form)

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

  const updateMultiRespondentFormSubmissionResult =
    await updateMultiRespondentFormSubmission({
      formId,
      submissionId,
      form,
      encryptedPayload,
      logMeta,
    })

  if (updateMultiRespondentFormSubmissionResult.isErr()) {
    const error = updateMultiRespondentFormSubmissionResult.error

    if (error instanceof SubmissionSaveError) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: error.message,
        submissionId,
      })
    }

    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  const submission = updateMultiRespondentFormSubmissionResult.value

  // Send success back to client
  res.json({
    message: 'Form submission successful.',
    submissionId,
    timestamp: (submission.created || new Date()).getTime(),
  })

  const currentStepNumber = submission.workflowStep

  await performMultiRespondentPostSubmissionUpdateActions({
    submissionId,
    form,
    currentStepNumber,
    encryptedPayload,
    logMeta,
  })
}

export const updateMultirespondentSubmissionForTest =
  updateMultirespondentSubmission

export const handleMultirespondentSubmission = [
  CaptchaMiddleware.validateCaptchaParams,
  TurnstileMiddleware.validateTurnstileParams,
  ReceiverMiddleware.receiveMultirespondentSubmission,
  MultirespondentSubmissionMiddleware.validateMultirespondentSubmissionParams,
  MultirespondentSubmissionMiddleware.createFormsgAndRetrieveForm,
  MultirespondentSubmissionMiddleware.scanAndRetrieveAttachments,
  MultirespondentSubmissionMiddleware.validateMultirespondentSubmission,
  MultirespondentSubmissionMiddleware.encryptSubmission,
  submitMultirespondentForm,
] as ControllerHandler[]

export const handleUpdateMultirespondentSubmission = [
  CaptchaMiddleware.validateCaptchaParams,
  TurnstileMiddleware.validateTurnstileParams,
  ReceiverMiddleware.receiveMultirespondentSubmission,
  MultirespondentSubmissionMiddleware.validateUpdateMultirespondentSubmissionParams,
  MultirespondentSubmissionMiddleware.createFormsgAndRetrieveForm,
  MultirespondentSubmissionMiddleware.scanAndRetrieveAttachments,
  MultirespondentSubmissionMiddleware.validateMultirespondentSubmission,
  MultirespondentSubmissionMiddleware.setCurrentWorkflowStep,
  MultirespondentSubmissionMiddleware.encryptSubmission,
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
  MultirespondentSubmissionDto | ErrorDto
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
      //Step 2: Check whether form is archived.
      .andThen((form) => assertFormAvailable(form).map(() => form))
      // Step 3: Check whether form is multirespondent mode.
      .andThen(checkFormIsMultirespondent)
      // Step 4: Is multirespondent mode form, retrieve submission data.
      .andThen((form) =>
        getEncryptedSubmissionData(form.responseMode, formId, submissionId),
      )
      // Step 6: Retrieve presigned URLs for attachments.
      .andThen((submissionData) => {
        if (submissionData.submissionType !== SubmissionType.Multirespondent) {
          return errAsync(new InvalidSubmissionTypeError())
        }

        // Remaining login duration in seconds.
        const urlExpiry = (req.session?.cookie.maxAge ?? 0) / 1000
        return transformAttachmentMetasToSignedUrls(
          submissionData.attachmentMetadata,
          urlExpiry,
        ).map((presignedUrls) =>
          createMultirespondentSubmissionDto(submissionData, presignedUrls),
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
