import { BasicField } from 'formsg-shared/types'

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

export type EmailDataField = {
  question: string
  answer: string
  fieldType: BasicField
  answerTemplate: string[]
}

export type EmailDataFields = EmailDataCollationToolField | EmailDataField

export interface IAttachmentInfo {
  filename: string
  content: Buffer
  fieldId: string
}
