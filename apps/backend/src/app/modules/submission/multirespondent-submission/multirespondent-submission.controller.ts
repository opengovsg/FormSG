import { celebrate, Joi, Segments } from 'celebrate'
import { randomBytes } from 'crypto'
import { Request } from 'express'
import { AuthedSessionData } from 'express-session'
import { featureFlags } from 'formsg-shared/constants'
import {
  ErrorCode,
  ErrorDto,
  FormAuthType,
  FormFieldDto,
  FormResponseMode,
  MrfStepAuthRedirectRequestDto,
  MrfStepAuthRequestDto,
  MrfStepAuthSessionDto,
  PaymentChannel,
  PaymentType,
  PublicFormAuthLogoutDto,
  PublicFormAuthRedirectDto,
  PublicMultirespondentSubmissionDto,
  SubmissionType,
} from 'formsg-shared/types'
import { stripDropdownFieldOptionsToRecipientsMap } from 'formsg-shared/utils/strip-dropdown-field-optionsToRecipientsMap'
import { getMultirespondentSubmissionEditPath } from 'formsg-shared/utils/urls'
import { StatusCodes } from 'http-status-codes'
import mongoose, { FlattenMaps } from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import Stripe from 'stripe'

import {
  Environment,
  IFieldSchema,
  IPopulatedMultirespondentForm,
} from '../../../../types'
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
import * as BillingService from '../../billing/billing.service'
import { ControllerHandler } from '../../core/core.types'
import { setFormTags } from '../../datadog/datadog.utils'
import { updateFormMetadata } from '../../form/admin-form/admin-form.service'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import { assertFormAvailable } from '../../form/admin-form/admin-form.utils'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
  FormInvalidResponseModeError,
} from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import { MYINFO_FAPI_SESSION_COOKIE_NAME } from '../../myinfo/fapi/myinfo.fapi.constants'
import {
  clearMyInfoFapiSessionCookie,
  setMyInfoFapiSessionCookie,
} from '../../myinfo/fapi/myinfo.fapi.controller'
import {
  MyInfoFapiIncompleteLoginError,
  MyInfoFapiSessionFormMismatchError,
} from '../../myinfo/fapi/myinfo.fapi.errors'
import * as MyInfoFapiService from '../../myinfo/fapi/myinfo.fapi.service'
import { MyInfoService } from '../../myinfo/myinfo.service'
import { shouldFetchSponsoredChildren } from '../../myinfo/myinfo.util'
import { MissingJwtError } from '../../spcp/spcp.errors'
import { getOidcService } from '../../spcp/spcp.oidc.service'
import { getRedirectTargetSpcpOidc } from '../../spcp/spcp.util'
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
  getMultirespondentSubmission,
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
import {
  checkMrfStepEligibility,
  clearMrfStepAuthCookie,
  getMyInfoAttrsForFields,
  resolveMrfStepAuth,
  setCpStepBindingCookie,
  setMrfStepAuthCookie,
  verifyMrfStepAuthCookie,
} from './step-auth'

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
      verifiedContentPlaintext: req.formsg.verifiedContentPlaintext,
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
      verifiedContentPlaintext: req.formsg.verifiedContentPlaintext,
      paymentId,
      logMeta,
    })
  if (createPendingSubmissionResult.isErr()) {
    const error = createPendingSubmissionResult.error
    // Mirror encrypt mode: a pending-save failure blocks the respondent with
    // a 400 so they can retry, rather than mapRouteError's generic 500.
    if (error instanceof SubmissionSaveError) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          'Could not save pending submission. For assistance, please contact the person who asked you to fill in this form.',
      })
    }
    const { errorMessage, statusCode } = mapRouteError(error)
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
  MultirespondentSubmissionMiddleware.verifyMyInfoHashes,
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
  MultirespondentSubmissionMiddleware.verifyMyInfoHashes,
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

type MrfStepAuthParams = { formId: string; submissionId: string }

