import {
  FeatureNames,
  ISms,
  RegisteredFeature,
} from 'src/config/feature-manager'

import { createSmsFactory } from '../sms.factory'

describe('sms.factory', () => {
  describe('sms feature disabled', () => {
    const MOCK_DISABLED_SMS_FEATURE: RegisteredFeature<FeatureNames.Sms> = {
      isEnabled: false,
      props: {} as ISms,
    }

    const SmsFactory = createSmsFactory(MOCK_DISABLED_SMS_FEATURE)

    it('should throw error when invoking sendAdminContactOtp', () => {
      // Act
      const invocation = () =>
        SmsFactory.sendAdminContactOtp('anything', 'anything', 'anything')

      // Assert
      expect(invocation).toThrowError(
        'sendAdminContactOtp: SMS feature must be enabled in Feature Manager first',
      )
    })

    it('should throw error when invoking sendVerificationOtp', () => {
      // Act
      const invocation = () =>
        SmsFactory.sendVerificationOtp('anything', 'anything', 'anything')

      // Assert
      expect(invocation).toThrowError(
        'sendVerificationOtp: SMS feature must be enabled in Feature Manager first',
      )
    })
  })
})
