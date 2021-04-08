// TODO (#42): remove these types when migrating away from middleware pattern
import { BasicField } from './field'

export type ResWithUinFin<T> = T & {
  uinFin?: string
}

export type ResWithHashedFields<T> = T & {
  locals: { hashedFields?: Set<string> }
}

export type EmailRespondentConfirmationField = {
  question: string
  answerTemplate: string[]
}

export type EmailDataCollationToolField = {
  question: string
  answer: string
}

export type EmailAdminDataField = {
  question: string
  answer: string
  fieldType: BasicField
  answerTemplate: string[]
}

export type EmailDataFields =
  | EmailRespondentConfirmationField
  | EmailDataCollationToolField
  | EmailAdminDataField

export interface EmailData {
  autoReplyData: EmailRespondentConfirmationField[]
  dataCollationData: EmailDataCollationToolField[]
  formData: EmailAdminDataField[]
}

export interface EmailDataForOneField {
  autoReplyData?: EmailRespondentConfirmationField
  dataCollationData?: EmailDataCollationToolField
  formData: EmailAdminDataField
}

export interface IAttachmentInfo {
  filename: string
  content: Buffer
  fieldId: string
}
