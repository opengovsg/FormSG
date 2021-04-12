import { ok } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { FeatureNames, RegisteredFeature } from 'src/app/config/feature-manager'

import { MissingFeatureError } from '../../core/core.errors'
import { createVerifiedContentFactory } from '../verified-content.factory'
import * as VerifiedContentService from '../verified-content.service'
import {
  EncryptVerificationContentParams,
  GetVerifiedContentParams,
  SpVerifiedContent,
} from '../verified-content.types'

jest.mock('../verified-content.service')
const MockVerifiedContentService = mocked(VerifiedContentService)

describe('verified-content.factory', () => {
  describe('verified content feature disabled', () => {
    const MOCK_DISABLED_FEAT: RegisteredFeature<FeatureNames.WebhookVerifiedContent> = {
      isEnabled: false,
    }

    const VerifiedContentFactory = createVerifiedContentFactory(
      MOCK_DISABLED_FEAT,
    )

    it('should return MissingFeatureError when invoking getVerifiedContent', async () => {
      // Act
      const actualResult = VerifiedContentFactory.getVerifiedContent(
        {} as GetVerifiedContentParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MissingFeatureError(FeatureNames.WebhookVerifiedContent),
      )
    })

    it('should return MissingFeatureError when invoking encryptVerifiedContent', async () => {
      // Act
      const actualResult = VerifiedContentFactory.encryptVerifiedContent(
        {} as EncryptVerificationContentParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MissingFeatureError(FeatureNames.WebhookVerifiedContent),
      )
    })
  })

  describe('verified content feature enabled but missing signing secret key', () => {
    const MOCK_ENABLED_FEAT_WO_KEY: RegisteredFeature<FeatureNames.WebhookVerifiedContent> = {
      isEnabled: true,
    }

    const VerifiedContentFactory = createVerifiedContentFactory(
      MOCK_ENABLED_FEAT_WO_KEY,
    )

    it('should return MissingFeatureError when invoking getVerifiedContent', async () => {
      // Act
      const actualResult = VerifiedContentFactory.getVerifiedContent(
        {} as GetVerifiedContentParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MissingFeatureError(FeatureNames.WebhookVerifiedContent),
      )
    })

    it('should return MissingFeatureError when invoking encryptVerifiedContent', async () => {
      // Act
      const actualResult = VerifiedContentFactory.encryptVerifiedContent(
        {} as EncryptVerificationContentParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MissingFeatureError(FeatureNames.WebhookVerifiedContent),
      )
    })
  })

  describe('verified content feature enabled with signing secret key', () => {
    const MOCK_ENABLED_FEAT: RegisteredFeature<FeatureNames.WebhookVerifiedContent> = {
      isEnabled: true,
      props: {
        signingSecretKey: 'some secret key',
      },
    }

    const VerifiedContentFactory = createVerifiedContentFactory(
      MOCK_ENABLED_FEAT,
    )

    it('should invoke VerifiedContentService.getVerifiedContent', async () => {
      // Arrange
      const expected: SpVerifiedContent = {
        uinFin: 'some uin',
      }
      MockVerifiedContentService.getVerifiedContent.mockReturnValueOnce(
        ok(expected),
      )

      // Act
      const actualResult = VerifiedContentFactory.getVerifiedContent(
        {} as GetVerifiedContentParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(expected)
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).toHaveBeenCalledTimes(1)
    })

    it('should invoke VerifiedContentService.encryptVerifiedContent', async () => {
      // Arrange
      const expected = 'some encryption'
      MockVerifiedContentService.encryptVerifiedContent.mockReturnValueOnce(
        ok(expected),
      )

      // Act
      const actualResult = VerifiedContentFactory.encryptVerifiedContent(
        {} as EncryptVerificationContentParams,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(expected)
      expect(
        MockVerifiedContentService.encryptVerifiedContent,
      ).toHaveBeenCalledTimes(1)
    })
  })
})
