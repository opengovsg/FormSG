# Security

The following is a non-exhaustive list of measures and notable points relating
to security on FormSG.

## Measures

- One-time passwords (OTPs) are sent to user, then hashed and stored on
  the corresponding user record for verification when user submits OTP
- Login sessions for public servants using OTPs are maintained
  using session cookies
- All forms are in storage mode, where submissions are encrypted end-to-end.
- Communications with SingPass/CorpPass/MyInfo are signed with digital
  signatures both ways, with SingPass/CorpPass payloads encrypted using
  FormSG's public key
- Login sessions for form-fillers using SingPass/CorpPass
  are maintained using session cookies

## Authorization

- Management of forms is restricted to form creators. In storage mode, form creators
  can add other public servants as form editors. In email mode, form creators can
  specify a whitelist of email addresses which will receive all form responses.

## Notable Points

- One-way hashes of form submissions stored on MongoDB.
- E-mail recipients are determined by `emails` values in `FormSchema` mongoose
  model, and the values of all e-mail fields if the form is set to send autoreplies.
- Secrets are injected using environment variables.
