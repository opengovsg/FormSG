import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { getFormAfterPermissionChecks } from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import {
  getStripeOauthUrl,
  unlinkStripeAccountFromForm,
  validateAccount,
} from '../../payments/stripe.service'
import { getPopulatedUserById } from '../../user/user.service'

import { PermissionLevel } from './admin-form.types'
import { mapRouteError, verifyUserBetaflag } from './admin-form.utils'

const logger = createLoggerWithLabel(module)

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
      .andThen((form) => getStripeOauthUrl(form))
      .map(({ authUrl, state }) => {
        res.cookie('stripeState', state, { signed: true })
        return res.json({
          authUrl,
        })
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

export const handleUnlinkAccount: ControllerHandler<{
  formId: string
}> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  // Step 1: Retrieve currently logged in user.
  return getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      // Step 2: Retrieve form with write permission check.
      getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Write,
      }),
    )
    .andThen((form) => unlinkStripeAccountFromForm(form))
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
}

export const handleValidatePaymentAccount: ControllerHandler<{
  formId: string
}> = async (req, res) => {
  const { formId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  // Step 1: Retrieve currently logged in user.
  return getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      // Step 2: Retrieve form with write permission check.
      getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Write,
      }),
    )
    .andThen((form) =>
      validateAccount(form.payments_channel?.target_account_id),
    )
    .map((account) => {
      return res.json({
        account,
      })
    })
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
}
