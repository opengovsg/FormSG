import { StatusCodes } from 'http-status-codes'

import { ApplicationError } from 'src/modules/core/core.errors'

type ErrorResponseData = {
  statusCode: StatusCodes
  errorMessage: string
}

export interface MapRouteError {
  (error: ApplicationError, coreErrorMessage?: string): ErrorResponseData
}
