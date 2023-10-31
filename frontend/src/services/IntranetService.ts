import { ApiService } from '~services/ApiService'

/**
 * Checks if IP address is an intranet IP.
 */
export const getIsIntranetCheck = async (): Promise<boolean> =>
  ApiService.get<boolean>('/intranet/is-intranet-check').then(
    ({ data }) => data,
  )
