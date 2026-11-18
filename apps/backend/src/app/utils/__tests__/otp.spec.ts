import bcrypt from 'bcrypt'

import { generateOtp, generateOtpWithHash } from '../otp'

describe('otp', () => {
  describe('generateOtp', () => {
    it('should generate an 8 character uppercase alphanumeric OTP', () => {
      for (let i = 0; i < 20; i++) {
        expect(generateOtp()).toMatch(/^[A-Z0-9]{8}$/)
      }
    })
  })

  describe('generateOtpWithHash', () => {
    it('should generate an 8 character uppercase alphanumeric OTP with its hash', async () => {
      const result = await generateOtpWithHash()
      const { otp, hashedOtp, otpPrefix } = result._unsafeUnwrap()
      expect(otp).toMatch(/^[A-Z0-9]{8}$/)
      expect(hashedOtp).toBeTruthy()
      expect(otpPrefix).toMatch(/^[A-Z]{3}$/)
    })

    it('should hash the OTP with a bcrypt cost of 10', async () => {
      const result = await generateOtpWithHash()
      const { otp, hashedOtp } = result._unsafeUnwrap()
      expect(bcrypt.getRounds(hashedOtp)).toEqual(10)
      await expect(bcrypt.compare(otp, hashedOtp)).resolves.toBe(true)
    })
  })
})
