import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'
import { ErrorDto, PaymentsUpdateDto } from 'shared/types'

import { IEncryptedFormDocument } from 'src/types'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { getFormAfterPermissionChecks } from '../../auth/auth.service'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import {
  getStripeOauthUrl,
  unlinkStripeAccountFromForm,
  validateAccount,
} from '../../payments/stripe.service'
import { checkFormIsEncryptMode } from '../../submission/encrypt-submission/encrypt-submission.service'
import { getPopulatedUserById } from '../../user/user.service'
import * as UserService from '../../user/user.service'

import * as AdminFormService from './admin-form.service'
import { PermissionLevel } from './admin-form.types'
import { mapRouteError, verifyUserBetaflag } from './admin-form.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler for POST /:formId/stripe.
 * @security session
 *
 * @returns 200 with Stripe redirect URL to complete OAuth flow
 * @returns 401 when user is not logged in
 * @returns 403 when user does not have permissions to update the form
 * @returns 404 when form to update cannot be found
 * @returns 410 when form to update has been deleted
 * @returns 422 when id of user who is updating the form cannot be found
 * @returns 422 when the form to be updated is not an encrypt mode form
 * @returns 500 when database error occurs
 */
export const handleConnectAccount: ControllerHandler<{
  formId: string
}> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  // Step 1: Retrieve currently logged in user.
  return (
    getPopulatedUserById(sessionUserId)
      // Step 2: Check if user has 'payment' betaflag
      .andThen((user) => verifyUserBetaflag(user, 'payment'))
      .andThen((user) =>
        // Step 3: Retrieve form with write permission check.
        getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Write,
        }),
      )
      // Step 4: Ensure that the form is encrypt mode.
      .andThen(checkFormIsEncryptMode)
      // Step 5: Get the auth URL and state, and pass the auth URL for redirection.
      .andThen(getStripeOauthUrl)
      .map(({ authUrl, state }) => {
        // Save the state for validation later on, to ensure the state has not been
        // tampered with.
        res.cookie('stripeState', state, { signed: true })
        return res.json({ authUrl })
      })
      .mapErr((error) => {
        logger.error({
          message: 'Error connecting admin form payment account',
          meta: {
            action: 'handleConnectAccount',
            ...createReqMeta(req),
          },
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for DELETE /:formId/stripe.
 * @security session
 *
 * @returns 200 when Stripe credentials successfully deleted
 * @returns 401 when user is not logged in
 * @returns 403 when user does not have permissions to update the form
 * @returns 404 when form to update cannot be found
 * @returns 410 when form to update has been deleted
 * @returns 422 when id of user who is updating the form cannot be found
 * @returns 422 when the form to be updated is not an encrypt mode form
 * @returns 500 when database error occurs
 */
export const handleUnlinkAccount: ControllerHandler<{
  formId: string
}> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  // Step 1: Retrieve currently logged in user.
  return (
    getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Retrieve form with write permission check.
        getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Write,
        }),
      )
      // Step 3: Ensure that the form is encrypt mode.
      .andThen(checkFormIsEncryptMode)
      // Step 4: Remove the Stripe account details.
      .andThen(unlinkStripeAccountFromForm)
      .map(() => res.status(StatusCodes.OK).json({ message: 'Success' }))
      .mapErr((error) => {
        logger.error({
          message: 'Error unlinking admin form payment account',
          meta: {
            action: 'handleUnlinkAccount',
            ...createReqMeta(req),
          },
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for GET /:formId/stripe/validate.
 * @security session
 *
 * @returns 200 when Stripe credentials have been validated
 * @returns 401 when user is not logged in
 * @returns 403 when user does not have permissions to update the form
 * @returns 404 when form to update cannot be found
 * @returns 410 when form to update has been deleted
 * @returns 422 when id of user who is updating the form cannot be found
 * @returns 422 when the form to be updated is not an encrypt mode form
 * @returns 500 when database error occurs
 * @returns 502 when the connected Stripe credentials are invalid
 */
export const handleValidatePaymentAccount: ControllerHandler<{
  formId: string
}> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  // Step 1: Retrieve currently logged in user.
  return (
    getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Retrieve form with write permission check.
        getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Write,
        }),
      )
      // Step 3: Ensure that the form is encrypt mode.
      .andThen(checkFormIsEncryptMode)
      // Step 4: Validate the associated Stripe account.
      .andThen((form) =>
        validateAccount(form.payments_channel.target_account_id),
      )
      .map((account) => res.json({ account }))
      .mapErr((error) => {
        logger.error({
          message: 'Error validating account',
          meta: {
            action: 'handleValidatePaymentAccount',
            ...createReqMeta(req),
          },
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Private handler for PUT /:formId/payment
 * NOTE: Exported for testing.
 * @precondition Must be preceded by request validation
 * @security session
 *
 * @returns 200 with updated payments
 * @returns 400 when updated payment amount is out of bounds
 * @returns 403 when current user does not have permissions to update the payments
 * @returns 404 when form cannot be found
 * @returns 410 when updating the payments for an archived form
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const _handleUpdatePayments: ControllerHandler<
  { formId: string },
  IEncryptedFormDocument['payments_field'] | ErrorDto,
  PaymentsUpdateDto
> = (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  // Step 1: Retrieve currently logged in user.
  return (
    UserService.getPopulatedUserById(sessionUserId)
      // Step 2: Check if user has 'payment' betaflag
      .andThen((user) => verifyUserBetaflag(user, 'payment'))
      .andThen((user) =>
        // Step 2: Retrieve form with write permission check.
        AuthService.getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Write,
        }),
      )
      // Step 3: User has permissions, proceed to allow updating of start page
      .andThen(() => AdminFormService.updatePayments(formId, req.body))
      .map((updatedPayments) =>
        res.status(StatusCodes.OK).json(updatedPayments),
      )
      .mapErr((error) => {
        logger.error({
          message: 'Error occurred when updating payments',
          meta: {
            action: '_handleUpdatePayments',
            ...createReqMeta(req),
            userId: sessionUserId,
            formId,
            body: req.body,
          },
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      })
  )
}

/**
 * Handler for PUT /:formId/payment
 */
export const handleUpdatePayments = [
  celebrate({
    [Segments.BODY]: {
      enabled: Joi.boolean().required(),
      amount_cents: Joi.when('enabled', {
        is: Joi.equal(true),
        then: Joi.number().integer().positive().required(),
        otherwise: Joi.number().integer(),
      }),
      description: Joi.when('enabled', {
        is: Joi.equal(true),
        then: Joi.string().required(),
        otherwise: Joi.string().allow(''),
      }),
    },
  }),
  _handleUpdatePayments,
] as ControllerHandler[]
