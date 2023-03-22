import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { Payment } from '../../../../shared/types'
import { IPaymentSchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getPaymentModel from '../../models/payment.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

import { PaymentNotFoundError } from './payment.errors'

const logger = createLoggerWithLabel(module)
const PaymentModel = getPaymentModel(mongoose)

/**
 * Retrieves submission document of the given SubmissionId.
 * @param submissionId the submissionId of the payment to be retrieved
 * @param update mongoose update to perform
 * @returns ok(payment) if payment exists
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const findBySubmissionIdAndUpdate = (
  submissionId: string,
  update?:
    | mongoose.UpdateWithAggregationPipeline
    | mongoose.UpdateQuery<Payment>,
): ResultAsync<IPaymentSchema, PaymentNotFoundError | DatabaseError> => {
  return ResultAsync.fromPromise(
    PaymentModel.findOneAndUpdate({ submissionId }, update).exec(),
    (error) => {
      logger.error({
        message: 'Error updating payment in database',
        meta: {
          action: 'findBySubmissionIdAndUpdate',
          submissionId,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((result) => {
    if (!result) return errAsync(new PaymentNotFoundError())
    return okAsync(result)
  })
}

/**
 * Retrieves payment document of the given submissionId.
 * @param submissionId the submissionId of the payment to be retrieved
 * @returns ok(payment) if payment exists
 * @returns err(PaymentNotFoundError) if the payment does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const findPaymentBySubmissionId = (
  submissionId: string,
): ResultAsync<IPaymentSchema, PaymentNotFoundError | DatabaseError> => {
  return ResultAsync.fromPromise(
    PaymentModel.findOne({ submissionId }).exec(),
    (error) => {
      logger.error({
        message: 'Database find payment submissionId error',
        meta: {
          action: 'findPaymentBySubmissionId',
          submissionId,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((payment) => {
    if (!payment) {
      return errAsync(new PaymentNotFoundError())
    }
    return okAsync(payment)
  })
}