const loadPendingStepAuth = (
  req: Pick<Request<MrfStepAuthParams>, 'params' | 'growthbook'>,
  stepToken?: string,
) => {
  const { formId, submissionId } = req.params
  return AuthService.getFormIfPublic(formId)
    .andThen(checkFormIsMultirespondent)
    .andThen((form) => {
      // Lets feature flags (eg mrf-children) target this form.
      void req.growthbook?.setAttributes({
        ...req.growthbook.getAttributes(),
        formId,
        adminEmail: form.admin.email,
      })
      return getMultirespondentSubmission(submissionId).andThen((submission) =>
        resolveMrfStepAuth(form, submission, { stepToken }).map((resolved) => ({
          form,
          resolved,
        })),
      )
    })
}

const mrfStepTokenBody = { stepToken: Joi.string().optional() }

/**
 * Starts the login for the pending step of an MRF submission, using that
 * step's provider and the submission's saved e-service ID.
 * @returns 200 with the provider redirect URL
 * @returns 400 when the step has no login or its login setup is invalid
 * @returns 403 when the step token is invalid
 * @returns 409 when the submission is completed or rejected
 */
export const _handleMrfStepAuthRedirect: ControllerHandler<
  MrfStepAuthParams,
  PublicFormAuthRedirectDto | ErrorDto,
  MrfStepAuthRedirectRequestDto
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const { stepToken, encodedQuery } = req.body
  const logMeta = {
    action: 'handleMrfStepAuthRedirect',
    formId,
    submissionId,
    ...createReqMeta(req),
  }

  return loadPendingStepAuth(req, stepToken)
    .andThen(({ form, resolved: { context, login, stepFields } }) => {
      if (!context || !login) {
        return errAsync(new AuthTypeMismatchError(FormAuthType.NIL))
      }
      if (context.authType === FormAuthType.MyInfo) {
        // Fail closed: without a growthbook instance, only birth records are fetched.
        const isMrfChildrenEnabled =
          req.growthbook?.isOn(featureFlags.mrfChildren) ?? false
        return MyInfoFapiService.startLogin({
          formId,
          encodedQuery,
          requestedAttributes: getMyInfoAttrsForFields(stepFields),
          includeSponsoredChildren: shouldFetchSponsoredChildren(
            form,
            isMrfChildrenEnabled,
          ),
          mrfContext: context,
        }).map(({ sessionId, redirectUrl }) => {
          setMyInfoFapiSessionCookie(res, sessionId)
          return redirectUrl
        })
      }
      if (!login.esrvcId) {
        return errAsync(new FormAuthNoEsrvcIdError(formId))
      }
      // Always nonce-scoped: the nonce names both the PKCE and binding cookies.
      const nonce = randomBytes(16).toString('hex')
      const oidcService = getOidcService(FormAuthType.CP)
      return oidcService
        .createRedirectUrl(
          getRedirectTargetSpcpOidc(
            formId,
            FormAuthType.CP,
            false,
            encodedQuery,
            nonce,
          ),
          login.esrvcId,
        )
        .map(({ redirectUrl, codeVerifier }) => {
          res.cookie(
            oidcService.getCodeVerifierCookieName(nonce),
            codeVerifier,
            oidcService.getCodeVerifierCookieOptions(),
          )
          setCpStepBindingCookie(res, context, nonce)
          return redirectUrl
        })
    })
    .map((redirectURL) => {
      logger.info({
        message: 'Redirecting MRF step respondent to login page',
        meta: logMeta,
      })
      return res.status(StatusCodes.OK).json({ redirectURL })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating MRF step login redirect URL',
        meta: logMeta,
        error,
      })
      return sendRouteError(res, mapRouteError(error))
    })
}

