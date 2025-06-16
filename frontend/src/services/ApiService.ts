import { datadogLogs } from '@datadog/browser-logs'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { StatusCodes } from 'http-status-codes'

import { ErrorCode } from '~shared/types/errorCodes'

import { ApiError } from '~typings/core'

import { LOCAL_STORAGE_EVENT, LOGGED_IN_KEY } from '~constants/localStorage'

import {
  checkIsCloudflareChallengeError,
  handleCloudflareChallengeError,
} from '~features/turnstile/handleCloudflareChallenge'

export const API_BASE_URL = import.meta.env.VITE_APP_BASE_URL ?? '/api/v3'
export class HttpError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

export class SingleSubmissionValidationError extends HttpError {
  constructor() {
    super('Single submission validation failed', StatusCodes.BAD_REQUEST)
  }
}

/**
 * Converts possible AxiosError objects to normal Error objects
 *
 * @returns HttpError if AxiosError, else original error
 */
export const transformAxiosError = (error: Error): ApiError => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const statusCode = error.response.status
      if (
        error.response.data?.errorCodes?.find(
          (errorCode: ErrorCode) =>
            errorCode === ErrorCode.respondentSingleSubmissionValidationFailure,
        )
      ) {
        return new SingleSubmissionValidationError()
      }
      if (statusCode === StatusCodes.TOO_MANY_REQUESTS) {
        return new HttpError('Please try again later.', statusCode)
      }
      if (typeof error.response.data === 'string') {
        return new HttpError(error.response.data, statusCode)
      }
      // handle celebrate errors
      if (error.response.data?.validation?.body?.message) {
        return new HttpError(
          error.response.data.validation.body.message,
          statusCode,
        )
      }
      if (error.response.data?.message) {
        return new HttpError(error.response.data.message, statusCode)
      }
      if (error.response.statusText) {
        return new HttpError(error.response.statusText, statusCode)
      }
      return new HttpError(`Error: ${statusCode}`, statusCode)
    } else if (error.request) {
      // TODO: Remove this logging once Network Error sources have been identified.
      datadogLogs.logger.warn(`Unknown error: ${error.message}`, {
        meta: {
          action: 'transformAxiosError',
          error: {
            code: error?.code,
            message: error?.message,
            stack: error?.stack,
            dump: JSON.stringify(error),
          },
        },
      })
      return new Error(
        `There was a problem with your internet connection. Please check your network and try again. ${error.message}`,
      )
    }
  }
  console.log('error not matched anything')
  return error
}

// Create own axios instance with defaults.
export const ApiService = axios.create({
  withCredentials: true,
  baseURL: API_BASE_URL,
})

const checkIsCloudflareChallengeError = (response: AxiosResponse) => {
  return (
    response &&
    response.status === 403 &&
    response.headers['server'] === 'cloudflare' &&
    response.headers['cf-mitigated'] &&
    response.headers['cf-ray']
  )
}

ApiService.interceptors.response.use(
  (response) => {
    console.log('processing response: ', response)
    return response
  },
  (error: AxiosError) => {
    if (error.response && checkIsCloudflareChallengeError(error.response)) {
      console.log(
        'isCloudflareChallengeErrorDetected, opening challenge in new window',
      )
      // Open Cloudflare challenge in a new window/tab
      const challengeHtml = error.response.data
      document.open()
      document.write(challengeHtml as string)
      document.close()

      return new Promise(() => {})
    }

    if (error.response?.status === 401) {
      // Remove logged in state from localStorage
      localStorage.removeItem(LOGGED_IN_KEY)
      // Event to let useLocalStor,age know that key is being deleted.
      window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT))
    }

    const transformedError = transformAxiosError(error)
    console.log('transformedError', transformedError)
    throw transformedError
  },
)

export const processFetchResponse = async (response: Response) => {
  try {
    // throw if response status not 2XX
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Non-2XX response: ${response.status}`)
    } else {
      const data = await response.json()
      return data
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // No guarantee that error is an Error object
    datadogLogs.logger.warn(`Fetch error: ${error.message}`, {
      meta: {
        action: 'processFetchResponse',
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: [...(response.headers?.entries() || [])],
          body: await response.text(),
        },
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
          dump: JSON.stringify(error),
        },
      },
    })

    throw error
  }
}
