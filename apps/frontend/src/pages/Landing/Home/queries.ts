import { useQuery, UseQueryResult } from 'react-query'

import { AnalyticStatsDto } from 'formsg-shared/types'

import { getLandingPageStatistics } from '~services/AppStatisticsService'

const landingKeys = {
  base: ['landing'],
}

export const useLanding = (): UseQueryResult<AnalyticStatsDto, unknown> => {
  return useQuery<AnalyticStatsDto>(
    landingKeys.base,
    () => getLandingPageStatistics(),
    {
      // 5 minutes.
      staleTime: 300000,
    },
  )
}
