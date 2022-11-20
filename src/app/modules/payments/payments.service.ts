import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { Payment } from 'shared/types'

import { createLoggerWithLabel } from 'src/app/config/logger'
import getPaymentModel from 'src/app/models/payment.server.model'
import { getMongoErrorMessage } from 'src/app/utils/handle-mongo-error'
import { IPaymentSchema } from 'src/types'

import { ApplicationError, DatabaseError } from '../core/core.errors'

const logger = createLoggerWithLabel(module)
const PaymentModel = getPaymentModel(mongoose)

export class PaymentNotFoundError extends ApplicationError {
  constructor(message = 'Payment not found') {
    super(message)
  }
}

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
