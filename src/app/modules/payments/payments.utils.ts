import config from '../../config/config'

export const getRedirectUri = (): string => {
  if (config.isDev) {
    return `http://localhost:5001/api/v3/payments/stripe/callback`
  }
  return `https://${config.app.appUrl}/api/v3/payments/stripe/callback`
}