export const handleMrfStepAuthRedirect = [
  celebrate({
    [Segments.BODY]: Joi.object({
      ...mrfStepTokenBody,
      // base64 of the prefill query ID; never contains the state separator '-'
      encodedQuery: Joi.string()
        .base64({ paddingRequired: false })
        .allow('')
        .optional(),
    }),
  }),
  _handleMrfStepAuthRedirect,
] as ControllerHandler[]

/**
 * Returns the pending step's login policy and, once logged in, its session.
 * Completes a MyInfo login bound to this step: prefills this step's fields
 * only and scopes the MyInfo hashes to the consumed login session.
 * @returns 200 with the step's login policy and session
 * @returns 403 when the step token is invalid
 * @returns 409 when the submission is completed or rejected
 */
export const _handleMrfStepAuthSession: ControllerHandler<
  MrfStepAuthParams,
  MrfStepAuthSessionDto | ErrorDto,
  MrfStepAuthRequestDto
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const logMeta = {
    action: 'handleMrfStepAuthSession',
    formId,
    submissionId,
    ...createReqMeta(req),
  }

  const loadResult = await loadPendingStepAuth(req, req.body.stepToken)
  if (loadResult.isErr()) {
    logger.warn({
      message: 'Failed to resolve MRF step login',
      meta: logMeta,
      error: loadResult.error,
    })
    return sendRouteError(res, mapRouteError(loadResult.error))
  }
  const { form, resolved } = loadResult.value
  const { context, login, stepFields, workflowStep } = resolved
  const policy: MrfStepAuthSessionDto = {
    workflowStep,
    authType: login?.authType ?? FormAuthType.NIL,
    isSubmitterIdCollectionEnabled: !!login?.isSubmitterIdCollectionEnabled,
    isWhitelistEnabled: !!login?.whitelist.isWhitelistEnabled,
  }
  if (!context || !login) {
    return res.json(policy)
  }

  // A completed MyInfo login for this step takes precedence over an older one.
  const fapiSessionId: unknown =
    req.signedCookies?.[MYINFO_FAPI_SESSION_COOKIE_NAME]
  if (
    context.authType === FormAuthType.MyInfo &&
    typeof fapiSessionId === 'string' &&
    fapiSessionId
  ) {
    const personResult = await MyInfoFapiService.loadPersonForSession({
      sessionId: fapiSessionId,
      formId,
      mrfContext: context,
    })
    if (personResult.isOk()) {
      clearMyInfoFapiSessionCookie(res)
      const myInfoData = personResult.value
      const uinFin = myInfoData.getUinFin()

      const eligibleResult = await checkMrfStepEligibility(form, login, uinFin)
      if (eligibleResult.isErr()) {
        logger.error({
          message: 'Error validating if MRF step respondent is whitelisted',
          meta: logMeta,
          error: eligibleResult.error,
        })
        return sendRouteError(res, mapRouteError(eligibleResult.error))
      }
      if (!eligibleResult.value) {
        clearMrfStepAuthCookie(res, context)
        return res.json({
          ...policy,
          errorCodes: [ErrorCode.respondentNotWhitelisted],
        })
      }

      const prefillResult = await MyInfoService.prefillAndSaveMyInfoFields(
        formId,
        myInfoData,
        stepFields as FlattenMaps<IFieldSchema[]>,
        fapiSessionId,
      )
      if (prefillResult.isErr()) {
        logger.error({
          message: 'MyInfo: Failed to prefill and save MRF step fields',
          meta: logMeta,
          error: prefillResult.error,
        })
        clearMrfStepAuthCookie(res, context)
        return res.json({ ...policy, errorCodes: [ErrorCode.myInfo] })
      }

      const billingResult = await BillingService.recordLoginByForm(form, {
        authType: FormAuthType.MyInfo,
      })
      if (billingResult.isErr()) {
        logger.error({
          message: 'Error while adding MRF step MyInfo login to database',
          meta: logMeta,
          error: billingResult.error,
        })
      }

      setMrfStepAuthCookie(res, {
        ...context,
        userName: uinFin,
        myInfoAuthSessionId: fapiSessionId,
      })
      return res.json({
        ...policy,
        spcpSession: { userName: uinFin },
        prefilledFields: stripDropdownFieldOptionsToRecipientsMap(
          prefillResult.value as FormFieldDto[],
        ),
        myInfoChildrenBirthRecords: myInfoData.getChildrenBirthRecords(
          getMyInfoAttrsForFields(stepFields),
        ),
      })
    }

    const { error } = personResult
    // Another tab's login (other form or step) is left for that tab.
    if (!(error instanceof MyInfoFapiSessionFormMismatchError)) {
      clearMyInfoFapiSessionCookie(res)
    }
    if (
      !(error instanceof MyInfoFapiIncompleteLoginError) &&
      !(error instanceof MyInfoFapiSessionFormMismatchError)
    ) {
      logger.error({
        message: 'MyInfo MRF step login error',
        meta: logMeta,
        error,
      })
      clearMrfStepAuthCookie(res, context)
      return res.json({ ...policy, errorCodes: [ErrorCode.myInfo] })
    }
  } else if (req.cookies?.[MYINFO_FAPI_SESSION_COOKIE_NAME]) {
    // Present but unreadable (e.g. rotated SESSION_SECRET).
    clearMyInfoFapiSessionCookie(res)
  }

  // Already logged in for this step. Prefill stays in the browser; person
  // data is not refetched.
  const cookieResult = verifyMrfStepAuthCookie(req.cookies ?? {}, context)
  if (cookieResult.isErr()) {
    if (!(cookieResult.error instanceof MissingJwtError)) {
      clearMrfStepAuthCookie(res, context)
    }
    return res.json(policy)
  }
  const session = cookieResult.value
  const eligibleResult = await checkMrfStepEligibility(
    form,
    login,
    session.userName,
  )
  if (eligibleResult.isErr()) {
    logger.error({
      message: 'Error validating if MRF step respondent is whitelisted',
      meta: logMeta,
      error: eligibleResult.error,
    })
    return sendRouteError(res, mapRouteError(eligibleResult.error))
  }
  if (!eligibleResult.value) {
    clearMrfStepAuthCookie(res, context)
    return res.json({
      ...policy,
      errorCodes: [ErrorCode.respondentNotWhitelisted],
    })
  }
  return res.json({
    ...policy,
    spcpSession: {
      userName: session.userName,
      iat: session.iat,
      exp: session.exp,
    },
  })
}

