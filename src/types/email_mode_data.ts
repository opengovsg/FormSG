import { BasicField } from '../../shared/types'

/**
 * @deprecated Since the fields sent to admins and respondents are the same.
 * Use EmailDataField instead.
 */
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

/**
 * Post standardization, the fields sent to admins and respondents are the same.
 */
export type EmailDataField = {
  question: string
  fieldType: BasicField
  answer: string
  answerTemplate: string[]
}

export type EmailDataFields = EmailDataCollationToolField | EmailDataField

export interface EmailData {
  dataCollationData: EmailDataCollationToolField[]
  formData: EmailDataField[]
}

export interface EmailDataForOneField {
  dataCollationData?: EmailDataCollationToolField
  formData: EmailDataField
}

export interface IAttachmentInfo {
  filename: string
  content: Buffer
  fieldId: string
}
