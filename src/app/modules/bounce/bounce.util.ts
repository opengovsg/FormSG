import {
  IBounceNotification,
  IDeliveryNotification,
  IEmailNotification,
} from '../../../types'

import { UserWithContactNumber } from './bounce.types'
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
 * @param smsResults Array of Promise.allSettled results
 * @param smsRecipients Recipients who were SMSed. This array must correspond
 * exactly to smsResults, i.e. the result at smsResults[i] corresponds
 * to the result of the attempt to SMS smsRecipients[i]
 * @returns the contact details of SMSes sent successfully
 */
export const extractSuccessfulSmsRecipients = (
  smsResults: PromiseSettledResult<boolean>[],
  smsRecipients: UserWithContactNumber[],
): UserWithContactNumber[] => {
  return smsResults.reduce<UserWithContactNumber[]>((acc, result, index) => {
    if (result.status === 'fulfilled') {
      acc.push(smsRecipients[index])
    }
    return acc
  }, [])
}

/**
 * Extracts the errors from results of attempting to send SMSes
 * @param smsResults Array of Promise.allSettled results
 * @returns Array of errors
 */
export const extractSmsErrors = (
  smsResults: PromiseSettledResult<boolean>[],
): PromiseRejectedResult['reason'][] => {
  return smsResults.reduce<PromiseRejectedResult['reason'][]>((acc, result) => {
    if (result.status === 'rejected') {
      acc.push(result.reason)
    }
    return acc
  }, [])
}
