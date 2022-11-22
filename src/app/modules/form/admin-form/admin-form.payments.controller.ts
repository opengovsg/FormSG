import { AuthedSessionData } from 'express-session'

import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { getFormAfterPermissionChecks } from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import {
  createAccountLink,
  linkStripeAccountToForm,
} from '../../payments/stripe.service'
import { getPopulatedUserById } from '../../user/user.service'

import { PermissionLevel } from './admin-form.types'
import { mapRouteError } from './admin-form.utils'

const logger = createLoggerWithLabel(module)

export const handleConnectAccount: ControllerHandler<{
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
    .andThen((form) => linkStripeAccountToForm(form))
    .andThen((accountId) => createAccountLink(accountId, formId))
    .map((accountLink) => {
      return res.json({
        accountUrl: accountLink.url,
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
}
