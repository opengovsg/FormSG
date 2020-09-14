import Mail from 'nodemailer/lib/mailer'
import { OperationOptions } from 'retry'

import { AutoReplyOptions } from './field'
import { IFormSchema, IPopulatedForm } from './form'
import { ISubmissionSchema } from './submission'

export type SendMailOptions = {
  mailId?: string
  formId?: string
}

export type SendSingleAutoreplyMailArgs = {
  form: Pick<IPopulatedForm, 'admin' | '_id' | 'title'>
  submission: Pick<ISubmissionSchema, 'id' | 'created'>
  autoReplyMailData: AutoReplyMailData
  attachments: Mail.Attachment[]
  formSummaryRenderData: AutoreplySummaryRenderData
  index: number
}

export type SendAutoReplyEmailsArgs = {
  form: Pick<IPopulatedForm, 'admin' | '_id' | 'title'>
  submission: Pick<ISubmissionSchema, 'id' | 'created'>
  attachments?: Mail.Attachment[]
  responsesData: { question: string; answerTemplate: string[] }[]
  autoReplyMailDatas: AutoReplyMailData[]
}

export type MailServiceParams = {
  appName?: string
  appUrl?: string
  transporter?: Mail
  senderMail?: string
  retryParams?: Partial<OperationOptions>
}

export type AutoReplyMailData = {
  email: string
  subject?: AutoReplyOptions['autoReplySubject']
  sender?: AutoReplyOptions['autoReplySender']
  body?: AutoReplyOptions['autoReplyMessage']
  includeFormSummary?: AutoReplyOptions['includeFormSummary']
}

export type AutoreplySummaryRenderData = {
  refNo: ISubmissionSchema['_id']
  formTitle: IFormSchema['title']
  submissionTime: string
  // TODO (#42): Add proper types once the type is determined.
  formData: any
  formUrl: string
}

export type MailOptions = Omit<Mail.Options, 'to'> & {
  to: string | string[]
}

export type SubmissionToAdminHtmlData = {
  refNo: string
  formTitle: string
  submissionTime: string
  // TODO (#42): Add proper types once the type is determined.
  formData: any[]
  jsonData: {
    question: string
    answer: string | number
  }[]
  appName: string
}

export type AutoreplyHtmlData =
  | ({ autoReplyBody: string[] } & AutoreplySummaryRenderData)
  | { autoReplyBody: string[] }