export const handleMrfStepAuthSession = [
  celebrate({ [Segments.BODY]: Joi.object(mrfStepTokenBody) }),
  _handleMrfStepAuthSession,
] as ControllerHandler[]

/**
 * Logs out of the pending step of one MRF submission only. A pending MyInfo
 * login is discarded only if it was started for this submission.
 */
export const _handleMrfStepAuthLogout: ControllerHandler<
  MrfStepAuthParams,
  PublicFormAuthLogoutDto
> = async (req, res) => {
  const { formId, submissionId } = req.params
  clearMrfStepAuthCookie(res, { formId, submissionId })

  const fapiSessionId: unknown =
    req.signedCookies?.[MYINFO_FAPI_SESSION_COOKIE_NAME]
  if (typeof fapiSessionId === 'string' && fapiSessionId) {
    const boundResult = await MyInfoFapiService.isSessionBoundToSubmission({
      sessionId: fapiSessionId,
      formId,
      submissionId,
    })
    if (boundResult.isOk() && boundResult.value) {
      clearMyInfoFapiSessionCookie(res)
    }
  }

  return res
    .status(StatusCodes.OK)
    .json({ message: 'Successfully logged out.' })
}

export const handleMrfStepAuthLogout = [
  celebrate({ [Segments.BODY]: Joi.object({}) }),
  _handleMrfStepAuthLogout,
] as ControllerHandler[]
