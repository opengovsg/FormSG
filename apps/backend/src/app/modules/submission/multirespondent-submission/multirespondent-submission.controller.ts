import { AuthedSessionData } from 'express-session'
import { featureFlags } from 'formsg-shared/constants'
import {
  ErrorDto,
  FormResponseMode,
  PaymentChannel,
  PaymentType,
  PublicMultirespondentSubmissionDto,
  SubmissionType,
} from 'formsg-shared/types'
import { getMultirespondentSubmissionEditPath } from 'formsg-shared/utils/urls'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import Stripe from 'stripe'

import { Environment, IPopulatedMultirespondentForm } from '../../../../types'
import { StripePaymentMetadataDto } from '../../../../types/payment'
import config, { isTest } from '../../../config/config'
import { paymentConfig } from '../../../config/features/payment.config'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import {
  createLoggerWithLabel,
  CustomLoggerParams,
} from '../../../config/logger'
import { stripe } from '../../../loaders/stripe'
import getPaymentModel from '../../../models/payment.server.model'
import * as CaptchaMiddleware from '../../../services/captcha/captcha.middleware'
import * as TurnstileMiddleware from '../../../services/turnstile/turnstile.middleware'
import { Pipeline } from '../../../utils/pipeline-middleware'
import { createReqMeta } from '../../../utils/request'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import { setFormTags } from '../../datadog/datadog.utils'
import { updateFormMetadata } from '../../form/admin-form/admin-form.service'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import { assertFormAvailable } from '../../form/admin-form/admin-form.utils'
import { FormInvalidResponseModeError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import * as UserService from '../../user/user.service'
import {
  ensureFormWithinSubmissionLimits,
  ensurePublicForm,
  ensureValidCaptcha,
} from '../encrypt-submission/encrypt-submission.ensures'
import {
  getPaymentAmount,
  getPaymentIntentDescription,
  getStripePaymentMethod,
} from '../encrypt-submission/encrypt-submission.utils'
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
import { mapRouteError, sendRouteError } from '../submission.utils'

import { ensureSubmitterIdIsWhitelisted } from './multirespondent-submission.ensures'
import * as MultirespondentSubmissionMiddleware from './multirespondent-submission.middleware'
import {
  checkFormIsMultirespondent,
  createMultiRespondentFormPendingSubmission,
  createMultiRespondentFormSubmission,
  getPendingStepRecipientEmailsFromSubmittedStepsMeta,
  performMultiRespondentPostSubmissionCreateActions,
  performMultiRespondentPostSubmissionUpdateActions,
  sendNextStepReminderEmail,
  updateMultiRespondentFormSubmission,
} from './multirespondent-submission.service'
import {
  SubmitMultirespondentFormHandlerRequest,
  SubmitMultirespondentFormHandlerType,
  UpdateMultirespondentSubmissionHandlerRequest,
  UpdateMultirespondentSubmissionHandlerType,
} from './multirespondent-submission.types'
import {
  createMrfCookie,
  createPublicMultirespondentSubmissionDto,
  getMrfCookieName,
} from './multirespondent-submission.utils'

const logger = createLoggerWithLabel(module)
const Payment = getPaymentModel(mongoose)

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

  // TODO(MRF-SUBMISSION-LIMIT): Remove this isMrfResponseLimitEnabled check once mrf submission limit is stable.
  const gb = req.growthbook
  const isMrfResponseLimitEnabled =
    isTest || (gb?.isOn(featureFlags.mrfResponseLimit) ?? true)

  const middlewarePipelines = [
    ensurePublicForm,
    ensureValidCaptcha,
    ensureSubmitterIdIsWhitelisted,
  ]
  if (isMrfResponseLimitEnabled) {
    middlewarePipelines.push(ensureFormWithinSubmissionLimits)
  }
  const ensurePipeline = new Pipeline(...middlewarePipelines)

  const hasEnsuredAll = await ensurePipeline.execute({
    form,
    logMeta,
    req,
    res,
  })

  if (!hasEnsuredAll) {
    if (!res.headersSent) {
      return sendRouteError(res, mapRouteError(new SubmissionFailedError()))
    }
    return // required to stop submission processing
  }

  const encryptedPayload = req.formsg.encryptedPayload

  // Handle submissions for payment-enabled (necessarily zero-step) forms:
  // the submission is saved as a pending submission and only promoted to a
  // real submission when the Stripe webhook confirms the payment.
  if (
    form.payments_field?.enabled &&
    form.payments_channel?.channel === PaymentChannel.Stripe
  ) {
    // Kill switch: with the flag off the submission is blocked outright — a
    // payment submission must never fall through to the non-payment path.
    const isMrfPaymentsEnabled = gb?.isOn(featureFlags.mrfPayments) ?? false
    if (!isMrfPaymentsEnabled) {
      logger.warn({
        message:
          'Blocked MRF payment submission: mrf-payments feature flag is off',
        meta: logMeta,
      })
      return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        message:
          'Payments are currently unavailable for this form. Please try again later, or contact the form admin.',
      })
    }
    return _createPaymentSubmission({
      req,
      res,
      form,
      logMeta,
      formId,
    })
  }

  const createMultiRespondentFormSubmissionResult =
    await createMultiRespondentFormSubmission({
      form,
      encryptedPayload,
      logMeta,
      growthbook: req.growthbook,
    })

  if (createMultiRespondentFormSubmissionResult.isErr()) {
    const error = createMultiRespondentFormSubmissionResult.error

    return sendRouteError(res, mapRouteError(error))
  }

  const { submission, snapshot } =
    createMultiRespondentFormSubmissionResult.value

  // Send success back to client
  res.json({
    message: 'Form submission successful.',
    submissionId: submission._id,
    timestamp: (submission.created || new Date()).getTime(),
    mrfStep: submission.workflowStep,
  })

  await performMultiRespondentPostSubmissionCreateActions({
    submission,
    snapshot,
    submissionId: submission._id.toString(),
    form,
    encryptedPayload,
    logMeta,
    attachments: req.formsg.unencryptedAttachments,
    growthbook: req.growthbook,
  })
}

