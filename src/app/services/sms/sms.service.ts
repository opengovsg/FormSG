import mongoose from 'mongoose'
import { okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import getFormModel from '../../models/form.server.model'
import {
  DatabaseError,
  PossibleDatabaseError,
} from '../../modules/core/core.errors'
import MailService from '../../services/mail/mail.service'
import { transformMongoError } from '../../utils/handle-mongo-error'

import { ISmsCountSchema, LogSmsParams } from './sms.types'
import { hasHitSmsThreshold } from './sms.utils'
import getSmsCountModel from './sms_count.server.model'

const logger = createLoggerWithLabel(module)
const SmsCount = getSmsCountModel(mongoose)

const FormModel = getFormModel(mongoose)

/**
 * Retrieves the free sms count for a particular user
 * @param formId The id of the form to retrieve the sms counts for
 * @returns ok(count) when retrieval is successful
 * @returns err(error) when retrieval fails due to a database error
 */
export const retrieveSmsCounts = (
  formId: string,
): ResultAsync<number, PossibleDatabaseError> => {
  return ResultAsync.fromPromise(
    SmsCount.retrieveSmsCounts(formId),
    (error) => {
      logger.error({
        message: `Retrieving free sms counts failed for ${formId}`,
        meta: {
          action: 'retrieveSmsCounts',
          formId,
          error,
        },
      })

      return transformMongoError(error)
    },
  )
}

export const logSmsSend = (
  logParams: LogSmsParams,
): ResultAsync<ISmsCountSchema, DatabaseError> => {
  const formId = String(logParams.smsData.form)
  return ResultAsync.fromPromise(SmsCount.logSms(logParams), (error) => {
    logger.error({
      message: 'Error logging sms count to database',
      meta: {
        action: 'logSmsSend',
        ...logParams,
      },
      error,
    })

    return new DatabaseError()
  }).andThen((smsLog) => {
    return retrieveSmsCounts(formId).map((smsCount) => {
      const thresholdHit = hasHitSmsThreshold({ smsCount: smsCount })

      if (!thresholdHit) return okAsync(smsLog)

      logger.info({
        message: `Sms threshold has been hit`,
        meta: {
          action: 'logSmsSend',
          ...logParams,
          thresholdHit,
        },
      })

      return ResultAsync.fromPromise(
        FormModel.findById(formId).exec(),
        (error) => {
          logger.error({
            message: 'Database error when retrieving form by id',
            meta: {
              action: 'logSmsSend',
              ...logParams,
              formId,
              thresholdHit,
            },
            error,
          })
          return new DatabaseError()
        },
      ).andThen((retrievedForm) => {
        // send mail to form admin
        MailService.sendSmsThresholdWarningNotification({
          emailRecipients: [logParams.smsData.formAdmin.email],
          formTitle: retrievedForm?.title ?? '',
          formId: logParams.smsData.form,
          smsThreshold: thresholdHit,
        })

        return okAsync(smsLog)
      })
    })
  })
}
