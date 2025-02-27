const bcrypt = require('bcrypt')
const crypto = require('crypto')

const generateOtp = () => {
  // Generates cryptographically strong pseudo-random data.
  return Array(6)
    .fill(0)
    .map(() => crypto.randomInt(0, 10))
    .join('')
}

const generateOtpPrefix = () => {
  // Generates cryptographically strong pseudo-random data. 65 is the starting ASCII character code for upper case letters.
  return Array(3)
    .fill(0)
    .map(() => String.fromCharCode(65 + crypto.randomInt(0, 26)))
    .join('')
}

const funcc = () => {
  const dataToHash = generateOtp()
  const otpPrefix = generateOtpPrefix()
  bcrypt.hash(dataToHash, 1)
}

for (let i = 0; i < 100; i++) {
  funcc()
}
