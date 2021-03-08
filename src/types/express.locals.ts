// TODO (#42): remove these types when migrating away from middleware pattern
import { LeanDocument } from 'mongoose'

import { ProcessedFieldResponse } from '../app/modules/submission/submission.types'

import { BasicField } from './field'
import { IEmailFormSchema, IPopulatedForm } from './form'
import { SpcpSession } from './spcp'
import { ISubmissionSchema } from './submission'

export type WithForm<T> = T & {
  form: IPopulatedForm
}

export type WithJsonForm<T> = T & {
  form: LeanDocument<IPopulatedForm>
}

export type WithParsedResponses<T> = T & {
  parsedResponses: ProcessedFieldResponse[]
}

export type ResWithSpcpSession<T> = T & {
  locals: { spcpSession?: SpcpSession }
}

export type ResWithUinFin<T> = T & {
  uinFin?: string
}

export type ResWithHashedFields<T> = T & {
  locals: { hashedFields?: Set<string> }
}

export type SpcpLocals =
  | {
      uinFin: string
      hashedFields?: Set<string>
    }
  | { uinFin: string; userInfo: string }
  | { [key: string]: never } // empty object

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

export type WithSubmission<T> = T & { submission: ISubmissionSchema }

export interface IAttachmentInfo {
  filename: string
  content: Buffer
  fieldId: string
}

export type WithAttachments<T> = T & { attachments: IAttachmentInfo[] }

export type WithEmailData<T> = T & EmailData

export type WithEmailForm<T> = T & { form: IEmailFormSchema }

export type WithEmailModeMetadata<T> = WithEmailData<T> &
  WithAttachments<T> &
  WithEmailForm<T>

export type WithAutoReplyEmailData<T> = WithForm<T> &
  WithSubmission<T> &
  Partial<WithAttachments<T>> &
  Partial<WithEmailData<T>>
