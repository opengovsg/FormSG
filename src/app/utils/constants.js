const MB = 1048576 // 1 megabyte in bytes
// Headers to send to SES so we can parse email notifications
// NOTE: ALWAYS DO CASE-INSENSITIVE CHECKS FOR THE HEADERS!
// SES will automatically convert the case, so case-sensitive
// checks might fail. For example, 'X-FormSG-Form-Id' gets changed
// to 'X-Formsg-Form-ID'.
const EMAIL_HEADERS = {
  formId: 'X-Formsg-Form-ID',
  submissionId: 'X-Formsg-Submission-ID',
  emailType: 'X-Formsg-Email-Type',
}
// EMAIL_HEADERS with keys and values swapped and the new keys (e.g. X-Formsg-Form-ID)
// changed to lowercase (x-formsg-form-id).
// NOTE: ALWAYS DO CASE-INSENSITIVE CHECKS FOR THE HEADERS!
const EMAIL_LOWERCASE_HEADER_TO_KEY = {}
for (const [key, value] of Object.entries(EMAIL_HEADERS)) {
  EMAIL_LOWERCASE_HEADER_TO_KEY[value.toLowerCase()] = key
}
// Types of emails we send
const EMAIL_TYPES = {
  adminResponse: 'Admin (response)',
  loginOtp: 'Login OTP',
  verificationOtp: 'Verification OTP',
  emailConfirmation: 'Email confirmation',
  adminBounce: 'Admin (bounce notification)',
}

module.exports = {
  MB,
  EMAIL_HEADERS,
  EMAIL_TYPES,
  EMAIL_LOWERCASE_HEADER_TO_KEY,
}
