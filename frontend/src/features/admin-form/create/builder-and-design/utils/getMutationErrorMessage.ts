import { StatusCodes } from 'http-status-codes'

import { HttpError } from '~services/ApiService'

export const getMutationErrorMessage = (error: Error): string => {
  if (error instanceof HttpError) {
    switch (error.code) {
      case StatusCodes.FORBIDDEN:
        return 'You do not have permission to modify this form.'
      default:
        break
    }
  }
  return error.message
}
