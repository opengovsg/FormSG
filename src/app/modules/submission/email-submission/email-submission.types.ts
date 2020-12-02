import {
  BasicField,
  FieldResponse,
  IBaseResponse,
  IEmailFormSchema,
  IEmailSubmissionSchema,
} from '../../../../types'
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
  answerTemplate: string[]
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

export type WithEmailData<T> = T & EmailData

export interface ParsedMultipartForm {
  responses: FieldResponse[]
}

export interface IAttachmentInfo {
  filename: string
  content: Buffer
  fieldId: string
}

export type WithAttachments<T> = T & { attachments: IAttachmentInfo[] }

export interface SubmissionHash {
  hash: string
  salt: string
}

export type WithEmailForm<T> = T & { form: IEmailFormSchema }

export type WithFormMetadata<T> = WithEmailData<T> &
  WithAttachments<T> &
  WithEmailForm<T>

export type WithSubmission<T> = T & { submission: IEmailSubmissionSchema }

export type WithAutoReplyEmails<T> = T & { replyToEmails: string[] | undefined }

export type WithAdminEmailData<T> = WithFormMetadata<T> &
  WithSubmission<T> &
  WithAutoReplyEmails<T>
