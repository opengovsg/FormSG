import axios from 'axios'
import { PostalCodeAddressDto } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import { ResultAsync } from 'neverthrow'

import { oneMapConfig } from '../../config/features/onemap.config'
import { createLoggerWithLabel } from '../../config/logger'

import { OneMapRequestError } from './onemap.errors'

const logger = createLoggerWithLabel(module)

const REQUEST_TIMEOUT_MS = 5000
const TOKEN_REFRESH_MARGIN_MS = 60 * 60 * 1000

type OneMapToken = {
  accessToken: string
  expiresAt: number
}

type OneMapTokenResponse = {
  access_token: string
  expiry_timestamp: string
}

type OneMapSearchResponse = {
  found: number
  results: {
    POSTAL: string
    BLK_NO: string
    ROAD_NAME: string
  }[]
}

let cachedToken: OneMapToken | undefined
let pendingToken: Promise<OneMapToken> | undefined

const requestToken = async (): Promise<OneMapToken> => {
  const { data } = await axios.post<OneMapTokenResponse>(
    `${oneMapConfig.baseUrl}/api/auth/post/getToken`,
    { email: oneMapConfig.email, password: oneMapConfig.password },
    { timeout: REQUEST_TIMEOUT_MS },
  )
  return {
    accessToken: data.access_token,
    expiresAt: Number(data.expiry_timestamp) * 1000,
  }
}

const getToken = (): Promise<OneMapToken> => {
  if (
    cachedToken &&
    cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()
  ) {
    return Promise.resolve(cachedToken)
  }
  if (!pendingToken) {
    pendingToken = requestToken()
      .then((token) => {
        cachedToken = token
        return token
      })
      .finally(() => {
        pendingToken = undefined
      })
  }
  return pendingToken
}

const search = async (
  postalCode: string,
  accessToken: string,
): Promise<OneMapSearchResponse> => {
  const { data } = await axios.get<OneMapSearchResponse>(
    `${oneMapConfig.baseUrl}/api/common/elastic/search`,
    {
      params: {
        searchVal: postalCode,
        returnGeom: 'N',
        getAddrDetails: 'Y',
        pageNum: 1,
      },
      headers: { Authorization: accessToken },
      timeout: REQUEST_TIMEOUT_MS,
    },
  )
  return data
}

const searchWithToken = async (
  postalCode: string,
): Promise<OneMapSearchResponse> => {
  const token = await getToken()
  try {
    return await search(postalCode, token.accessToken)
  } catch (error) {
    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== StatusCodes.UNAUTHORIZED
    ) {
      throw error
    }
    if (cachedToken === token) {
      cachedToken = undefined
    }
    const freshToken = await getToken()
    return search(postalCode, freshToken.accessToken)
  }
}

export const searchPostalCode = (
  postalCode: string,
): ResultAsync<PostalCodeAddressDto | null, OneMapRequestError> =>
  ResultAsync.fromPromise(searchWithToken(postalCode), (error) => {
    logger.error({
      message: 'OneMap postal code search failed',
      meta: {
        action: 'searchPostalCode',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        reason: error instanceof Error ? error.message : String(error),
      },
    })
    return new OneMapRequestError()
  }).map(({ found, results }) => {
    if (!found || !results?.length) return null
    const [result] = results
    return {
      postalCode: result.POSTAL,
      blockNumber: result.BLK_NO,
      streetName: result.ROAD_NAME,
    }
  })
