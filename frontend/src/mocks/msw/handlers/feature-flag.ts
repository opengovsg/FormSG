import { delay as MswDelay, http, HttpResponse } from 'msw'

export const MOCK_FEATURE_FLAGS: string[] = ['feature-1', 'feature-2']

export const featureFlagHandlers = [
  http.get<never, never, string[]>(
    '/api/v3/feature-flags/enabled',
    async () => {
      await MswDelay()
      return HttpResponse.json(MOCK_FEATURE_FLAGS)
    },
  ),
]
