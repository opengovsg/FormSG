import { Schema } from 'mongoose'

import { FormResponseMode } from '../../../../shared/types'
import { validateEmailDomains } from '../../../../shared/utils/email-domain-validation'
import { IEmailFieldSchema } from '../../../types'

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
        set: function (this: IEmailFieldSchema, v: boolean) {
          // Set to false if mrf mode regardless of initial value.
          return this.parent().responseMode === FormResponseMode.Multirespondent
            ? false
            : v
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
          lowercase: true,
        },
      ],
      // If allowedEmailDomains is empty, then all email domains should be allowed.
      default: [],
      validate: [
        // Check for duplicate or invalid email domains
        {
          validator: (emailDomains: string[]): boolean => {
            return validateEmailDomains(emailDomains)
          },
          message: 'There are one or more duplicate or invalid email domains.',
        },
        // Check that allowedEmailDomains is empty if hasAllowedEmailDomains is false
        {
          validator: function (this: IEmailFieldSchema): boolean {
            if (
              !this.hasAllowedEmailDomains &&
              this.allowedEmailDomains.length !== 0
            ) {
              return false
            }
            return true
          },
          message:
            'List of allowed email domains should be empty if restrict email domains is disabled',
        },
        // Check that allowedEmailDomains is not empty if hasAllowedEmailDomains is true
        {
          validator: function (this: IEmailFieldSchema): boolean {
            if (
              this.hasAllowedEmailDomains &&
              this.allowedEmailDomains.length === 0
            ) {
              return false
            }
            return true
          },
          message:
            'List of allowed email domains should not be empty if restrict email domains is enabled',
        },
      ],
    },
  })

  return EmailFieldSchema
}

export default createEmailFieldSchema
