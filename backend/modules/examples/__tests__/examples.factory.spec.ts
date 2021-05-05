import { mocked } from 'ts-jest/utils'

import {
  FeatureNames,
  IAggregateStats,
  RegisteredFeature,
} from 'src/app/config/feature-manager'

import { createExamplesFactory } from '../examples.factory'
import * as ExamplesService from '../examples.service'
import { ExamplesQueryParams, RetrievalType } from '../examples.types'

// Higher order function requires two level mocking.
jest.mock('../examples.service', () => ({
  getExampleForms: jest.fn().mockImplementation(() => jest.fn()),
  getSingleExampleForm: jest.fn().mockImplementation(() => jest.fn()),
}))

const MockExamplesService = mocked(ExamplesService)

describe('examples.factory', () => {
  describe('aggregate-stats feature disabled', () => {
    const MOCK_DISABLED_FEATURE: RegisteredFeature<FeatureNames.AggregateStats> = {
      isEnabled: false,
      props: {} as IAggregateStats,
    }
    const ExamplesFactory = createExamplesFactory(MOCK_DISABLED_FEATURE)

    describe('getExampleForms', () => {
      it('should invoke service method with RetrievalType.Submissions', async () => {
        // Act
        await ExamplesFactory.getExampleForms({} as ExamplesQueryParams)

        // Assert
        expect(MockExamplesService.getExampleForms).toHaveBeenCalledWith(
          RetrievalType.Submissions,
        )
      })
    })

    describe('getSingleExampleForm', () => {
      it('should invoke service method with RetrievalType.Submissions', async () => {
        // Act
        await ExamplesFactory.getSingleExampleForm('anything')

        // Assert
        expect(MockExamplesService.getSingleExampleForm).toHaveBeenCalledWith(
          RetrievalType.Submissions,
        )
      })
    })
  })

  describe('aggregate-stats feature enabled', () => {
    const MOCK_ENABLED_FEATURE: RegisteredFeature<FeatureNames.AggregateStats> = {
      isEnabled: true,
      props: {} as IAggregateStats,
    }
    const ExamplesFactory = createExamplesFactory(MOCK_ENABLED_FEATURE)

    describe('getExampleForms', () => {
      it('should invoke service method with RetrievalType.Stats', async () => {
        // Act
        await ExamplesFactory.getExampleForms({} as ExamplesQueryParams)

        // Assert
        expect(MockExamplesService.getExampleForms).toHaveBeenCalledWith(
          RetrievalType.Stats,
        )
      })
    })

    describe('getSingleExampleForm', () => {
      it('should invoke service method with RetrievalType.Stats', async () => {
        // Act
        await ExamplesFactory.getSingleExampleForm('anything')

        // Assert
        expect(MockExamplesService.getSingleExampleForm).toHaveBeenCalledWith(
          RetrievalType.Stats,
        )
      })
    })
  })
})
