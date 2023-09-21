import { keyBy } from 'lodash'
import { Model, Mongoose, Schema } from 'mongoose'
import validator from 'validator'

import {
  BounceType,
  IBounceSchema,
  IEmailNotification,
  ISingleBounce,
  UserContactView,
} from '../../../types'
import { bounceLifeSpan } from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { FORM_SCHEMA_ID } from '../../models/form.server.model'

import {
  hasEmailBeenDelivered,
  hasEmailBounced,
  parseBounceNotificationCommonHeadersToEmails,
} from './bounce.util'

const logger = createLoggerWithLabel(module)

export const BOUNCE_SCHEMA_ID = 'Bounce'

export interface IBounceModel extends Model<IBounceSchema> {
  fromSnsNotification: (
    snsInfo: IEmailNotification,
    formId: string,
  ) => IBounceSchema
}

const BounceSchema = new Schema<IBounceSchema, IBounceModel>({
  formId: {
    type: Schema.Types.ObjectId,
    ref: FORM_SCHEMA_ID,
    required: 'Form ID is required',
  },
  hasAutoEmailed: {
    type: Boolean,
    default: false,
  },
  hasAutoSmsed: {
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
        bounceType: {
          type: String,
          enum: Object.values(BounceType),
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

/**
 * Create a new Bounce document from an SNS notification.
 * More info on format of SNS notifications:
 * https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html.
 * @param snsInfo the SNS notification to create a document from
 * @param snsInfo the SNS notification to create a document from
 * @returns the created Bounce document
 */
BounceSchema.statics.fromSnsNotification = function (
  snsInfo: IEmailNotification,
  formId: string,
): IBounceSchema {
  const emailsArray = parseBounceNotificationCommonHeadersToEmails(
    snsInfo.mail.commonHeaders.to,
  )
  const bounces: ISingleBounce[] = emailsArray.map((email) => {
    if (!validator.isEmail(email)) {
      logger.warn({
        message: 'Bounce notification contains value that is not a valid email',
        meta: {
          action: 'BounceSchema.statics.fromSnsNotification',
          email,
        },
      })
    }
    if (hasEmailBounced(snsInfo, email)) {
      return {
        email,
        hasBounced: true,
        bounceType: snsInfo.bounce.bounceType,
      }
    } else {
      return { email, hasBounced: false }
    }
  })
  return new this({ formId, bounces })
}

/**
 * Updates an old bounce document with info from an SNS notification.
 * @param snsInfo the notification information to merge
 * @returns the updated document
 */
BounceSchema.methods.updateBounceInfo = function (
  snsInfo: IEmailNotification,
): IBounceSchema {
  // Correctly parse the emails from commonHeaders.to
  const emailsArray = parseBounceNotificationCommonHeadersToEmails(
    snsInfo.mail.commonHeaders.to,
  )
  // First, get rid of outdated emails
  const latestRecipients = new Set(emailsArray)
  this.bounces = this.bounces.filter((bounceInfo) =>
    latestRecipients.has(bounceInfo.email),
  )
  // Reshape this.bounces to avoid O(n^2) computation
  const bouncesByEmail = keyBy(this.bounces, 'email')
  // The following block needs to work for the cross product of cases:
  // (notification type) *
  // (does the notification confirm delivery/bounce for this email) *
  // (does bouncesByEmail contain this email) *
  // (does bouncesByEmail currently say this email has bounced)
  emailsArray.forEach((email) => {
    if (!validator.isEmail(email)) {
      logger.warn({
        message: 'Bounce notification contains value that is not a valid email',
        meta: {
          action: 'BounceSchema.methods.updateBounceInfo',
          email,
        },
      })
    }
    if (hasEmailBounced(snsInfo, email)) {
      bouncesByEmail[email] = {
        email,
        hasBounced: true,
        bounceType: snsInfo.bounce.bounceType,
      }
    } else if (
      hasEmailBeenDelivered(snsInfo, email) ||
      !bouncesByEmail[email]
    ) {
      bouncesByEmail[email] = { email, hasBounced: false }
    }
  })
  this.bounces = Object.values(bouncesByEmail)
  return this
}

/**
 * Returns true if the document indicates a critical bounce (all recipients
 * bounced), false otherwise.
 * @returns true if all recipients bounced
 */
BounceSchema.methods.isCriticalBounce = function (): boolean {
  return this.bounces.every((emailInfo) => emailInfo.hasBounced)
}

/**
 * Returns true if the document indicates that all recipients bounced and
 * all bounces were permanent, false otherwise.
 * @returns true if all bounecs were permanent
 */
BounceSchema.methods.areAllPermanentBounces = function (): boolean {
  return this.bounces.every(
    (emailInfo) =>
      emailInfo.hasBounced && emailInfo.bounceType === BounceType.Permanent,
  )
}

/**
 * Returns the list of email recipients for this form
 * @returns Array of email addresses
 */
BounceSchema.methods.getEmails = function (): string[] {
  // Return a regular array to prevent unexpected bugs with mongoose
  // CoreDocumentArray
  return Array.from(this.bounces.map((emailInfo) => emailInfo.email))
}

/**
 * Sets hasAutoEmailed to true if at least one person has been emailed.
 * @param emailRecipients Array of recipients who were emailed.
 * @returns void. Modifies document in place.
 */
BounceSchema.methods.setNotificationState = function (
  emailRecipients: string[],
  smsRecipients: UserContactView[],
): void {
  if (emailRecipients.length > 0) {
    this.hasAutoEmailed = true
  }
  if (smsRecipients.length > 0) {
    this.hasAutoSmsed = true
  }
}

/**
 * Returns true if an automated email or SMS has been sent for this form,
 * false otherwise.
 * @returns true if at least one admin or collaborator has been notified
 */
BounceSchema.methods.hasNotified = function (): boolean {
  return this.hasAutoEmailed || this.hasAutoSmsed
}

const getBounceModel = (db: Mongoose): IBounceModel => {
  try {
    return db.model(BOUNCE_SCHEMA_ID) as IBounceModel
  } catch {
    return db.model<IBounceSchema, IBounceModel>(BOUNCE_SCHEMA_ID, BounceSchema)
  }
}

export default getBounceModel
