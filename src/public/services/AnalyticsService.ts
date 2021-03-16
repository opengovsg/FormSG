import axios from 'axios'

import { AnalyticStatsDto } from 'src/types/analytics'

/**
 * Retrieves landing page statistics - user, form and submission count.
 */
export const getLandingPageStatistics = async (): Promise<AnalyticStatsDto> =>
  axios
    .get<AnalyticStatsDto>('/analytics/statistics')
    .then((response) => response.data)
