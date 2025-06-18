import { AxiosResponse } from 'axios'

export const checkIsCloudflareChallengeError = (response: AxiosResponse) => {
  return (
    response &&
    response.status === 403 &&
    response.headers['server'] === 'cloudflare' &&
    response.headers['cf-mitigated'] &&
    response.headers['cf-ray']
  )
}

export const handleCloudflareChallengeError = () => {
  throw new Error(
    'Your request was blocked due to security reasons. Please try again.',
  )
}
