import { BasicField, IBaseResponse } from '../../../../types'
import { ProcessedResponse } from '../submission.types'

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

// When a response has been formatted for email, all answerArray
// should have been converted to answer
interface IResponseFormattedForEmail extends IBaseResponse {
  fieldType: BasicField
  answer: string
}

export type ResponseFormattedForEmail = IResponseFormattedForEmail &
  ProcessedResponse
