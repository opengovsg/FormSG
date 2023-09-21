import {
  IBounceNotification,
  IDeliveryNotification,
  IEmailNotification,
} from '../../../types'
import { UserWithContactNumber } from '../user/user.types'

import { SendBounceSmsNotificationError } from './bounce.errors'

/**
 * Extracts custom headers which we send with all emails, such as form ID, submission ID
 * and email type (admin response, email confirmation OTP etc).
 * @param body Body of SNS notification
 * @param header Key of header to extract
 * @returns the header from the body, if any.
 */
export const extractHeader = (
  body: IEmailNotification,
  header: string,
): string | undefined => {
  return body.mail.headers.find(
    (mailHeader) => mailHeader.name.toLowerCase() === header.toLowerCase(),
  )?.value
}

/**
 * Whether a bounce notification says a given email has bounced.
 * @param bounceInfo Bounce notification from SNS
 * @param email Email address to check
 * @returns true if the email as bounced, false otherwise
 */
export const hasEmailBounced = (
  snsInfo: IEmailNotification,
  email: string,
): snsInfo is IBounceNotification => {
  return (
    isBounceNotification(snsInfo) &&
    snsInfo.bounce.bouncedRecipients.some(
      (emailInfo) => emailInfo.emailAddress === email,
    )
  )
}

/**
 * Whether a bounce notification says a given email has been delivered.
 * @param bounceInfo Bounce notification from SNS
 * @param email Email address to check
 * @returns true if the email as bounced, false otherwise
 */
export const hasEmailBeenDelivered = (
  snsInfo: IEmailNotification,
  email: string,
): snsInfo is IDeliveryNotification => {
  return (
    isDeliveryNotification(snsInfo) &&
    snsInfo.delivery.recipients.includes(email)
  )
}

// If an email notification is for bounces
export const isBounceNotification = (
  body: IEmailNotification,
): body is IBounceNotification => body.notificationType === 'Bounce'

// If an email notification is for successful delivery
export const isDeliveryNotification = (
  body: IEmailNotification,
): body is IDeliveryNotification => body.notificationType === 'Delivery'

/**
 * Filters the given SMS recipients to only those which were sent succesfully
 * @param smsErrors Array of sms errors
 * @param smsRecipients Recipients who were SMSed
 * @returns the contact details of SMSes sent successfully
 */
export const extractSuccessfulSmsRecipients = (
  smsErrors: SendBounceSmsNotificationError[],
  smsRecipients: UserWithContactNumber[],
): UserWithContactNumber[] => {
  // Get recipients which errored
  const failedRecipients = smsErrors.map((error) => error.meta.contact)
  return smsRecipients.filter(
    (recipient) => !failedRecipients.includes(recipient.contact),
  )
}

/**
 * Correctly parse emails provided in SNS bounce notification commonHeaders.to
 * field.
 * SNS notifications commonHeaders can have multiple emails comma-separated in
 * one value of the array, evidenced in the notification examples:
 * https://docs.aws.amazon.com/ses/latest/dg/notification-examples.html
 * @param emails Array of emails or comma-separated emails
 * @returns array of single-valued emails
 */
export const parseBounceNotificationCommonHeadersToEmails = (
  emails: string[],
) => emails.flatMap((emails) => emails.split(',').map((email) => email.trim()))
