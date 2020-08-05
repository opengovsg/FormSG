/**
 * Headers to send to SES so we can parse email notifications
 *
 * NOTE: ALWAYS DO CASE-INSENSITIVE CHECKS FOR THE HEADERS!
 * SES will automatically convert the case, so case-sensitive
 * checks might fail.
 *
 * For example, 'X-FormSG-Form-Id' gets changed to 'X-Formsg-Form-ID'.
 */
export const EMAIL_HEADERS = {
  formId: 'X-Formsg-Form-ID',
  submissionId: 'X-Formsg-Submission-ID',
  emailType: 'X-Formsg-Email-Type',
}

// Types of emails we send
export const EMAIL_TYPES = {
  adminResponse: 'Admin (response)',
  loginOtp: 'Login OTP',
  verificationOtp: 'Verification OTP',
  emailConfirmation: 'Email confirmation',
  adminBounce: 'Admin (bounce notification)',
}
