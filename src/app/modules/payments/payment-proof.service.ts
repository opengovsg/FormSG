import axios from 'axios'
import { errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import Stripe from 'stripe'

import {
  ICompletedPaymentSchema,
  IPaymentSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm,
} from '../../../types'
import { aws as AwsConfig } from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { dayInSeconds } from '../../constants/time'
import { stripe } from '../../loaders/stripe'
import { generatePdfFromHtml } from '../../utils/convert-html-to-pdf'

import { getPaymentProofS3ObjectPath } from './payment-proof.utils'
import {
  PaymentProofPresignS3Error,
  PaymentProofUploadS3Error,
} from './payments.errors'
import { StripeFetchError } from './stripe.errors'
import { convertToProofOfPaymentFormat } from './stripe.utils'

const logger = createLoggerWithLabel(module)
export const checkStripeReceiptIsReady = (
  payment: IPaymentSchema,
): ResultAsync<ICompletedPaymentSchema, StripeFetchError> => {
  if (!payment.completedPayment?.receiptUrl) {
    return errAsync(new StripeFetchError('Receipt url not ready'))
  }
  return okAsync(payment as ICompletedPaymentSchema)
}

/**
 * Function that stores payment proof into s3
 *
 * @param {IPaymentSchema} payment the payment object, used to form the object path
 * @param {Buffer} pdfBuffer the pdf to store into s3
 *
 * @returns ok(undefined) if no errors are thrown while uploading to s3
 * @returns err(InvoiceUploadS3Error) if an error is thrown while uploading to s3
 */
const _storePaymentProofInS3 = (
  payment: ICompletedPaymentSchema,
  pdfBuffer: Buffer,
): ResultAsync<true, PaymentProofUploadS3Error> => {
  const objectPath = getPaymentProofS3ObjectPath(payment)

  logger.info({
    message: 'Uploading payment proof to s3',
    meta: {
      action: '_storePaymentProofInS3',
      paymentId: payment._id,
      objectPath,
      bucket: AwsConfig.paymentProofS3Bucket,
    },
  })

  return ResultAsync.fromPromise(
    AwsConfig.s3
      .upload({
        Bucket: AwsConfig.paymentProofS3Bucket,
        Key: objectPath,
        Body: Buffer.from(pdfBuffer),
      })
      .promise(),
    (error) => {
      logger.error({
        message: 'Error occured whilst uploading pdfBuffer to S3',
        meta: {
          action: 'storePaymentProofInS3',
          paymentId: payment._id,
          objectPath,
        },
        error,
      })
      return new PaymentProofUploadS3Error()
    },
  )
    .map(() => {
      payment.completedPayment = {
        ...payment.completedPayment,
        hasReceiptStoredInS3: true,
      }

      return ResultAsync.fromPromise(payment.save(), (error) => {
        logger.error({
          message: 'Error occured whilst updating payment',
          meta: {
            action: 'storePaymentProofInS3',
            paymentId: payment._id,
            objectPath,
          },
          error,
        })
        return new PaymentProofUploadS3Error()
      })
    })
    .map(() => {
      return true
    })
}

/**
 * Function to generates a presigned url for payment proof stored in s3
 * Presigned link expires in 30 days
 *
 * @param {IPaymentSchema} payment the payment object, used to form the object path
 *
 * @returns ok(string) which represents the presigned url if no errors are thrown while generating the presigned url
 * @returns err(InvoicePresignS3Error) if an error is thrown while generating the presigned link
 */
const _getPaymentProofPresignedS3Url = (
  payment: IPaymentSchema,
): ResultAsync<string, PaymentProofPresignS3Error> => {
  const objectPath = getPaymentProofS3ObjectPath(payment)

  logger.info({
    message: 'Generating payment proof presigned s3 link',
    meta: {
      action: '_getPaymentProofPresignedS3Url',
      paymentId: payment._id,
      objectPath,
    },
  })
  return ResultAsync.fromPromise(
    AwsConfig.s3.getSignedUrlPromise('getObject', {
      Bucket: AwsConfig.paymentProofS3Bucket,
      Key: objectPath,
      // URL is returned as a redirected immediate download link, thus the link is not meant to be long lasting
      Expires: 1 * dayInSeconds,
    }),
    (error) => {
      logger.error({
        message: 'Error occured whilst retrieving signed URL from S3',
        meta: {
          action: 'getPresignedS3Invoice',
          paymentId: payment._id,
          objectPath,
        },
        error,
      })
      return new PaymentProofPresignS3Error()
    },
  )
}

const _retrieveReceiptUrlFromStripe = (
  payment: ICompletedPaymentSchema,
): ResultAsync<string, StripeFetchError> => {
  return ResultAsync.fromPromise(
    stripe.paymentIntents.retrieve(
      payment.paymentIntentId,
      { expand: ['latest_charge'] },
      { stripeAccount: payment.targetAccountId },
    ),
    (error) => new StripeFetchError(String(error)),
  ).andThen((paymentIntent) => {
    const receiptUrl = (paymentIntent.latest_charge as Stripe.Charge)
      .receipt_url
    if (!receiptUrl) {
      return errAsync(new StripeFetchError('Receipt url not found'))
    }
    return ok(receiptUrl)
  })
}

const _generatePaymentInvoiceAsPdf = (
  payment: ICompletedPaymentSchema,
  populatedForm: IPopulatedEncryptedForm,
  receiptUrl: string,
): ResultAsync<Buffer, StripeFetchError> => {
  if (!payment.completedPayment?.receiptUrl) {
    return errAsync(new StripeFetchError('Receipt url not ready'))
  }
  return ResultAsync.fromPromise(
    axios.get<string>(receiptUrl),
    (error) => new StripeFetchError(String(error)),
  ).andThen((receiptUrlResponse) => {
    // retrieve receiptURL as html
    const html = receiptUrlResponse.data
    const agencyBusinessInfo = (populatedForm as IPopulatedForm).admin.agency
      .business
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
    const invoiceHtml = convertToProofOfPaymentFormat(html, {
      address: businessAddress || '',
      gstRegNo: businessGstRegNo || '',
      formTitle: populatedForm.title,
      submissionId: payment.completedPayment?.submissionId || '',
      gstApplicable: payment.gstEnabled,
      products: payment.products || [],
    })

    return ResultAsync.fromPromise(
      generatePdfFromHtml(invoiceHtml),
      (error) => new StripeFetchError(String(error)),
    )
  })
}

export const generatePaymentInvoiceUrl = (
  payment: IPaymentSchema,
  populatedForm: IPopulatedEncryptedForm,
): ResultAsync<
  string,
  StripeFetchError | PaymentProofUploadS3Error | PaymentProofPresignS3Error
> => {
  if (!payment.completedPayment?.hasS3ReceiptUrl) {
    return checkStripeReceiptIsReady(payment).andThen((completedPayment) =>
      _retrieveReceiptUrlFromStripe(completedPayment)
        .andThen((receiptUrl) =>
          _generatePaymentInvoiceAsPdf(
            completedPayment,
            populatedForm,
            receiptUrl,
          ),
        )
        .andThen((pdfBuffer) =>
          _storePaymentProofInS3(completedPayment, pdfBuffer),
        )
        .andThen(() => _getPaymentProofPresignedS3Url(completedPayment)),
    )
  }
  return _getPaymentProofPresignedS3Url(payment)
}
