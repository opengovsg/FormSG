import { StatusCodes } from 'http-status-codes'
import { ResultAsync } from 'neverthrow'

import { featureFlags } from '../../../../shared/constants'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import { checkFormIsEncryptMode } from '../submission/encrypt-submission/encrypt-submission.service'
import * as UserService from '../user/user.service'

import * as PaymentProofService from './payment-proof.service'
import * as PaymentService from './payments.service'

const logger = createLoggerWithLabel(module)
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
}> = async (req, res) => {
  const { formId, paymentId } = req.params
  const logMeta = {
    action: 'downloadPaymentInvoice',
    formId,
    paymentId,
  }
  logger.info({
    message: 'downloadPaymentInvoice endpoint called',
    meta: logMeta,
  })

  return ResultAsync.combine([
    PaymentService.findPaymentById(paymentId),
    FormService.retrieveFullFormById(formId).andThen(checkFormIsEncryptMode),
  ])
    .map(async ([payment, populatedForm]) => {
      // TODO [PDF-LAMBDA-GENERATION]: Remove setting of Growthbook targetting once pdf generation rollout is complete
      await UserService.getPopulatedUserById(populatedForm.admin).map(
        async (admin) => {
          await req.growthbook?.setAttributes({
            ...logMeta,
            formId,
            adminEmail: admin.email,
            adminAgency: admin.agency,
            isDownloadPaymentInvoice: true,
          })
        },
      )
      const isUseLambdaOutput =
        req.growthbook?.isOn(featureFlags.lambdaPdfGeneration) ?? false
      logger.info({
        message: 'Growthbook flag for lambda pdf generation',
        meta: {
          ...logMeta,
          isUseLambdaOutput,
          growthbookAttributes: req.growthbook?.getAttributes(),
          lambdaPdfGenerationGrowthbookValue: req.growthbook?.getFeatureValue(
            featureFlags.lambdaPdfGeneration,
            undefined,
          ),
        },
      })

      return {
        payment,
        populatedForm,
        isUseLambdaOutput,
      }
    })
    .andThen(({ payment, populatedForm, isUseLambdaOutput }) => {
      logger.info({
        message: 'Found paymentId in payment document',
        meta: {
          action: 'downloadPaymentInvoice',
          payment,
        },
      })

      return PaymentProofService.generatePaymentInvoiceUrl(
        payment,
        populatedForm,
        isUseLambdaOutput,
      )
    })
    .map((pdfUrl) => {
      logger.info({
        message: `received generated payment invoice url, redirecting to ${pdfUrl}`,
        meta: {
          action: 'downloadPaymentInvoice',
          formId,
          paymentId,
        },
      })
      return res.redirect(pdfUrl)
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
