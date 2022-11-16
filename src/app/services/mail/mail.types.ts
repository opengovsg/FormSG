import Mail from 'nodemailer/lib/mailer'
import { OperationOptions } from 'retry'

import { AutoReplyOptions } from '../../../../shared/types'
import { SMS_WARNING_TIERS } from '../../../../shared/utils/verification'
import {
  EmailAdminDataField,
  FormLinkView,
  IFormSchema,
  IPopulatedForm,
  ISubmissionSchema,
} from '../../../types'

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
  responsesData: Pick<EmailAdminDataField, 'question' | 'answerTemplate'>[]
  autoReplyMailDatas: AutoReplyMailData[]
}

// TODO #130 Remove references to US SES when SES migration is over (opengovsg/formsg-private#130)
export type MailServiceParams = {
  appName?: string
  appUrl?: string
  transporter_us?: Mail
  transporter_sg?: Mail
  senderMail?: string
  officialMail?: string
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
  formData: Pick<EmailAdminDataField, 'question' | 'answerTemplate'>[]
  formUrl: string
}

export type MailOptions = Omit<Mail.Options, 'to'> & {
  to: string | string[]
}

export type SubmissionToAdminHtmlData = {
  refNo: string
  formTitle: string
  submissionTime: string
  formData: EmailAdminDataField[]
  dataCollationData: {
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

export type AdminSmsDisabledData = {
  forms: FormLinkView<IPopulatedForm>[]
} & SmsVerificationTiers

export type CollabSmsDisabledData = {
  form: FormLinkView<IPopulatedForm>
} & SmsVerificationTiers

export type AdminSmsWarningData = {
  forms: FormLinkView<IPopulatedForm>[]
  numAvailable: string
  smsVerificationLimit: string
}

export type CollabSmsWarningData = {
  form: FormLinkView<IPopulatedForm>
  percentageUsed: string
  smsVerificationLimit: string
}

type SmsVerificationTiers = {
  smsVerificationLimit: string
  // Ensure that all tiers are covered
  smsWarningTiers: { [K in keyof typeof SMS_WARNING_TIERS]: string }
}
