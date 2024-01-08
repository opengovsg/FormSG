import _ from 'lodash'
import moment from 'moment-timezone'
import { Types } from 'mongoose'
import Stripe from 'stripe'

import {
  FormPaymentsField,
  PaymentChannel,
  PaymentFieldsDto,
  PaymentMethodType,
  PaymentType,
  ProductItem,
  StorageModeSubmissionContentDto,
  SubmissionDto,
  SubmissionPaymentDto,
  SubmissionType,
} from '../../../../../shared/types'
import { isNonEmpty } from '../../../../../shared/utils/isNonEmpty'
import { calculatePrice } from '../../../../../shared/utils/paymentProductPrice'
import { isProcessedChildResponse } from '../../../../app/utils/field-validation/field-validation.guards'
import {
  IEncryptedSubmissionSchema,
  IPopulatedEncryptedForm,
  ISubmissionSchema,
  StorageModeSubmissionData,
} from '../../../../types'
import {
  EncryptFormFieldResponse,
  ParsedClearFormFieldResponse,
} from '../../../../types/api'
import { MyInfoKey } from '../../myinfo/myinfo.types'
import { ProcessedFieldResponse } from '../submission.types'
import { getAnswersForChild, getMyInfoPrefix } from '../submission.utils'

/**
 * Typeguard to check if given submission is an encrypt mode submission.
 * @param submission the submission to check
 * @returns true if submission is encrypt mode submission, false otherwise.
 */
export const isSubmissionEncryptMode = (
  submission: ISubmissionSchema,
): submission is IEncryptedSubmissionSchema => {
  return submission.submissionType === SubmissionType.Encrypt
}

/**
 * Creates and returns a StorageModeSubmissionDto object from submissionData and
 * attachment presigned urls.
 */
export const createStorageModeSubmissionDto = (
  submissionData: StorageModeSubmissionData,
  attachmentPresignedUrls: Record<string, string>,
  payment?: SubmissionPaymentDto,
): SubmissionDto => {
  return {
    submissionType: SubmissionType.Encrypt,
    refNo: submissionData._id,
    submissionTime: moment(submissionData.created)
      .tz('Asia/Singapore')
      .format('ddd, D MMM YYYY, hh:mm:ss A'),
    content: submissionData.encryptedContent,
    verified: submissionData.verifiedContent,
    attachmentMetadata: attachmentPresignedUrls,
    payment,
    version: submissionData.version,
  }
}

/**
 * Retrieves payment amount by payment_type
 * @param formPaymentFields data from the form
 * @param incomingSubmissionPaymentFields data from responder's submission
 */
export const getPaymentAmount = (
  formPaymentFields: FormPaymentsField, // fields that are from document.form
  incomingSubmissionPaymentFields?: PaymentFieldsDto, // fields that are from incoming submission
  paymentProducts?: StorageModeSubmissionContentDto['paymentProducts'],
): number | undefined => {
  // legacy payment forms may not have a payment type
  const { payment_type } = formPaymentFields
  switch (payment_type) {
    case PaymentType.Fixed:
      return formPaymentFields.amount_cents
    case PaymentType.Variable:
      return incomingSubmissionPaymentFields?.amount_cents
    case PaymentType.Products:
      if (!paymentProducts) {
        return 0
      }
      return calculatePrice(paymentProducts)
    default: {
      // Force TS to emit an error if the cases above are not exhaustive
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = payment_type
    }
  }
}

/**
 * Retrieves payment description by payment_type
 *
 * - `Fixed Payments` references the description to as legacy behaviour
 * - `Variable Payments` references the name
 * - `Products` references the product name and quantity separated by a comma
 * @param form
 * @param paymentProducts
 */
export const getPaymentIntentDescription = (
  form: IPopulatedEncryptedForm,
  paymentProducts?: StorageModeSubmissionContentDto['paymentProducts'],
) => {
  const formPaymentFields = form.payments_field
  const { payment_type } = formPaymentFields
  switch (payment_type) {
    case PaymentType.Fixed:
      // legacy behaviour of fixed payments where the product name is referred as description
      return formPaymentFields.description
    case PaymentType.Variable:
      return formPaymentFields.name
    case PaymentType.Products: {
      if (!paymentProducts) return form.title
      const productDescriptions = paymentProducts
        .map((product) => `${product.data.name} x ${product.quantity}`)
        .join(', ')
      return productDescriptions
    }
    default: {
      // Force TS to emit an error if the cases above are not exhaustive
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = payment_type
    }
  }
}

const omitResponseKeys = (
  response: ProcessedFieldResponse,
):
  | ProcessedFieldResponse
  | ParsedClearFormFieldResponse
  | EncryptFormFieldResponse => {
  // We want to omit the isVisible property, as all fields are visible in the encrypted submission, making it redundant
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isVisible, ...rest } = response
  return rest
}

export const formatMyInfoStorageResponseData = (
  parsedResponses: ProcessedFieldResponse[],
  hashedFields?: Set<MyInfoKey>,
) => {
  if (!hashedFields) {
    return parsedResponses.flatMap((response: ProcessedFieldResponse) => {
      return omitResponseKeys(response)
    })
  } else {
    return parsedResponses.flatMap((response) => {
      if (isProcessedChildResponse(response)) {
        return getAnswersForChild(response).map((childField) => {
          const myInfoPrefix = getMyInfoPrefix(childField, hashedFields)
          childField.question = `${myInfoPrefix}${childField.question}`
          return childField
        })
      } else {
        // Obtain prefix for question based on whether it is verified by MyInfo.
        const myInfoPrefix = getMyInfoPrefix(response, hashedFields)
        response.question = `${myInfoPrefix}${response.question}`
        return omitResponseKeys(response)
      }
    })
  }
}

export const getStripePaymentMethod = (
  form: IPopulatedEncryptedForm,
): Omit<Stripe.PaymentIntentCreateParams, 'amount' | 'currency'> => {
  const isPaynowOnly =
    form.payments_channel.payment_methods?.includes(PaymentMethodType.Paynow) &&
    form.payments_channel.payment_methods?.length === 1
  const stripePaynowOnly =
    form.payments_channel.channel === PaymentChannel.Stripe && isPaynowOnly

  if (stripePaynowOnly) {
    return {
      payment_method_types: ['paynow'],
    }
  }
  return {
    automatic_payment_methods: {
      enabled: true,
    },
  }
}

/**
 * Sanitizes the payment fields from the form and the incoming submission
 * The payment products from incoming submission can be freely altered by the respondent
 * which could result in undesirable data seeded into our database
 * @param form
 * @param dirtyPaymentProducts
 */
export const sanitisePaymentProducts = (
  form: IPopulatedEncryptedForm,
  dirtyPaymentProducts: ProductItem[] | undefined,
): ProductItem[] | undefined => {
  if (!dirtyPaymentProducts) return
  if (!form.payments_field.products) return

  const sanitisedProducts = form.payments_field.products
    .map((cleanProductData): ProductItem | null => {
      const dirtyProduct = dirtyPaymentProducts.find(({ data }) =>
        (cleanProductData._id as unknown as Types.ObjectId).equals(data._id),
      )
      if (!dirtyProduct) return null

      return {
        ..._.pick(dirtyProduct, ['selected', 'quantity']), // only selected and quantity are allowed to be passed through
        data: cleanProductData, // only clean product data from the form should be used
      }
    })
    .filter(isNonEmpty)

  return sanitisedProducts
}
