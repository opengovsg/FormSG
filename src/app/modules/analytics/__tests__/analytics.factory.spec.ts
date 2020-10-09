import { okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import {
  FeatureNames,
  IAggregateStats,
  RegisteredFeature,
} from 'src/config/feature-manager'

import { createAnalyticsFactory } from '../analytics.factory'
import * as AnalyticsService from '../analytics.service'

jest.mock('../analytics.service')
const MockAnalyticsService = mocked(AnalyticsService)

describe('analytics.factory', () => {
  describe('aggregate-stats feature is enabled', () => {
    const MOCK_ENABLED_FEATURE: RegisteredFeature<FeatureNames.AggregateStats> = {
      isEnabled: true,
      props: {} as IAggregateStats,
    }
    const AnalyticsFactory = createAnalyticsFactory(MOCK_ENABLED_FEATURE)

    describe('getFormCount', () => {
      it('should invoke AnalyticsService#getFormCountWithStatsCollection', async () => {
        // Arrange
        const mockFormCount = 200
        const serviceStatsSpy = MockAnalyticsService.getFormCountWithStatsCollection.mockReturnValue(
          okAsync(mockFormCount),
        )

        // Act
        const actualResults = await AnalyticsFactory.getFormCount()

        // Assert
        expect(serviceStatsSpy).toHaveBeenCalledTimes(1)
        expect(actualResults.isOk()).toEqual(true)
        expect(actualResults._unsafeUnwrap()).toEqual(mockFormCount)
      })
    })
  })

  describe('aggregate-stats feature is disabled', () => {
    const MOCK_DISABLED_FEATURE: RegisteredFeature<FeatureNames.AggregateStats> = {
      isEnabled: false,
      props: {} as IAggregateStats,
    }
    const AnalyticsFactory = createAnalyticsFactory(MOCK_DISABLED_FEATURE)

    describe('getFormCount', () => {
      it('should invoke AnalyticsService#getFormCountWithSubmissionCollection', async () => {
        // Arrange
        const mockFormCount = 1
        const serviceSubmissionSpy = MockAnalyticsService.getFormCountWithSubmissionCollection.mockReturnValue(
          okAsync(mockFormCount),
        )

        // Act
        const actualResults = await AnalyticsFactory.getFormCount()

        // Assert
        expect(serviceSubmissionSpy).toHaveBeenCalledTimes(1)
        expect(actualResults.isOk()).toEqual(true)
        expect(actualResults._unsafeUnwrap()).toEqual(mockFormCount)
      })
    })
  })
})
