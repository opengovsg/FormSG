import { datadogLogs } from '@datadog/browser-logs'
import axios, { AxiosError } from 'axios'
import { StatusCodes } from 'http-status-codes'

import { ErrorDto } from 'formsg-shared/types'
import { ErrorCode } from 'formsg-shared/types/errorCodes'

import { env } from '~/env'
import i18n from '~/i18n/i18n'

import { ApiError } from '~typings/core'

import { LOCAL_STORAGE_EVENT, LOGGED_IN_KEY } from '~constants/localStorage'

import {
  checkIsCloudflareChallengeError,
  handleCloudflareChallengeError,
} from '~features/turnstile/handleCloudflareChallenge'

export const API_BASE_URL = env.apiBaseUrl
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

const isErrorDto = (data: unknown): data is ErrorDto => {
  if (typeof data !== 'object' || data === null) return false
  const maybe = data as Record<string, unknown>
  if (typeof maybe.message !== 'string') return false
  if (maybe.messageKey !== undefined && typeof maybe.messageKey !== 'string') {
    return false
  }
  if (
    maybe.messageParams !== undefined &&
    (typeof maybe.messageParams !== 'object' ||
      maybe.messageParams === null ||
      Array.isArray(maybe.messageParams))
  ) {
    return false
  }
  return true
}

const getTranslatedBackendMessage = (data: unknown): string | undefined => {
  if (!isErrorDto(data)) return undefined

  const { message, messageKey, messageParams } = data
  if (typeof messageKey === 'string') {
    const translatedMessage = i18n.t(messageKey, messageParams)
    return translatedMessage === messageKey ? message : translatedMessage
  }

  return message
}

const parseJsonSafely = (text: string): unknown => {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
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
      const data = error.response.data

      if (typeof data === 'string') {
        return new HttpError(data, statusCode)
      }
      const backendMessage = getTranslatedBackendMessage(data)

      // Prefer translated messages for i18n enabled Celebrate errors
      if (typeof data?.messageKey === 'string' && backendMessage) {
        return new HttpError(backendMessage, statusCode)
      }

      // Preserve specific message from vanilla Celebrate errors
      if (data?.validation?.body?.message) {
        return new HttpError(data.validation.body.message, statusCode)
      }

      // Fall back to the top-level message for ordinary backend errors
      if (backendMessage) {
        return new HttpError(backendMessage, statusCode)
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
  return error
}

// Create own axios instance with defaults.
export const ApiService = axios.create({
  withCredentials: true,
  baseURL: API_BASE_URL,
})

ApiService.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle Cloudflare issued challenge by rendering turnstile pre-clearance challenge
    if (error.response && checkIsCloudflareChallengeError(error.response)) {
      return await handleCloudflareChallengeError(error)
        .then((response) => {
          return response
        })
        .catch((error) => {
          throw error
        })
    }

    if (error.response?.status === 401) {
      // Remove logged in state from localStorage
      localStorage.removeItem(LOGGED_IN_KEY)
      // Event to let useLocalStorage know that key is being deleted.
      window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT))
    }

    const transformedError = transformAxiosError(error)
    throw transformedError
  },
)

export const processFetchResponse = async (response: Response) => {
  let responseBody = ''
  try {
    // throw if response status not 2XX
    if (response.status < 200 || response.status >= 300) {
      responseBody = await response.text()
      const parsedErrorBody = parseJsonSafely(responseBody)
      throw new HttpError(
        getTranslatedBackendMessage(parsedErrorBody) ??
          (typeof parsedErrorBody === 'string' ? parsedErrorBody : undefined) ??
          (response.statusText || `Error: ${response.status}`),
        response.status,
      )
    }

    const data = await response.json()
    return data
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
          body: responseBody,
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
