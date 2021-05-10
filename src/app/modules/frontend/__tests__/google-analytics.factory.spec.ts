import { StatusCodes } from 'http-status-codes'

import { FeatureNames, RegisteredFeature } from 'src/app/config/feature-manager'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { createGoogleAnalyticsFactory } from '../google-analytics.factory'

describe('google-analytics.factory', () => {
  afterEach(() => jest.clearAllMocks())
  const mockReq = expressHandler.mockRequest({
    others: {
      app: {
        locals: {
          GATrackingID: 'abc',
          appName: 'xyz',
          environment: 'efg',
        },
      },
    },
  })
  const mockRes = expressHandler.mockResponse()

  it('should call res correctly if google-analytics feature is disabled', () => {
    const MOCK_DISABLED_GA_FEATURE: RegisteredFeature<FeatureNames.GoogleAnalytics> =
      {
        isEnabled: false,
      }

    const GoogleAnalyticsFactory = createGoogleAnalyticsFactory(
      MOCK_DISABLED_GA_FEATURE,
    )

    GoogleAnalyticsFactory.addGoogleAnalyticsData(mockReq, mockRes)

    expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
    expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.OK)
    expect(mockRes.send).not.toHaveBeenCalled()
  })

  it('should call res correctly if google-analytics feature is enabled', () => {
    const MOCK_ENABLED_GA_FEATURE: RegisteredFeature<FeatureNames.GoogleAnalytics> =
      {
        isEnabled: true,
      }

    const GoogleAnalyticsFactory = createGoogleAnalyticsFactory(
      MOCK_ENABLED_GA_FEATURE,
    )

    GoogleAnalyticsFactory.addGoogleAnalyticsData(mockReq, mockRes)

    expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('gtag'))
    expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
  })
})
