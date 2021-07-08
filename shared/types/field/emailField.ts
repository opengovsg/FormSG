import { FieldBase, VerifiableFieldBase } from './base'

export type AutoReplyOptions = {
  hasAutoReply: boolean
  autoReplySubject: string
  autoReplySender: string
  autoReplyMessage: string
  includeFormSummary: boolean
}

export interface EmailFieldBase extends FieldBase, VerifiableFieldBase {
  autoReplyOptions: AutoReplyOptions
  hasAllowedEmailDomains: boolean
  allowedEmailDomains: string[]
}
