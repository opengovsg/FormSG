import Twilio from 'twilio'

import {
  FeatureNames,
  ISms,
  RegisteredFeature,
} from 'src/config/feature-manager'

import { createSmsFactory } from '../sms.factory'
import * as SmsService from '../sms.service'
import { TwilioConfig } from '../sms.types'

// This is hoisted and thus a const cannot be passed in.
jest.mock('twilio', () =>
  jest.fn().mockImplementation(() => ({
    mocked: 'this is mocked',
  })),
)

const MOCKED_TWILIO = ({
  mocked: 'this is mocked',
} as unknown) as Twilio.Twilio

describe('sms.factory', () => {
  beforeEach(() => jest.clearAllMocks())

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

  describe('sms feature enabled', () => {
    const MOCK_ENABLED_SMS_FEATURE: RegisteredFeature<FeatureNames.Sms> = {
      isEnabled: true,
      props: {
        twilioAccountSid: 'ACrandomTwilioSid',
        twilioApiKey: 'SKrandomTwilioAPIKEY',
        twilioApiSecret: 'this is a super secret',
        twilioMsgSrvcSid: 'formsg-is-great-pleasehelpme',
      },
    }

    const SmsFactory = createSmsFactory(MOCK_ENABLED_SMS_FEATURE)

    it('should call SmsService counterpart when invoking sendAdminContactOtp', async () => {
      // Arrange
      const serviceContactSpy = jest
        .spyOn(SmsService, 'sendAdminContactOtp')
        .mockResolvedValue(true)

      const mockArguments: Parameters<typeof SmsFactory.sendAdminContactOtp> = [
        'mockRecipient',
        'mockOtp',
        'mockFormId',
      ]

      // Act
      await SmsFactory.sendAdminContactOtp(...mockArguments)

      // Assert
      const expectedTwilioConfig: TwilioConfig = {
        msgSrvcSid: MOCK_ENABLED_SMS_FEATURE.props.twilioMsgSrvcSid,
        client: MOCKED_TWILIO,
      }

      expect(serviceContactSpy).toHaveBeenCalledTimes(1)
      expect(serviceContactSpy).toHaveBeenCalledWith(
        ...mockArguments,
        expectedTwilioConfig,
      )
    })

    it('should call SmsService counterpart when invoking sendVerificationOtp', async () => {
      // Arrange
      const serviceVfnSpy = jest
        .spyOn(SmsService, 'sendVerificationOtp')
        .mockResolvedValue(true)

      const mockArguments: Parameters<typeof SmsFactory.sendAdminContactOtp> = [
        'mockRecipient',
        'mockOtp',
        'mockUserId',
      ]

      // Act
      await SmsFactory.sendVerificationOtp(...mockArguments)

      // Assert
      const expectedTwilioConfig: TwilioConfig = {
        msgSrvcSid: MOCK_ENABLED_SMS_FEATURE.props.twilioMsgSrvcSid,
        client: MOCKED_TWILIO,
      }

      expect(serviceVfnSpy).toHaveBeenCalledTimes(1)
      expect(serviceVfnSpy).toHaveBeenCalledWith(
        ...mockArguments,
        expectedTwilioConfig,
      )
    })
  })
})
