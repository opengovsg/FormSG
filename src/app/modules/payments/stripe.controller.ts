import axios from 'axios'
import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { errAsync, ResultAsync } from 'neverthrow'

import { IPopulatedForm } from 'src/types'

import { ErrorDto, GetPaymentInfoDto } from '../../../../shared/types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { stripe } from '../../loaders/stripe'
import { generatePdfFromHtml } from '../../utils/convert-html-to-pdf'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import * as PendingSubmissionModel from '../pending-submission/pending-submission.service'
import { checkFormIsEncryptMode } from '../submission/encrypt-submission/encrypt-submission.service'

import { PaymentAccountInformationError } from './payments.errors'
import * as PaymentService from './payments.service'
import { StripeFetchError } from './stripe.errors'
import * as StripeService from './stripe.service'
import { convertToInvoiceFormat, mapRouteError } from './stripe.utils'

const logger = createLoggerWithLabel(module)

export const checkPaymentReceiptStatus: ControllerHandler<{
  formId: string
  paymentId: string
}> = async (req, res) => {
  const { formId, paymentId } = req.params
  logger.info({
    message: 'getPaymentStatus endpoint called',
    meta: {
      action: 'getPaymentStatus',
      formId,
      paymentId,
    },
  })

  return PaymentService.findPaymentById(paymentId)
    .map((payment) => {
      logger.info({
        message: 'Found paymentId in payment document',
        meta: {
          action: 'checkPaymentReceiptStatus',
          payment,
        },
      })

      if (!payment.completedPayment?.receiptUrl) {
        return res.status(StatusCodes.NOT_FOUND).json({ isReady: false })
      }
      return res.status(StatusCodes.OK).json({ isReady: true })
    })
    .mapErr((error) => {
      return res.status(StatusCodes.NOT_FOUND).json({ message: error })
    })
}

/**
 * Handler for GET /api/v3/payments/:formId/:paymentId/invoice/download
 * Receives Stripe webhooks and updates the database with transaction details.
 *
 * @returns 200 if webhook is successfully processed
 * @returns 404 if the PaymentId is not found
 * @returns 404 if the FormId is not found
 * @returns 404 if payment.completedPayment?.receiptUrl is not found
 */
export const downloadPaymentInvoice: ControllerHandler<{
  formId: string
  paymentId: string
}> = (req, res) => {
  const { formId, paymentId } = req.params
  logger.info({
    message: 'downloadPaymentInvoice endpoint called',
    meta: {
      action: 'downloadPaymentInvoice',
      formId,
      paymentId,
    },
  })

  return ResultAsync.combine([
    PaymentService.findPaymentById(paymentId),
    FormService.retrieveFullFormById(formId).andThen(checkFormIsEncryptMode),
  ])
    .map(([payment, populatedForm]) => {
      logger.info({
        message: 'Found paymentId in payment document',
        meta: {
          action: 'downloadPaymentInvoice',
          payment,
        },
      })
      if (!payment.completedPayment?.receiptUrl) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .send({ message: 'Receipt url not ready' })
      }
      // retrieve receiptURL as html
      return (
        axios
          .get<string>(payment.completedPayment.receiptUrl)
          // convert to pdf and return
          .then((receiptUrlResponse) => {
            const html = receiptUrlResponse.data
            const agencyBusinessInfo = (populatedForm as IPopulatedForm).admin
              .agency.business
            const formBusinessInfo = populatedForm.business

            const businessAddress = [
              formBusinessInfo?.address,
              agencyBusinessInfo?.address,
            ].find(Boolean)

            const businessGstRegNo = [
              formBusinessInfo?.gstRegNo,
              agencyBusinessInfo?.gstRegNo,
            ].find(Boolean)

            // we will still continute the invoice generation even if there's no address/gstregno
            if (!businessAddress || !businessGstRegNo)
              logger.warn({
                message:
                  'Some business info not available during invoice generation. Expecting either agency or form to have business info',
                meta: {
                  action: 'downloadPaymentInvoice',
                  payment,
                  agencyName: populatedForm.admin.agency.fullName,
                  agencyBusinessInfo,
                  formBusinessInfo,
                },
              })
            const invoiceHtml = convertToInvoiceFormat(html, {
              address: businessAddress || '',
              gstRegNo: businessGstRegNo || '',
              formTitle: populatedForm.title,
              submissionId: payment.completedPayment?.submissionId || '',
            })

            const pdfBufferPromise = generatePdfFromHtml(invoiceHtml)
            return pdfBufferPromise
          })
          .then((pdfBuffer) => {
            res.set({
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=${paymentId}-invoice.pdf`,
            })
            return res.status(StatusCodes.OK).send(pdfBuffer)
          })
      )
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error retrieving invoice',
        meta: {
          action: 'downloadPaymentInvoice',
          formId,
          paymentId,
        },
        error,
      })
      return res.status(StatusCodes.NOT_FOUND).json({ message: error })
    })
}

/**
 * Handler for GET /api/v3/payments/:formId/:paymentId/invoice/download
 * Receives Stripe webhooks and updates the database with transaction details.
 *
 * @returns 200 if webhook is successfully processed
 * @returns 404 if the PaymentId is not found
 * @returns 404 if the FormId is not found
 * @returns 404 if payment.completedPayment?.receiptUrl is not found
 */
export const downloadPaymentReceipt: ControllerHandler<{
  formId: string
  paymentId: string
}> = (req, res) => {
  const { formId, paymentId } = req.params
  logger.info({
    message: 'downloadPaymentReceipt endpoint called',
    meta: {
      action: 'downloadPaymentReceipt',
      formId,
      paymentId,
    },
  })

  return PaymentService.findPaymentById(paymentId)
    .map((payment) => {
      logger.info({
        message: 'Found paymentId in payment document',
        meta: {
          action: 'downloadPaymentReceipt',
          payment,
        },
      })
      if (!payment.completedPayment?.receiptUrl) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .send({ message: 'Receipt url not ready' })
      }
      // retrieve receiptURL as html
      return (
        axios
          .get<string>(payment.completedPayment.receiptUrl)
          // convert to pdf and return
          .then((receiptUrlResponse) => {
            const html = receiptUrlResponse.data
            const pdfBufferPromise = generatePdfFromHtml(html)
            return pdfBufferPromise
          })
          .then((pdfBuffer) => {
            res.set({
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=${paymentId}-receipt.pdf`,
            })
            return res.status(StatusCodes.OK).send(pdfBuffer)
          })
      )
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error retrieving receipt',
        meta: {
          action: 'downloadPaymentReceipt',
          formId,
          paymentId,
        },
        error,
      })
      return res.status(StatusCodes.NOT_FOUND).json({ message: error })
    })
}

