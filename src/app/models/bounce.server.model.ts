import { get } from 'lodash'
import { Model, Mongoose, Schema } from 'mongoose'
import validator from 'validator'

import { bounceLifeSpan } from '../../config/config'
import {
  IBounceNotification,
  IBounceSchema,
  IEmailNotification,
  isBounceNotification,
  isDeliveryNotification,
  ISingleBounce,
} from '../../types'
import { EMAIL_HEADERS, EMAIL_TYPES } from '../constants/mail'

import { FORM_SCHEMA_ID } from './form.server.model'

export const BOUNCE_SCHEMA_ID = 'Bounce'

export interface IBounceModel extends Model<IBounceSchema> {
  fromSnsNotification: (snsInfo: IEmailNotification) => IBounceSchema | null
}

const BounceSchema = new Schema<IBounceSchema>({
  formId: {
    type: Schema.Types.ObjectId,
    ref: FORM_SCHEMA_ID,
    required: 'Form ID is required',
  },
  hasAlarmed: {
    type: Boolean,
    default: false,
  },
  bounces: {
    type: [
      {
        email: {
          type: String,
          trim: true,
          required: true,
          validate: {
            validator: validator.isEmail,
            message: 'Bounced email must be a valid email address',
          },
        },
        hasBounced: {
          type: Boolean,
          default: false,
        },
        _id: false,
      },
    ],
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + bounceLifeSpan),
  },
})
BounceSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

// Helper function for methods.
// Extracts custom headers which we send with all emails, such as form ID, submission ID
// and email type (admin response, email confirmation OTP etc).
const extractHeader = (body: IEmailNotification, header: string): string => {
  return get(body, 'mail.headers').find(
    (mailHeader) => mailHeader.name.toLowerCase() === header.toLowerCase(),
  )?.value
}

// Helper function for methods.
// Whether a bounce notification says a given email has bounced
const hasEmailBounced = (
  bounceInfo: IBounceNotification,
  email: string,
): boolean => {
  return get(bounceInfo, 'bounce.bouncedRecipients').some(
    (emailInfo) => emailInfo.emailAddress === email,
  )
}

// Create a new Bounce document from an SNS notification.
// More info on format of SNS notifications:
// https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
BounceSchema.statics.fromSnsNotification = function (
  this: IBounceModel,
  snsInfo: IEmailNotification,
): IBounceSchema | null {
  const emailType = extractHeader(snsInfo, EMAIL_HEADERS.emailType)
  const formId = extractHeader(snsInfo, EMAIL_HEADERS.formId)
  // We only care about admin emails
  if (emailType !== EMAIL_TYPES.adminResponse || !formId) {
    return null
  }
  const isBounce = isBounceNotification(snsInfo)
  const bounces: ISingleBounce[] = get(snsInfo, 'mail.commonHeaders.to').map(
    (email) => {
      if (isBounce && hasEmailBounced(snsInfo as IBounceNotification, email)) {
        return { email, hasBounced: true }
      } else {
        return { email, hasBounced: false }
      }
    },
  )
  return new this({ formId, bounces })
}

// Updates an old bounce document with info from a new bounce document as well
// as an SNS notification. This function does 3 things:
// 1) If the old bounce document indicates that an email bounced, set hasBounced
// to true for that email.
// 2) If the new delivery notification indicates that an email was delivered
// successfully, set hasBounced to false for that email, even if the old bounce
// document indicates that that email previously bounced.
// 3) Update the old recipient list according to the newest bounce notification.
BounceSchema.methods.merge = function (
  this: IBounceSchema,
  latestBounces: IBounceSchema,
  snsInfo: IEmailNotification,
): void {
  const isDelivery = isDeliveryNotification(snsInfo)
  this.bounces.forEach((oldBounce) => {
    // If we were previously notified that a given email has bounced,
    // we want to retain that information
    if (oldBounce.hasBounced) {
      // Check if the latest recipient list contains that email
      const matchedLatestBounce = latestBounces.bounces.find(
        (newBounce) => newBounce.email === oldBounce.email,
      )
      // Check if the latest notification indicates that this email
      // actually succeeded
      const hasSubsequentlySucceeded =
        isDelivery &&
        get(snsInfo, 'delivery.recipients').includes(oldBounce.email)
      if (matchedLatestBounce) {
        // Set the latest bounce status based on the latest notification
        matchedLatestBounce.hasBounced = !hasSubsequentlySucceeded
      }
    }
  })
  this.bounces = latestBounces.bounces
}

const getBounceModel = (db: Mongoose) => {
  try {
    return db.model(BOUNCE_SCHEMA_ID) as IBounceModel
  } catch {
    return db.model<IBounceSchema>(
      BOUNCE_SCHEMA_ID,
      BounceSchema,
    ) as IBounceModel
  }
}

export default getBounceModel
