import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../../config/logger'
import { isUserInSession } from '../../auth/auth.utils'

import { getDashboardForms } from './admin-form.service'
import { mapRouteError } from './admin-form.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /adminform endpoint.
 * @returns 200 with list of forms user can access when list is retrieved successfully
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 when database errors occur
 */
export const handleListDashboardForms: RequestHandler = async (req, res) => {
  // Restricted route.
  if (!isUserInSession(req.session)) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'User is unauthorized.' })
  }

  const dashboardResult = await getDashboardForms(req.session.user._id)

  if (dashboardResult.isErr()) {
    const { error } = dashboardResult
    logger.error({
      message: 'Error listing dashboard forms',
      meta: {
        action: 'handleListDashboardForms',
      },
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Success.
  return res.json(dashboardResult.value)
}
