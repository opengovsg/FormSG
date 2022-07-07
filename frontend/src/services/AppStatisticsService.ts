import { AnalyticStatsDto } from '~shared/types/analytics'

import { ApiService } from '~services/ApiService'

/**
 * Retrieves landing page statistics - user, form and submission count.
 */
export const getLandingPageStatistics = async (): Promise<AnalyticStatsDto> =>
  ApiService.get<AnalyticStatsDto>('/analytics/statistics').then(
    ({ data }) => data,
  )
