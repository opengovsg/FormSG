import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import moment from 'moment-timezone'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  BillingInformationDto,
  BillingQueryDto,
  ErrorDto,
} from '../../../types/api'
import { createReqMeta } from '../../utils/request'

import { BillingFactory } from './billing.factory'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /billing endpoint.
 * @security session
 *
 * @return 200 with login statistics when query is valid
 * @return 401 when request does not contain a user session
 * @return 500 when error occurs whilst querying database
 */
export const handleGetBillInfo: RequestHandler<
  ParamsDictionary,
  ErrorDto | BillingInformationDto,
  unknown,
  BillingQueryDto
> = async (req, res) => {
  const { esrvcId, mth, yr } = req.query
  const authedUser = (req.session as Express.AuthedSession).user

  const startOfMonth = moment
    .tz([parseInt(yr), parseInt(mth)], 'Asia/Singapore')
    .startOf('month')
  const endOfMonth = moment(startOfMonth).endOf('month')

  const loginStatsResult = await BillingFactory.getSpLoginStats(
    esrvcId,
    startOfMonth.toDate(),
    endOfMonth.toDate(),
  )

  if (loginStatsResult.isErr()) {
    logger.error({
      message: 'Failed to retrieve billing records',
      meta: {
        action: 'handleGetBillInfo',
        ...createReqMeta(req),
        esrvcId,
      },
      error: loginStatsResult.error,
    })
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json('Error in retrieving billing records')
  }

  // Retrieved login stats successfully.
  logger.info({
    message: `Billing search for ${esrvcId} by ${authedUser.email}`,
    meta: {
      action: 'handleGetBillInfo',
      ...createReqMeta(req),
      esrvcId,
    },
  })

  return res.json({
    loginStats: loginStatsResult.value,
  })
}
