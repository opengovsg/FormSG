import axios from 'axios'

import { AnalyticStats } from 'src/types/analytics'

/**
 * Retrieves landing page statistics - user, form and submission count.
 */
export const getLandingPageStatistics = async (): Promise<AnalyticStats> =>
  axios
    .get<AnalyticStats>('/analytics/statistics')
    .then((response) => response.data)