const _handleConnectOauthCallback: ControllerHandler<
  unknown,
  unknown,
  unknown,
  { code: string; state: string }
> = async (req, res) => {
  const { code, state } = req.query

  // Step 0: Extract state parameter previously signed and stored in cookies.
  // Compare state values to ensure that no tampering has occurred.
  const { stripeState } = req.signedCookies
  if (state !== stripeState) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      message: 'Invalid state parameter',
    })
  }

  // Step 1: Retrieve formId from state.
  const formId = state.split('.')[0]
  const redirectUrl = `${config.app.appUrl}/admin/form/${formId}/settings/payments`
  // Step 2: Retrieve currently logged in user.
  return (
    FormService.retrieveFullFormById(formId)
      .andThen(checkFormIsEncryptMode)
      .andThen((form) =>
        StripeService.exchangeCodeForAccessToken(code).andThen((token) => {
          // Step 4: Store access token in form.
          return StripeService.linkStripeAccountToForm(form, {
            accountId: token.stripe_user_id,
            publishableKey: token.stripe_publishable_key,
          })
        }),
      )
      .map(() => {
        // Step 5: Redirect back to settings page.
        return res.redirect(redirectUrl)
      })
      // Also redirect back to settings page if there is an error.
      .mapErr((error) => {
        logger.error({
          message: 'Error handling stripe oauth callback',
          meta: {
            action: 'handleConnectOauthCallback',
            ...createReqMeta(req),
          },
          error,
        })
        return res.redirect(redirectUrl)
      })
  )
}

export const handleConnectOauthCallback = [
  celebrate({
    [Segments.QUERY]: Joi.object({
      code: Joi.string().required(),
      state: Joi.string().required(),
    }).unknown(true),
  }),
  _handleConnectOauthCallback,
] as ControllerHandler[]

export const getPaymentInfo: ControllerHandler<
  { paymentId: string },
  GetPaymentInfoDto | ErrorDto
> = async (req, res) => {
  const { paymentId } = req.params

  const logMeta = {
    action: 'getPaymentInfo',
    paymentId,
  }

  logger.info({
    message: 'getPaymentInfo endpoint called',
    meta: logMeta,
  })

  return PaymentService.findPaymentById(paymentId)
    .andThen((payment) => {
      return PendingSubmissionModel.findPendingSubmissionById(
        payment.pendingSubmissionId,
      )
        .andThen((submission) =>
          FormService.retrieveFullFormById(submission.form),
        )
        .andThen(checkFormIsEncryptMode) // Payment forms are encrypted
        .andThen((form) => {
          const stripeAccount = payment.targetAccountId
          // Early termination to prevent consumption of QPS limit to stripe
          if (stripeAccount !== form.payments_channel.target_account_id) {
            logger.error({
              message:
                'Target stripe account for this form has changed, unable to get payment info',
              meta: logMeta,
            })
            return errAsync(new PaymentAccountInformationError())
          }

          const paymentIntentId = payment.paymentIntentId
          return ResultAsync.fromPromise(
            stripe.paymentIntents.retrieve(paymentIntentId, {
              stripeAccount,
            }),
            (error) => {
              logger.error({
                message: 'Calling stripe.paymentIntents.retrieve failed',
                meta: {
                  ...logMeta,
                  paymentIntentId,
                  error,
                },
              })
              return new StripeFetchError(String(error))
            },
          ).map((paymentIntent) => {
            return res.status(StatusCodes.OK).json({
              client_secret: paymentIntent.client_secret || '',
              publishableKey: form.payments_channel.publishable_key,
              payment_intent_id: payment.paymentIntentId,
              submissionId: payment.pendingSubmissionId,
            })
          })
        })
    })
    .mapErr((error) => {
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
