import { BasicField } from '../../../../types'

export interface EmailAutoReplyField {
  question: string
  answerTemplate: string[]
}

export interface EmailJsonField {
  question: string
  answer: string
}

export interface EmailFormField {
  question: string
  answer: string
  fieldType: BasicField
}

export interface EmailData {
  autoReplyData: EmailAutoReplyField[]
  jsonData: EmailJsonField[]
  formData: EmailFormField[]
}

export interface EmailDataForOneField {
  autoReplyData?: EmailAutoReplyField
  jsonData?: EmailJsonField
  formData: EmailFormField
}
