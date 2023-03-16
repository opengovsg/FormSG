import dedent from 'dedent-js'

export const renderFormDeactivatedSms = (formTitle: string): string => dedent`
  Due to responses bouncing from all recipient inboxes, your form "${formTitle}" has been automatically deactivated to prevent further response loss.

  Please ensure your recipient email addresses (Settings tab) have the ability to receive emailed responses from us. Invalid email addresses should be deleted, and full inboxes should be cleared.

  If a systemic email issue is affecting email delivery, consider temporarily deactivating your form until email delivery is stable, or switching the form to Storage mode to continue receiving responses.
`

export const renderBouncedSubmissionSms = (formTitle: string): string => dedent`
  A response to your form "${formTitle}" has bounced from all recipient inboxes. Bounced responses cannot be recovered. To prevent more bounces, please ensure recipient email addresses are correct, and clear any full inboxes.
`

export const renderVerificationSms = (
  otp: string,
  otpPrefix: string,
  appHost: string,
): string => dedent`Use the OTP ${otpPrefix}-${otp} to submit on ${appHost}.

  Never share your OTP with anyone else. If you did not request this OTP, you can safely ignore this SMS.`
