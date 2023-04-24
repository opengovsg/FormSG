import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'

import { IPaymentSchema } from 'src/types'

import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'

import { PaymentNotFoundError } from './payments.errors'
import { findLatestSuccessfulPaymentByEmailAndFormId } from './payments.service'

const logger = createLoggerWithLabel(module)

// exported for testing
export const _handleGetPreviousPayment: ControllerHandler<
  {
    formId: string
  },
  IPaymentSchema,
  { email: string }
> = (req, res) => {
  const { formId } = req.params
  const { email } = req.body
  // Step 1 get Payment document from email and formId
  return (
    findLatestSuccessfulPaymentByEmailAndFormId(email, formId)
      // If payment found, return payment
      .map((payment) => {
        logger.info({
          message:
            'Found latest successful payment document from email and formId',
          meta: {
            action: 'handleGetPreviousPayment',
            email,
            formId,
            payment,
          },
        })
        return res.status(StatusCodes.OK).send(payment)
      })
      // If payment is not found, there is no previous payment
      // If database error, return 500
      .mapErr((error) => {
        // if payment isn't found, return empty response
        if (error instanceof PaymentNotFoundError) {
          logger.info({
            message:
              'Did not find previous successful payment from email and formId',
            meta: {
              action: 'handleGetPreviousPayment',
              email,
              formId,
              error,
            },
          })
          return res.sendStatus(StatusCodes.NOT_FOUND)
        }
        // Database error
        logger.error({
          message: 'Error retrieving payment documents using email and formId',
          meta: {
            action: 'handleGetPreviousPayment',
            email,
            formId,
            error,
          },
        })
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send()
      })
  )
}

/**
 * Handler for GET /api/v3/:formId/payments/previous/:email
 * Finds and return the latest successful payment made by the
 * specific respondent based on their email.
 * Email will be acquired from the request body
 *
 * @params formId formId of related form to retrieve payment
 *
 * @returns 200 with payment document if successful payment is found
 * @returns 404 without data if no payment has been made
 * @returns 500 if there is an unexpected error
 */ export const handleGetPreviousPayment = [
  celebrate({
    [Segments.QUERY]: {
      formId: Joi.string().required,
    },
  }),
  _handleGetPreviousPayment,
] as ControllerHandler[]
