import axios from 'axios'

/**
 * Retrieves landing page statistics - user, form and submission count.
 */
export const getLandingPageStatistics = async () =>
  axios.get('/analytics/statistics').then((response) => response.data)