export const submitMultirespondentFormForTest = submitMultirespondentForm

/**
 * Payment path for zero-step multirespondent forms. Mirrors the encrypt-mode
 * flow: create a Payment document and a pending submission, then a Stripe
 * payment intent. Nothing observable (admin views, notifications) happens
 * until the charge.succeeded webhook promotes the pending submission.
 */
const _createPaymentSubmission = async ({
  req,
  res,
  form,
  logMeta,
  formId,
}: {
  req: SubmitMultirespondentFormHandlerRequest
  res: Parameters<SubmitMultirespondentFormHandlerType>[1]
  form: IPopulatedMultirespondentForm
  formId: string
  logMeta: CustomLoggerParams['meta']
}) => {
  const encryptedPayload = req.formsg.encryptedPayload
  const paymentProducts = encryptedPayload.paymentProducts

  const amount = getPaymentAmount(
    form.payments_field,
    encryptedPayload.payments,
    paymentProducts,
  )

  const isPaymentTypeProducts =
    form.payments_field.payment_type === PaymentType.Products

  logger.info({
    message: 'Incoming payments',
    meta: {
      ...logMeta,
      paymentProducts,
      paymentType: form.payments_field.payment_type,
      amount,
    },
  })

  // Step 0: Perform validation checks
  if (!amount) {
    logger.error({
      message: 'Error when creating payment: amount is missing',
      meta: logMeta,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message:
        "The form's payment settings are invalid. Please contact the admin of the form to rectify the issue.",
    })
  }

  const paymentMinAmount =
    form.payments_field.global_min_amount_override ||
    paymentConfig.minPaymentAmountCents

  if (
    amount < paymentMinAmount ||
    amount > paymentConfig.maxPaymentAmountCents
  ) {
    logger.error({
      message: 'Error when creating payment: amount is not within bounds',
      meta: logMeta,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message:
        "The form's payment settings are invalid. Please contact the admin of the form to rectify the issue.",
    })
  }

  const paymentReceiptEmail =
    encryptedPayload.paymentReceiptEmail?.toLowerCase()
  if (!paymentReceiptEmail) {
    logger.error({
      message:
        'Error when creating payment: payment receipt email not provided.',
      meta: logMeta,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({
      message:
        "The form's payment settings are invalid. Please contact the admin of the form to rectify the issue.",
    })
  }

  const targetAccountId = form.payments_channel.target_account_id

  // Step 1: Create payment without payment intent id and pending submission id.
  const payment = new Payment({
    formId,
    targetAccountId,
    amount,
    email: paymentReceiptEmail,
    responses: [],
    ...(isPaymentTypeProducts ? { products: paymentProducts } : {}),
    gstEnabled: form.payments_field.gst_enabled,
    payment_fields_snapshot: form.payments_field,
  })
  const paymentId = payment.id

  // Step 2: Create and save pending submission.
  const createPendingSubmissionResult =
    await createMultiRespondentFormPendingSubmission({
      form,
      encryptedPayload,
      paymentId,
      logMeta,
    })
  if (createPendingSubmissionResult.isErr()) {
    const { errorMessage, statusCode } = mapRouteError(
      createPendingSubmissionResult.error,
    )
    return res.status(statusCode).json({ message: errorMessage })
  }
  const pendingSubmission = createPendingSubmissionResult.value
  const pendingSubmissionId = pendingSubmission.id

  // Step 3: Create the payment intent via API call to stripe.
  const metadata: StripePaymentMetadataDto = {
    env: config.envSiteName,
    formTitle: form.title,
    formId,
    submissionId: pendingSubmissionId,
    paymentId,
    paymentContactEmail: paymentReceiptEmail,
  }

  const createPaymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount,
    currency: paymentConfig.defaultCurrency,
    ...getStripePaymentMethod(form),
    description: getPaymentIntentDescription(form, paymentProducts),
    receipt_email: paymentReceiptEmail,
    metadata,
  }

  let paymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.create(
      createPaymentIntentParams,
      { stripeAccount: targetAccountId },
    )
  } catch (err) {
    logger.error({
      message: 'Error when creating payment intent',
      meta: {
        ...logMeta,
        pendingSubmissionId,
        createPaymentIntentParams,
      },
      error: err,
    })
    // Return a 502 error here since the issue was with Stripe.
    return res.status(StatusCodes.BAD_GATEWAY).json({
      message:
        'There was a problem creating the payment intent. Please try again.',
    })
  }

  const paymentIntentId = paymentIntent.id
  logger.info({
    message: 'Created payment intent from Stripe',
    meta: {
      ...logMeta,
      pendingSubmissionId,
      paymentIntentId,
    },
  })

  // Step 4: Update payment document with payment intent id and pending
  // submission id, and save it.
  payment.paymentIntentId = paymentIntentId
  payment.pendingSubmissionId = pendingSubmissionId
  try {
    await payment.save()
  } catch (err) {
    logger.error({
      message: 'Error updating payment document with payment intent id',
      meta: {
        ...logMeta,
        pendingSubmissionId,
        paymentIntentId,
      },
      error: err,
    })
    // Cancel the payment intent if saving the document fails.
    try {
      await stripe.paymentIntents.cancel(paymentIntent.id, {
        stripeAccount: targetAccountId,
      })
    } catch (stripeErr) {
      logger.error({
        message: 'Failed to cancel Stripe payment intent',
        meta: {
          ...logMeta,
          pendingSubmissionId,
          paymentIntentId,
        },
        error: stripeErr,
      })
    }
    // Regardless of whether the cancellation succeeded or failed, block the
    // submission so that user can try to resubmit
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message:
        'There was a problem updating the payment document. Please try again.',
    })
  }

  logger.info({
    message: 'Saved payment document to DB',
    meta: {
      ...logMeta,
      pendingSubmissionId,
      paymentIntentId,
      paymentId,
    },
  })

  return res.json({
    message: 'Form submission successful',
    submissionId: pendingSubmissionId,
    timestamp: (pendingSubmission.created || new Date()).getTime(),
    paymentData: { paymentId },
  })
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

  const { formDef: currentForm, snapshottedFormDef } = req.formsg

  if (!snapshottedFormDef) {
    return sendRouteError(res, mapRouteError(new SubmissionFailedError()))
  }

  setFormTags(currentForm)

  // TODO(MRF-SUBMISSION-LIMIT): Remove this isMrfResponseLimitEnabled check once mrf submission limit is stable.
  const gb = req.growthbook
  const isMrfResponseLimitEnabled =
    gb?.isOn(featureFlags.mrfResponseLimit) ?? true

  const middlewarePipelines = [ensurePublicForm, ensureValidCaptcha]
  if (isMrfResponseLimitEnabled) {
    middlewarePipelines.push(ensureFormWithinSubmissionLimits)
  }
  const ensurePipeline = new Pipeline(...middlewarePipelines)

  const hasEnsuredAll = await ensurePipeline.execute({
    form: currentForm,
    logMeta,
    req,
    res,
  })

  if (!hasEnsuredAll) {
    if (!res.headersSent) {
      return sendRouteError(res, mapRouteError(new SubmissionFailedError()))
    }
    return // required to stop submission processing
  }

  const encryptedPayload = req.formsg.encryptedPayload

  const updateMultiRespondentFormSubmissionResult =
    await updateMultiRespondentFormSubmission({
      submissionId,
      snapshottedFormDef,
      encryptedPayload,
      logMeta,
      growthbook: req.growthbook,
    })

  if (updateMultiRespondentFormSubmissionResult.isErr()) {
    const error = updateMultiRespondentFormSubmissionResult.error

    if (error instanceof SubmissionSaveError) {
      return sendRouteError(
        res,
        {
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          errorMessage: error.message,
          errorMessageKey:
            'features.publicForm.backendErrors.submission.saveFailed',
        },
        { submissionId },
      )
    }

    return sendRouteError(res, mapRouteError(error))
  }

  const { submission, snapshot } =
    updateMultiRespondentFormSubmissionResult.value

  // Send success back to client
  res.json({
    message: 'Form submission successful.',
    submissionId,
    timestamp: (submission.created || new Date()).getTime(),
    mrfStep: submission.workflowStep,
  })

  const currentStepNumber = submission.workflowStep

  await performMultiRespondentPostSubmissionUpdateActions({
    submission,
    snapshot,
    submissionId,
    snapshottedFormDef,
    currentStepNumber,
    encryptedPayload,
    logMeta,
    attachments: req.formsg.unencryptedAttachments,
    growthbook: req.growthbook,
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
  MultirespondentSubmissionMiddleware.validatePaymentSubmission,
  MultirespondentSubmissionMiddleware.encryptSubmission,
  MultirespondentSubmissionMiddleware.handleNdiResponses,
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
  MultirespondentSubmissionMiddleware.handleNdiResponses,
  updateMultirespondentSubmission,
] as ControllerHandler[]

/**
 * Handler for GET /forms/:formId/submissions/:submissionId
 * @returns 200 with encrypted submission data response
 * @returns 400 when form is not an multirespondent mode form
 * @returns 404 when submissionId cannot be found in the database
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 500 when any errors occurs in database query, generating signed URL or retrieving payment data
 */
export const handleGetMultirespondentSubmissionForRespondent: ControllerHandler<
  { formId: string; submissionId: string },
  PublicMultirespondentSubmissionDto | ErrorDto
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
          createPublicMultirespondentSubmissionDto(
            submissionData,
            presignedUrls,
          ),
        )
      })
      .map((responseData) => {
        logger.info({
          message: 'Get encrypted response using submissionId success',
          meta: logMeta,
        })

        // Set MRF cookie with submission details when loading the form
        const mrfCookie = createMrfCookie({
          prevSubmissionId: submissionId,
          currentWorkflowStep: responseData.workflowStep + 1,
        })

        res.cookie(
          getMrfCookieName({ formId, previousSubmissionId: submissionId }),
          mrfCookie,
          {
            maxAge: spcpMyInfoConfig.spCookieMaxAge,
            httpOnly: true,
            sameSite: 'strict', // strict because it is set by form.gov.sg and use on form.gov.sg only
            secure: !config.isDevOrTest,
          },
        )

        return res.json(responseData)
      })
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving encrypted submission response',
          meta: logMeta,
          error,
        })

        return sendRouteError(res, mapRouteError(error))
      })
  )
}

