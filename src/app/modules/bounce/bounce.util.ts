import { IBounceNotification, IEmailNotification } from 'src/types'
/**
 * Extracts custom headers which we send with all emails, such as form ID, submission ID
 * and email type (admin response, email confirmation OTP etc).
 * @param body Body of SNS notification
 * @param header Key of header to extract
 */
export const extractHeader = (
  body: IEmailNotification,
  header: string,
): string => {
  return body.mail.headers.find(
    (mailHeader) => mailHeader.name.toLowerCase() === header.toLowerCase(),
  )?.value
}

/**
 * Whether a bounce notification says a given email has bounced.
 * @param bounceInfo Bounce notification from SNS
 * @param email Email address to check
 */
export const hasEmailBounced = (
  bounceInfo: IBounceNotification,
  email: string,
): boolean => {
  return bounceInfo.bounce.bouncedRecipients.some(
    (emailInfo) => emailInfo.emailAddress === email,
  )
}
