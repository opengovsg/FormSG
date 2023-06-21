import convict, { Schema } from 'convict'

export interface ITurnstile {
  turnstileSiteKey: string
}

const turnstileSchema: Schema<ITurnstile> = {
  turnstileSiteKey: {
    doc: 'Cloudflare Turnstile site key',
    format: String,
    default: 'replace',
    env: 'TURNSTILE',
  },
}

export const turnstileConfig = convict(turnstileSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
