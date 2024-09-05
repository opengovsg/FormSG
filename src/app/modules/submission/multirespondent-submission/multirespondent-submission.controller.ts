import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { MailSendError } from 'src/app/services/mail/mail.errors'
import { EncryptSubmissionDto } from 'src/types/api'

import {
  ErrorDto,
  FieldResponsesV3,
  FormAuthType,
  MultirespondentSubmissionDto,
  SubmissionType,
} from '../../../../../shared/types'
import { getMultirespondentSubmissionEditPath } from '../../../../../shared/utils/urls'
import {
  Environment,
  IPopulatedMultirespondentForm,
} from '../../../../../src/types'
// TODO: (MRF-email-notif) Remove isTest import when MRF email notifications is out of beta
import config, { isTest } from '../../../config/config'
import {
  createLoggerWithLabel,
  CustomLoggerParams,
} from '../../../config/logger'
import { getMultirespondentSubmissionModel } from '../../../models/submission.server.model'
import * as CaptchaMiddleware from '../../../services/captcha/captcha.middleware'
import MailService from '../../../services/mail/mail.service'
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
  InvalidWorkflowTypeError,
  SubmissionFailedError,
} from '../submission.errors'
import {
  getEncryptedSubmissionData,
  transformAttachmentMetasToSignedUrls,
  uploadAttachments,
} from '../submission.service'
import { mapRouteError } from '../submission.utils'
import { reportSubmissionResponseTime } from '../submissions.statsd-client'

import * as MultirespondentSubmissionMiddleware from './multirespondent-submission.middleware'
import {
  checkFormIsMultirespondent,
  checkIsFormApproval,
  checkIsStepRejected,
  sendMrfOutcomeEmails,
} from './multirespondent-submission.service'
import {
  MultirespondentSubmissionContent,
  SubmitMultirespondentFormHandlerRequest,
  SubmitMultirespondentFormHandlerType,
  UpdateMultirespondentSubmissionHandlerRequest,
  UpdateMultirespondentSubmissionHandlerType,
} from './multirespondent-submission.types'
import {
  createMultirespondentSubmissionDto,
  retrieveWorkflowStepEmailAddresses,
} from './multirespondent-submission.utils'

const logger = createLoggerWithLabel(module)
const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)
const appUrl =
  process.env.NODE_ENV === Environment.Dev
    ? config.app.feAppUrl
    : config.app.appUrl

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

  // Save Responses to Database
  const encryptedPayload = req.formsg.encryptedPayload
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

  // Create Incoming Submission
  const {
    submissionPublicKey,
    encryptedSubmissionSecretKey,
    submissionSecretKey,
    encryptedContent,
    responseMetadata,
    version,
    mrfVersion,
  } = encryptedPayload

  const submissionContent: MultirespondentSubmissionContent = {
    form: form._id,
    authType: form.authType,
    myInfoFields: form.getUniqueMyInfoAttrs(),
    form_fields: form.form_fields,
    form_logics: form.form_logics,
    workflow: form.workflow,
    submissionPublicKey,
    encryptedSubmissionSecretKey,
    encryptedContent,
    attachmentMetadata,
    version,
    workflowStep: 0,
    mrfVersion,
  }

  return _createSubmission({
    req,
    res,
    logMeta,
    formId,
    responses: encryptedPayload.responses,
    responseMetadata,
    submissionContent,
    submissionSecretKey,
    form,
  })
}

export const submitMultirespondentFormForTest = submitMultirespondentForm

