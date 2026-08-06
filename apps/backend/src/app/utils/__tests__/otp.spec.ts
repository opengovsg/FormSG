import { GrowthBook } from '@growthbook/growthbook'
import { featureFlags } from 'formsg-shared/constants'

import { generateOtp, generateOtpWithHash, getExpandedOtpLength } from '../otp'

describe('otp', () => {
  describe('generateOtp', () => {
    it('should generate a 6 digit numeric OTP by default', () => {
      for (let i = 0; i < 20; i++) {
        expect(generateOtp()).toMatch(/^\d{6}$/)
      }
    })

    it('should generate a 6 digit numeric OTP when expandedOtpLength is 0', () => {
      expect(generateOtp(0)).toMatch(/^\d{6}$/)
    })

    it('should generate an uppercase alphanumeric OTP of the given expanded length', () => {
      for (let i = 0; i < 20; i++) {
        expect(generateOtp(8)).toMatch(/^[A-Z0-9]{8}$/)
      }
      expect(generateOtp(10)).toMatch(/^[A-Z0-9]{10}$/)
    })
  })

  describe('generateOtpWithHash', () => {
    it('should generate a legacy 6 digit numeric OTP with its hash by default', async () => {
      const result = await generateOtpWithHash()
      const { otp, hashedOtp, otpPrefix } = result._unsafeUnwrap()
      expect(otp).toMatch(/^\d{6}$/)
      expect(hashedOtp).toBeTruthy()
      expect(otpPrefix).toMatch(/^[A-Z]{3}$/)
    })

    it('should generate an expanded alphanumeric OTP with its hash when expandedOtpLength is set', async () => {
      const result = await generateOtpWithHash({ expandedOtpLength: 8 })
      const { otp, hashedOtp, otpPrefix } = result._unsafeUnwrap()
      expect(otp).toMatch(/^[A-Z0-9]{8}$/)
      expect(hashedOtp).toBeTruthy()
      expect(otpPrefix).toMatch(/^[A-Z]{3}$/)
    })
  })

  describe('getExpandedOtpLength', () => {
    it('should return 0 when growthbook is not available', () => {
      expect(getExpandedOtpLength(undefined)).toEqual(0)
    })

    it('should return the feature value from growthbook', () => {
      const mockGrowthbook = {
        getFeatureValue: jest.fn().mockReturnValue(8),
      } as unknown as GrowthBook
      expect(getExpandedOtpLength(mockGrowthbook)).toEqual(8)
      expect(mockGrowthbook.getFeatureValue).toHaveBeenCalledWith(
        featureFlags.otpEntropyExpanded,
        0,
      )
    })
  })
})
