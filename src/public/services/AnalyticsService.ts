import axios from 'axios'

import { AnalyticStatsDTO } from 'src/types/analytics'

/**
 * Retrieves landing page statistics - user, form and submission count.
 */
export const getLandingPageStatistics = async (): Promise<AnalyticStatsDTO> =>
  axios
    .get<AnalyticStatsDTO>('/analytics/statistics')
    .then((response) => response.data)
