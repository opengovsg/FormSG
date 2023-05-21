import { ApiService } from '~services/ApiService'

const GOGOV_ENDPOINT = '/gogov'

export const claimGoLink = async (
  linkSuffix: string,
  formLink: string,
): Promise<unknown> => {
  return ApiService.post(`${GOGOV_ENDPOINT}/claim`, {
    formLink,
    linkSuffix,
  })
}
