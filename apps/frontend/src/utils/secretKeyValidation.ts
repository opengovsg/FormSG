import formsgSdk from '~utils/formSdk'

export const SECRET_KEY_REGEX = /^[a-zA-Z0-9/+]+={0,2}$/

export const isKeypairValid = (
  publicKey: string,
  secretKey: string,
): boolean => {
  const trimmedSecretKey = secretKey.trim()
  return (
    SECRET_KEY_REGEX.test(trimmedSecretKey) &&
    formsgSdk.crypto.valid(publicKey, trimmedSecretKey)
  )
}
