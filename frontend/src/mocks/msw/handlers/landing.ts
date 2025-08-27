import { merge } from 'lodash'
import { delay as MswDelay, DelayMode, http, HttpResponse } from 'msw'

import { AnalyticStatsDto } from '~shared/types'

export const MOCK_STATS: Partial<AnalyticStatsDto> = {
  userCount: 4923293,
  formCount: 8953950823,
  submissionCount: 401290581259083,
  agencyCount: 45,
}

export const getLandingStats = ({
  overrides = {},
  delay = 0,
}: {
  overrides?: Partial<AnalyticStatsDto>
  delay?: DelayMode | number
} = {}) => {
  return http.get<never, never, Partial<AnalyticStatsDto>>(
    '/api/v3/analytics/statistics',
    async () => {
      await MswDelay(delay)
      return HttpResponse.json(merge({}, MOCK_STATS, overrides))
    },
  )
}

export const statsHandlers = [getLandingStats()]
