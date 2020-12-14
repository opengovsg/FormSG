// TODO (#42): remove these types when migrating away from middleware pattern

import { BasicField } from './field'
import { IEmailFormSchema, IPopulatedForm } from './form'
import { SpcpSession } from './spcp'
import { ISubmissionSchema } from './submission'

export type WithForm<T> = T & {
  form: IPopulatedForm
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
      hashedFields: Set<string>
    }
  | { uinFin: string; userInfo: string }
  | { [key: string]: never } // empty object

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

export type WithAutoReplyEmailData<T> =
  | (WithForm<T> & WithSubmission<T>)
  | WithEmailModeMetadata<T>
