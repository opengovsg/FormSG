import { isEmpty } from 'lodash'
import { Schema } from 'mongoose'
import validator from 'validator'

import { IEmailFieldSchema, ResponseMode } from '../../../types'

const createEmailFieldSchema = () => {
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
        set: function (this: IEmailFieldSchema, v: boolean) {
          // PDF response not allowed for encrypt forms
          return this.parent().responseMode === ResponseMode.Encrypt ? false : v
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
        validator: (emailDomains: string[]) => {
          return (
            isEmpty(emailDomains) ||
            (new Set(emailDomains).size === emailDomains.length &&
              emailDomains.every((emailDomain) =>
                validator.isEmail('bob' + emailDomain),
              ))
          )
        },
        message: 'There are one or more duplicate or invalid email domains.',
      },
    },
  })

  // PDF response not allowed if autoreply is set in encrypted forms. If
  // autoreply is not set, then we don't care whether the pdf is set.
  EmailFieldSchema.pre<IEmailFieldSchema>('validate', function (next) {
    if (this.parent().responseMode === ResponseMode.Encrypt) {
      const { hasAutoReply, includeFormSummary } = this.autoReplyOptions || {}
      if (hasAutoReply && includeFormSummary) {
        return next(
          Error('Autoreply PDF is not allowed for storage mode forms'),
        )
      }
    }

    return next()
  })

  return EmailFieldSchema
}

export default createEmailFieldSchema
