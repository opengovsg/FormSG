import axios, { AxiosError } from 'axios'

import { ApiError } from '~typings/core'

import { LOCAL_STORAGE_EVENT, LOGGED_IN_KEY } from '~constants/localStorage'

const API_BASE_URL = process.env.REACT_APP_BASE_URL ?? '/api/v3'
export class HttpError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

/**
 * Converts possible AxiosError objects to normal Error objects
 *
 * @returns HttpError if AxiosError, else original error
 */
export const transformAxiosError = (e: Error): ApiError => {
  if (axios.isAxiosError(e) && e.response) {
    const statusCode = e.response.status
    if (statusCode === 429) {
      return new HttpError('Please try again later.', statusCode)
    }
    if (typeof e.response.data === 'string') {
      return new HttpError(e.response.data, statusCode)
    }
    if (e.response.data?.message) {
      return new HttpError(e.response.data.message, statusCode)
    }
    if (e.response.statusText) {
      return new HttpError(e.response.statusText, statusCode)
    }

    return new HttpError(`Http ${statusCode} error`, statusCode)
  }
  return e
}

// Create own axios instance with defaults.
export const ApiService = axios.create({
  withCredentials: true,
  baseURL: API_BASE_URL,
})

ApiService.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
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
