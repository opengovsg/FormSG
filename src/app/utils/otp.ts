import crypto from 'crypto'

/**
 * Randomly generates and returns a 6 digit OTP.
 * @return 6 digit OTP string
 */
export const generateOtp = () => {
  const length = 6
  const chars = '0123456789'
  // Generates cryptographically strong pseudo-random data.
  // The size argument is a number indicating the number of bytes to generate.
  const rnd = crypto.randomBytes(length)
  const d = chars.length / 256
  const digits = new Array(length)
  for (let i = 0; i < length; i++) {
    digits[i] = chars[Math.floor(rnd[i] * d)]
  }
  return digits.join('')
}
