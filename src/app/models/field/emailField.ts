import { Schema } from 'mongoose'

import { validateEmailDomains } from '../../../shared/util/email-domain-validation'
import { IEmailFieldSchema, ResponseMode } from '../../../types'

const createEmailFieldSchema = (): Schema<IEmailFieldSchema> => {
  const EmailFieldSchema = new Schema<IEmailFieldSchema>({
    autoReplyOptions: {
      hasAutoReply: {
        type: Boolean,
        default: false,
      },
      autoReplySubject: {
        type: String,
        trim: true,
        default: '',
      },
      autoReplySender: {
        type: String,
        trim: true,
        default: '',
        match: [/^[^:]+$/, 'Please do not include : in sender name'],
      },
      autoReplyMessage: {
        type: String,
        trim: true,
        default: '',
      },
      includeFormSummary: {
        type: Boolean,
        default: false,
        validate: {
          validator: function (this: IEmailFieldSchema) {
            // PDF response not allowed for encrypt forms but ignore if no autoreply
            return (
              this.parent().responseMode !== ResponseMode.Encrypt ||
              !this.autoReplyOptions.hasAutoReply
            )
          },
          message:
            'PDF response summaries are not allowed for email confirmations in storage mode forms',
        },
      },
    },

    isVerifiable: {
      type: Boolean,
      default: false,
    },
    hasAllowedEmailDomains: {
      type: Boolean,
      default: false,
    },
    allowedEmailDomains: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      // If allowedEmailDomains is empty, then all email domains should be allowed.
      default: [],
      validate: {
        validator: (emailDomains: string[]): boolean => {
          return validateEmailDomains(emailDomains)
        },
        message: 'There are one or more duplicate or invalid email domains.',
      },
    },
  })

  return EmailFieldSchema
}

export default createEmailFieldSchema
