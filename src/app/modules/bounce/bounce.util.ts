import {
  IBounceNotification,
  IDeliveryNotification,
  IEmailNotification,
} from 'src/types'
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
  bounceInfo: IBounceNotification,
  email: string,
): boolean => {
  return bounceInfo.bounce.bouncedRecipients.some(
    (emailInfo) => emailInfo.emailAddress === email,
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
