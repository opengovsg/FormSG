import convict, { Schema } from 'convict'

export interface IWogaa {
  wogaaSecretKey: string
  wogaaStartEndpoint: string
  wogaaSubmitEndpoint: string
  wogaaFeedbackEndpoint: string
}

const wogaaSchema: Schema<IWogaa> = {
  wogaaSecretKey: {
    doc: 'Wogaa shared secret key',
    format: String,
    default: null,
    env: 'WOGAA_SECRET_KEY',
  },
  wogaaStartEndpoint: {
    doc: 'Wogaa endpoint when a form is loaded',
    format: String,
    default: '',
    env: 'WOGAA_START_ENDPOINT',
  },
  wogaaSubmitEndpoint: {
    doc: 'Wogaa endpoint when a form is loaded',
    format: String,
    default: '',
    ENV: 'WOGAA_SUBMIT_ENDPOINT',
  },
  wogaaFeedbackEndpoint: {
    doc: 'Wogaa endpoint when a form is loaded',
    format: String,
    default: '',
    env: 'WOGAA_FEEDBACK_ENDPOINT',
  },
}

export const captchaConfig = convict(wogaaSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
