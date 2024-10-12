export type PublicFormIFrameMessage =
  | { state: 'submitting' | 'submitError' }
  | { state: 'submitted'; submissionId: string }

const TRUSTED_TARGET_ORIGINS = [
  'https://pay.gov.sg',
  'https://exp.pay.gov.sg',
  'https://staging.pay.gov.sg',
]

export const postIFrameMessage = (message: PublicFormIFrameMessage): void => {
  // De-risk by wrapping in try-catch even though this is synchronous. This should
  // never block form submission.
  try {
    TRUSTED_TARGET_ORIGINS.forEach((origin) => {
      window.parent.postMessage(message, origin)
    })
  } catch (error) {
    console.warn('Error while posting form state to iframe parent', error)
  }
}