const _createSubmission = async ({
  req,
  res,
  logMeta,
  formId,
  responses,
  responseMetadata,
  submissionContent,
  submissionSecretKey,
  form,
}: {
  req: Parameters<SubmitMultirespondentFormHandlerType>[0]
  res: Parameters<SubmitMultirespondentFormHandlerType>[1]
  responseMetadata: EncryptSubmissionDto['responseMetadata']
  responses: FieldResponsesV3
  formId: string
  submissionContent: MultirespondentSubmissionContent
  logMeta: CustomLoggerParams['meta']
  form: IPopulatedMultirespondentForm
  submissionSecretKey: string
}) => {
  const submission = new MultirespondentSubmission(submissionContent)

  try {
    await submission.save()
  } catch (err) {
    logger.error({
      message: 'Multirespondent submission save error',
      meta: {
        action: 'onMultirespondentSubmissionFailure',
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
      mode: 'multirespodent',
      payment: 'false',
    })
  }

  // Send success back to client
  res.json({
    message: 'Form submission successful.',
    submissionId,
    timestamp: (submission.created || new Date()).getTime(),
  })

  // TODO(MRF/FRM-1591): Add post-submission actions handling
  // return await performEncryptPostSubmissionActions(submission, responses)

  const currentStepNumber = submissionContent.workflowStep

  try {
    await sendNextStepEmail({
      nextStepNumber: currentStepNumber + 1, // we want to send emails to the addresses linked to the next step of the workflow
      form,
      formTitle: form.title,
      responseUrl: `${appUrl}/${getMultirespondentSubmissionEditPath(
        form._id,
        submissionId,
        { key: submissionSecretKey },
      )}`,
      formId: form._id,
      submissionId,
      responses,
    })
  } catch (err) {
    logger.error({
      message: 'Send multirespondent workflow email error',
      meta: {
        ...logMeta,
        ...createReqMeta(req),
        currentWorkflowStep: currentStepNumber,
        formId: form._id,
        submissionId,
      },
      error: err,
    })
  }

  // TODO: (MRF-email-notif) Remove isTest and betaFlag check when MRF email notifications is out of beta
  if (isTest || form.admin.betaFlags.mrfEmailNotifications) {
    try {
      await sendMrfOutcomeEmails({
        currentStepNumber,
        form,
        responses,
        submissionId,
      })
    } catch (err) {
      logger.error({
        message: 'Send mrf outcome email error',
        meta: {
          ...logMeta,
          ...createReqMeta(req),
          currentWorkflowStep: currentStepNumber,
          formId: form._id,
          submissionId,
        },
        error: err,
      })
    }
  }
}

const sendNextStepEmail = ({
  nextStepNumber,
  form,
  formTitle,
  responseUrl,
  formId,
  submissionId,
  responses,
}: {
  nextStepNumber: number
  form: IPopulatedMultirespondentForm
  formTitle: string
  responseUrl: string
  formId: string
  submissionId: string
  responses: FieldResponsesV3
}): ResultAsync<true, InvalidWorkflowTypeError | MailSendError> => {
  const logMeta = {
    action: 'sendNextStepEmail',
    formId,
    submissionId,
    nextWorkflowStep: nextStepNumber,
  }

  const nextStep = form.workflow[nextStepNumber]
  if (!nextStep) {
    return okAsync(true)
  }

  return (
    // Step 1: Retrieve email addresses for current workflow step
    retrieveWorkflowStepEmailAddresses(nextStep, responses)
      .mapErr((error) => {
        logger.error({
          message: 'Failed to retrieve workflow step email addresses',
          meta: logMeta,
          error,
        })
        return error
      })
      // Step 2: send out next workflow step email
      .asyncAndThen((emails) => {
        if (!emails) return okAsync(true)
        return MailService.sendMRFWorkflowStepEmail({
          emails,
          formTitle,
          responseId: submissionId,
          responseUrl,
        }).orElse((error) => {
          logger.error({
            message: 'Failed to send workflow email',
            meta: { ...logMeta, emails },
            error,
          })
          return errAsync(error)
        })
      })
  )
}

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

  // Create Incoming Submission
  const {
    responseMetadata,
    submissionPublicKey,
    encryptedSubmissionSecretKey,
    encryptedContent,
    submissionSecretKey,
    version,
    workflowStep,
    responses,
    mrfVersion,
  } = encryptedPayload

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

  const submission = await MultirespondentSubmission.findById(submissionId)
  if (!submission) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'Not found',
    })
  }

  submission.responseMetadata = responseMetadata
  submission.submissionPublicKey = submissionPublicKey
  submission.encryptedSubmissionSecretKey = encryptedSubmissionSecretKey
  submission.encryptedContent = encryptedContent
  submission.version = version
  submission.workflowStep = workflowStep
  submission.attachmentMetadata = attachmentMetadata
  submission.mrfVersion = mrfVersion

  try {
    await submission.save()
  } catch (err) {
    logger.error({
      message: 'Multirespondent submission save error',
      meta: {
        action: 'onMultirespondentSubmissionFailure',
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

  const checkIsStepRejectedResult = checkIsStepRejected({
    zeroIndexedStepNumber: workflowStep,
    form,
    responses,
  })

  if (checkIsStepRejectedResult.isErr()) {
    // throw some error
    return
  }

  const isStepRejected = checkIsStepRejectedResult.value
  if (isStepRejected) {
    return await sendMrfOutcomeEmails({
      currentStepNumber: workflowStep,
      form,
      responses,
      submissionId,
      isApproval: true,
      isRejected: true,
    })
  }

  try {
    await sendNextStepEmail({
      nextStepNumber: workflowStep + 1,
      form,
      formTitle: form.title,
      responseUrl: `${appUrl}/${getMultirespondentSubmissionEditPath(
        form._id,
        submissionId,
        { key: submissionSecretKey },
      )}`,
      formId: form._id,
      submissionId,
      responses,
    })
  } catch (err) {
    logger.error({
      message: 'Send multirespondent workflow email error',
      meta: {
        ...logMeta,
        ...createReqMeta(req),
        currentWorkflowStep: workflowStep,
        formId: form._id,
        submissionId,
      },
      error: err,
    })
  }

  // TODO: (MRF-email-notif) Remove isTest and betaFlag check when MRF email notifications is out of beta
  if (isTest || form.admin.betaFlags.mrfEmailNotifications) {
    try {
      await sendMrfOutcomeEmails({
        currentStepNumber: workflowStep,
        form,
        responses,
        submissionId,
        isApproval: checkIsFormApproval(form),
      })
    } catch (err) {
      logger.error({
        message: 'Send mrf outcome email error',
        meta: {
          ...logMeta,
          ...createReqMeta(req),
          currentWorkflowStep: workflowStep,
          formId: form._id,
          submissionId,
        },
        error: err,
      })
    }
  }
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