const sendPendingMrfSubmissionReminder: ControllerHandler<
  { formId: string; submissionId: string },
  unknown,
  { submissionSecretKey: string; stepToken?: string }
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const { submissionSecretKey, stepToken } = req.body
  const authedUserId = (req.session as AuthedSessionData).user._id

  const logMeta = {
    action: 'sendPendingMrfSubmissionReminder',
    formId,
    submissionId,
    ...createReqMeta(req),
  }

  return UserService.findUserById(authedUserId)
    .andThen((user) => {
      return AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Read,
      }).map((form) => ({ form, user }))
    })
    .andThen(({ form, user }) => {
      if (form.responseMode !== FormResponseMode.Multirespondent) {
        return errAsync(
          new FormInvalidResponseModeError(
            'Cannot send reminder emails for pending step for non-multirespondent mode forms',
          ),
        )
      }
      return getPendingStepRecipientEmailsFromSubmittedStepsMeta({
        submissionId,
      }).map(({ recipientEmails, reminderStepNumber }) => ({
        recipientEmails,
        reminderStepNumber,
        form,
        user,
      }))
    })
    .andThen(({ recipientEmails, reminderStepNumber, form, user }) => {
      return okAsync({
        recipientEmails,
        reminderStepNumber,
        form,
        user,
      })
    })
    .andThen(({ recipientEmails, reminderStepNumber, form, user }) => {
      return sendNextStepReminderEmail({
        senderEmail: user.email,
        submissionId,
        emails: recipientEmails,
        responseUrl: `${appUrl}/${getMultirespondentSubmissionEditPath(
          form._id,
          submissionId,
          { key: submissionSecretKey, stepToken },
        )}`,
        formTitle: form.title,
        formId,
        reminderStepNumber,
      }).map((sendNextStepReminderEmailResult) => ({
        sendNextStepReminderEmailResult,
        form,
      }))
    })
    .map(({ form }) => {
      logger.info({
        message: 'Reminder sent successfully',
        meta: logMeta,
      })
      res.json({
        message: `Reminder sent successfully.`,
        submissionId: submissionId,
      })

      updateFormMetadata(form, {
        ...form.metadata,
        num_mrf_reminder_emails_sent:
          (form.metadata?.num_mrf_reminder_emails_sent ?? 0) + 1,
      })
      return
    })
    .mapErr((err) => {
      return sendRouteError(res, mapRouteError(err))
    })
}

export const sendPendingMrfSubmissionReminderForTest =
  sendPendingMrfSubmissionReminder

/**
 * Handler for GET /:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/remind
 * @security session
 *
 * @returns 200 with feedback response
 * @returns 400 when multirespondent submission workflow step is invalid
 * @returns 403 when user does not have permissions to read form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when encountering database error
 */
export const handlePendingMrfSubmissionRemind = [
  MultirespondentSubmissionMiddleware.validateMultirespondentRemindBody,
  sendPendingMrfSubmissionReminder,
] as ControllerHandler[]
