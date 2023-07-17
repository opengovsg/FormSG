import convict, { Schema } from 'convict'

export interface ITurnstile {
  turnstileSiteKey: string
  turnstilePrivateKey: string
}

const turnstileSchema: Schema<ITurnstile> = {
  turnstileSiteKey: {
    doc: 'Turnstile Captcha site key',
    format: String,
    // dummy test keys provided by turnstile at https://developers.cloudflare.com/turnstile/reference/testing/
    // always forces an interactive challenge
    default: '3x00000000000000000000FF',
    env: 'TURNSTILE_CAPTCHA',
  },
  turnstilePrivateKey: {
    doc: 'Turnstile Captcha private key',
    format: String,
    // dummy test keys provided by turnstile at https://developers.cloudflare.com/turnstile/reference/testing/
    // always passes
    default: '1x0000000000000000000000000000000AA',
    env: 'TURNSTILE_CAPTCHA_PRIVATE',
  },
}

export const turnstileConfig = convict(turnstileSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
