import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from 'src/app/config/logger'
import { PossibleDatabaseError } from 'src/app/modules/core/core.errors'
import { transformMongoError } from 'src/app/utils/handle-mongo-error'

// import { TwilioSmsStatsdTags } from 'src/types/twilio'

// import { isPhoneNumber } from '../../../../shared/utils/phone-num-validation'
// import { AdminContactOtpData, FormOtpData } from '../../../types'
// import config from '../../config/config'
// import { createLoggerWithLabel } from '../../config/logger'
// import getFormModel from '../../models/form.server.model'
// import {
//   DatabaseError,
//   MalformedParametersError,
//   PossibleDatabaseError,
// } from '../../modules/core/core.errors'
// import { twilioStatsdClient } from '../../modules/twilio/twilio.statsd-client'
// import {
//   getMongoErrorMessage,
//   transformMongoError,
// } from '../../utils/handle-mongo-error'
// import {
//   InvalidNumberError,
//   SmsSendError,
// } from '../postman-sms/postman-sms.errors'
// import { renderVerificationSms } from '../postman-sms/postman-sms.util'

// import {
//   LogSmsParams,
//   LogType,
//   SmsType,
//   TwilioConfig,
//   TwilioCredentials,
// } from './sms.types'
// import getSmsCountModel from './sms_count.server.model'

const logger = createLoggerWithLabel(module)
const SmsCount = getSmsCountModel(mongoose)
// const Form = getFormModel(mongoose)

/**
 * Retrieves the free sms count for a particular user
 * @param userId The id of the user to retrieve the sms counts for
 * @returns ok(count) when retrieval is successful
 * @returns err(error) when retrieval fails due to a database error
 */
export const retrieveSmsCounts = (
  userId: string,
): ResultAsync<number, PossibleDatabaseError> => {
  return ResultAsync.fromPromise(
    SmsCount.retrieveSmsCounts(userId),
    (error) => {
      logger.error({
        message: `Retrieving free sms counts failed for ${userId}`,
        meta: {
          action: 'retrieveSmsCounts',
          userId,
          error,
        },
      })

      return transformMongoError(error)
    },
  )
}
