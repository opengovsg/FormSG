import { ObjectId } from 'bson'
import { cloneDeep, merge, pick } from 'lodash'

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
  emailType: 'Admin (response)' | 'Email confirmation',
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
        subject: `Title (Ref: ${submissionId})`,
        to: recipientList,
        from: 'donotreply@form.gov.sg',
      },
    },
  }
}

export const makeBounceNotification = (
  formId: ObjectId = new ObjectId(),
  submissionId: ObjectId = new ObjectId(),
  recipientList: string[] = [],
  bouncedList: string[] = [],
  bounceType: BounceType = BounceType.Permanent,
  emailType: 'Admin (response)' | 'Email confirmation' = 'Admin (response)',
): ISnsNotification => {
  const Message = merge(
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
  const body = cloneDeep(MOCK_SNS_BODY)
  body.Message = JSON.stringify(Message)
  return body
}

export const makeDeliveryNotification = (
  formId: ObjectId = new ObjectId(),
  submissionId: ObjectId = new ObjectId(),
  recipientList: string[] = [],
  deliveredList: string[] = [],
  emailType: 'Admin (response)' | 'Email confirmation' = 'Admin (response)',
): ISnsNotification => {
  const Message = merge(
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
  const body = cloneDeep(MOCK_SNS_BODY)
  body.Message = JSON.stringify(Message)
  return body
}

// Omit mongoose values from Bounce document
export const extractBounceObject = (
  bounce: IBounceSchema,
): Omit<IBounce, '_id'> => {
  const extracted = pick(bounce.toObject(), [
    'formId',
    'hasAlarmed',
    'expireAt',
    'bounces',
  ])
  return extracted
}
