import { AutoReplyOptions } from 'formsg-shared/types'
import Mail from 'nodemailer/lib/mailer'
import { OperationOptions } from 'retry'

import {
  EmailDataField,
  IFormSchema,
  IPopulatedForm,
  ISubmissionSchema,
} from '../../../types'
import { smsThreshold } from '../sms/sms.utils'

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
  isPaymentEnabled?: boolean
}

export type SendAutoReplyEmailsArgs = {
  form: IPopulatedForm
  submission: Pick<ISubmissionSchema, 'id' | 'created'>
  submissionAttachments?: Mail.Attachment[]
  responsesData: (Pick<
    EmailDataField,
    'question' | 'answerTemplate' | 'fieldType'
  > & {
    answer?: EmailDataField['answer']
  })[]
  autoReplyMailDatas: AutoReplyMailData[]
  pdfAttachment?: Mail.Attachment
  isPaymentEnabled: boolean
  useStandardisedEmailTemplate?: boolean
}

export type MailServiceParams = {
  appName?: string
  appUrl?: string
  transporter?: Mail
  senderMail?: string
  officialMail?: string
  retryParams?: OperationOptions
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
  formData: (Pick<EmailDataField, 'question' | 'answerTemplate'> & {
    answer?: EmailDataField['answer']
  })[]
  formUrl: string
}

export type MailOptions = Omit<Mail.Options, 'to'> & {
  to: string | string[]
}

export type SubmissionToAdminHtmlData = {
  refNo: string
  formTitle: string
  submissionTime: string
  formData: EmailDataField[]
  dataCollationData?: {
    question: string
    answer: string | number
  }[]
  appName: string
}

type AutoreplyHtmlDefaultBody = {
  submissionId: string
  autoReplyBody: string[]
}

export type AutoreplyHtmlData =
  | (AutoreplyHtmlDefaultBody & AutoreplySummaryRenderData)
  | AutoreplyHtmlDefaultBody

export type BounceNotificationHtmlData = {
  formTitle: string
  formLink: string
  bouncedRecipients: string
  appName: string
}

export type FormDeactivatedNotificationHtmlData = {
  formTitle: string
  formLink: string
  appName: string
}

export type SmsThresholdWarningNotificationHtmlData =
  FormDeactivatedNotificationHtmlData & {
    smsThreshold: smsThreshold
  }

export type PaymentConfirmationData = {
  appName: string
  formTitle: string
  submissionId: string
  invoiceUrl: string
  amountPaid: string
}

export type IssueReportedNotificationData = {
  appName: string
  formTitle: string
  formResultUrl: string
}
