/**
 * More info on SNS verification:
 * https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
 */
export interface ISnsNotification {
  Message: string
  MessageId: string
  Timestamp: string
  TopicArn: string
  Type: string
  Signature: string
  SigningCertURL: string
  SignatureVersion: string
}

/**
 * The structure of SNS notifications for SES can be found here:
 * https://docs.aws.amazon.com/ses/latest/DeveloperGuide/notification-contents.html
 * This interface only contains the more important fields.
 */
export interface IEmailNotification {
  notificationType: 'Bounce' | 'Complaint' | 'Delivery'
  mail: {
    source: string
    destination: string[]
    headers: {
      name: string
      value: string
    }[]
    commonHeaders: {
      from: string
      to: string[]
      subject: string
    }
  }
}

export interface IBounceNotification extends IEmailNotification {
  notificationType: 'Bounce'
  bounce: {
    bounceType: string
    bounceSubType: string
    bouncedRecipients: {
      emailAddress: string
    }[]
  }
}

export interface IDeliveryNotification extends IEmailNotification {
  notificationType: 'Delivery'
  delivery: {
    recipients: string[]
  }
}

// If an email notification is for bounces
export const isBounceNotification = (
  body: IEmailNotification,
): body is IBounceNotification => body.notificationType === 'Bounce'

// If an email notification is for successful delivery
export const isDeliveryNotification = (
  body: IEmailNotification,
): body is IDeliveryNotification => body.notificationType === 'Delivery'
