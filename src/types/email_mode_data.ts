import { BasicField } from '../../shared/types'

export type EmailRespondentConfirmationField = {
  question: string
  answerTemplate: string[]
  fieldType: BasicField
  answer?: string
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
  | EmailDataCollationToolField
  | EmailAdminDataField

export interface IAttachmentInfo {
  filename: string
  content: Buffer
  fieldId: string
}
