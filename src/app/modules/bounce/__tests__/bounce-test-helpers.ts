import { ObjectId } from 'bson'
import { merge, pick } from 'lodash'

import { EmailType } from 'src/app/services/mail/mail.constants'
import {
  BounceType,
  IBounce,
  IBounceNotification,
  IBounceSchema,
  IDeliveryNotification,
  IEmailNotification,
  ISnsNotification,
} from 'src/types'

export const MOCK_SNS_BODY: ISnsNotification = {
  Type: 'type',
  MessageId: 'message-id',
  TopicArn: 'topic-arn',
  Message: 'message',
  Timestamp: 'timestamp',
  SignatureVersion: '1',
  Signature: 'signature',
  SigningCertURL: 'https://fakeawsurl.amazonaws.com/cert.pem',
}

const makeEmailNotification = (
  notificationType: 'Bounce' | 'Delivery',
  formId: ObjectId,
  submissionId: ObjectId,
  recipientList: string[],
  emailType: EmailType,
): IEmailNotification => {
  return {
    notificationType,
    mail: {
      source: 'donotreply@form.gov.sg',
      destination: recipientList,
      headers: [
        {
          name: 'X-Formsg-Form-ID',
          value: String(formId),
        },
        {
          name: 'X-Formsg-Submission-ID',
          value: String(submissionId),
        },
        {
          name: 'X-Formsg-Email-Type',
          value: emailType,
        },
      ],
      commonHeaders: {
        subject: `Title (#${submissionId})`,
        to: recipientList,
        from: 'donotreply@form.gov.sg',
      },
    },
  }
}

export const makeBounceNotification = ({
  formId,
  submissionId,
  recipientList,
  bouncedList,
  bounceType,
  emailType,
}: {
  formId?: ObjectId
  submissionId?: ObjectId
  recipientList?: string[]
  bouncedList?: string[]
  bounceType?: BounceType
  emailType?: EmailType
} = {}): IBounceNotification => {
  formId ??= new ObjectId()
  submissionId ??= new ObjectId()
  recipientList ??= []
  bouncedList ??= []
  emailType ??= EmailType.AdminResponse
  return merge(
    makeEmailNotification(
      'Bounce',
      formId,
      submissionId,
      recipientList,
      emailType,
    ),
    {
      bounce: {
        bounceType,
        bouncedRecipients: bouncedList.map((emailAddress) => ({
          emailAddress,
        })),
      },
    },
  ) as IBounceNotification
}

export const makeDeliveryNotification = ({
  formId,
  submissionId,
  recipientList,
  deliveredList,
  emailType,
}: {
  formId?: ObjectId
  submissionId?: ObjectId
  recipientList?: string[]
  deliveredList?: string[]
  emailType?: EmailType
} = {}): IDeliveryNotification => {
  formId ??= new ObjectId()
  submissionId ??= new ObjectId()
  recipientList ??= []
  deliveredList ??= []
  emailType ??= EmailType.AdminResponse
  return merge(
    makeEmailNotification(
      'Delivery',
      formId,
      submissionId,
      recipientList,
      emailType,
    ),
    {
      delivery: {
        recipients: deliveredList,
      },
    },
  ) as IDeliveryNotification
}

// Omit mongoose values from Bounce document
export const extractBounceObject = (
  bounce: IBounceSchema,
): Omit<IBounce, '_id'> => {
  const extracted = pick(bounce.toObject(), [
    'formId',
    'hasAutoEmailed',
    'hasAutoSmsed',
    'expireAt',
    'bounces',
  ])
  return extracted
}
