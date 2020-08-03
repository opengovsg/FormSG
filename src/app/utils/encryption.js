const { decode: decodeBase64 } = require('@stablelib/base64')

const checkIsEncryptedEncoding = (encryptedStr) => {
  if (typeof encryptedStr !== 'string') {
    throw new Error('encryptedStr is not of type `string`')
  }

  const [submissionPublicKey, nonceEncrypted] = encryptedStr.split(';')
  const [nonce, encrypted] = nonceEncrypted.split(':')
  if (!submissionPublicKey || !nonce || !encrypted) {
    throw new Error('Missing data')
  }

  try {
    decodeBase64(submissionPublicKey)
    decodeBase64(nonce)
    decodeBase64(encrypted)
    return true
  } catch (err) {
    return false
  }
}

module.exports = {
  checkIsEncryptedEncoding,
}
