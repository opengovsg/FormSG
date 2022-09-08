import { StatusCodes } from 'http-status-codes'

import { HttpError } from '~services/ApiService'

export const getMutationErrorMessage = (error: Error): string => {
  if (!(error instanceof HttpError)) return error.message
  switch (error.code) {
    case StatusCodes.FORBIDDEN:
      return 'You do not have permission to modify this form.'
    default:
      return error.message
  }
}
