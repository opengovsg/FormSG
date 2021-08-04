import mongoose from 'mongoose'
import { errAsync, ResultAsync } from 'neverthrow'

import {
  FormAuthType,
  FormBillingStatistic,
  ILoginSchema,
  IPopulatedForm,
} from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getLoginModel from '../../models/login.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

import { FormHasNoAuthError } from './billing.errors'

const logger = createLoggerWithLabel(module)
const LoginModel = getLoginModel(mongoose)

/**
 * Retrieves SingPass login statistics including total logins for each of the
 * forms with given esrvcId in the given date range.
 * @param esrvcId the esrvcId to filter retrieved login statistics
 * @param minDate the minimum date to retrieve statistics for
 * @param maxDate the maximum date to retrieve statistics for
 * @returns ok(login statistics list) when successful
 * @returns err(DatabaseError) when error occurs whilst running database aggregation pipeline
 */
export const getSpLoginStats = (
  esrvcId: string,
  minDate: Date,
  maxDate: Date,
): ResultAsync<FormBillingStatistic[], DatabaseError> => {
  return ResultAsync.fromPromise(
    LoginModel.aggregateLoginStats(esrvcId, minDate, maxDate),
    (error) => {
      const errMsg = 'Failed to retrieve billing records'
      logger.error({
        message: errMsg,
        meta: {
          action: 'getSpLoginStats',
          esrvcId,
        },
        error,
      })
      return new DatabaseError(errMsg)
    },
  )
}

/**
 * Adds a login record for a form with authentication to the database.
 * @param form Form populated with admin and agency data
 * @return The Login document saved to the database
 */
export const recordLoginByForm = (
  form: IPopulatedForm,
): ResultAsync<ILoginSchema, FormHasNoAuthError | DatabaseError> => {
  const logMeta = {
    action: 'recordLoginByForm',
    formId: form._id,
  }
  if (form.authType === FormAuthType.NIL) {
    return errAsync(new FormHasNoAuthError())
  }
  return ResultAsync.fromPromise(LoginModel.addLoginFromForm(form), (error) => {
    logger.error({
      message: 'Error adding login to database',
      meta: logMeta,
      error,
    })
    return new DatabaseError(getMongoErrorMessage(error))
  })
}
