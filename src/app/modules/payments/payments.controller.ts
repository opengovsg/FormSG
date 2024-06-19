import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import { MailSendError } from '../../services/mail/mail.errors'
import { InvalidDomainError } from '../auth/auth.errors'
import { ControllerHandler } from '../core/core.types'

import { PaymentNotFoundError } from './payments.errors'
import {
  findLatestSuccessfulPaymentByEmailAndFormId,
  sendOnboardingEmailIfEligible,
} from './payments.service'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /api/v3/:formId/payments/previous/:email
 * Finds and return the latest successful payment made by the specific
 * respondent based on their email. Email will be acquired from the request body
 * @params formId id of related form to retrieve payment
 *
 * @returns 200 with payment document if successful payment is found
 * @returns 404 without data if no payment has been made
 * @returns 500 if there is an unexpected error
 */
export const handleGetPreviousPaymentId: ControllerHandler<
  { formId: string },
  string,
  { email: string }
> = (req, res) => {
  const { formId } = req.params
  const { email } = req.body

  const logMeta = {
    action: 'handleGetPreviousPayment',
    email,
    formId,
  }

  // Step 1: Get Payment document from email and formId
  return (
    findLatestSuccessfulPaymentByEmailAndFormId(email, formId)
      // If payment found, return payment id
      .map((payment) => {
        logger.info({
          message:
            'Found latest successful payment document from email and formId',
          meta: { ...logMeta, paymentId: payment._id },
        })
        return res.status(StatusCodes.OK).send(payment._id)
      })
      // If payment is not found, there is no previous payment
      // If database error, return 500
      .mapErr((error) => {
        // if payment isn't found, return empty response
        if (error instanceof PaymentNotFoundError) {
          logger.info({
            message:
              'Did not find previous successful payment from email and formId',
            meta: logMeta,
          })
          return res.sendStatus(StatusCodes.NOT_FOUND)
        }
        // Database error
        logger.error({
          message: 'Error retrieving payment documents using email and formId',
          meta: logMeta,
          error,
        })
        return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
      })
  )
}

export const _handleSendOnboardingEmail: ControllerHandler<
  unknown,
  unknown,
  { email: string }
> = (req, res) => {
  const { email } = req.body

  const logMeta = {
    action: 'handleSendOnboardingEmail',
    email,
  }

  return sendOnboardingEmailIfEligible(email)
    .map(() => res.sendStatus(StatusCodes.OK))
    .mapErr((error) => {
      if (error instanceof InvalidDomainError) {
        logger.info({
          message: 'Email domain is not whitelisted for onboarding email',
          meta: logMeta,
        })
        // If email domain is not whitelisted, return 403
        return res.sendStatus(StatusCodes.FORBIDDEN)
      } else if (error instanceof MailSendError) {
        // Mail send error
        logger.error({
          message: 'Error sending email',
          meta: logMeta,
          error,
        })
        // Error code 400 based on what is set in src/app/modules/submission/email-submission/email-submission.util.ts
        return res.sendStatus(StatusCodes.BAD_REQUEST)
      } else {
        // Database error
        logger.error({
          message: 'Error retrieving valid email domains',
          meta: logMeta,
          error,
        })
        return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
      }
    })
}

export const handleSendOnboardingEmail = [
  celebrate({
    [Segments.BODY]: Joi.object({
      email: Joi.string().email().required(),
    }),
  }),
  _handleSendOnboardingEmail,
] as ControllerHandler[]
