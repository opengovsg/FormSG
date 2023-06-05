import { merge } from 'lodash'
import { DelayMode, rest } from 'msw'

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
  return rest.get<never, never, Partial<AnalyticStatsDto>>(
    '/api/v3/analytics/statistics',
    (_req, res, ctx) => {
      return res(ctx.delay(delay), ctx.json(merge({}, MOCK_STATS, overrides)))
    },
  )
}

export const statsHandlers = [getLandingStats()]
