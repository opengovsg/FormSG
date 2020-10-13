import { StatusCodes } from 'http-status-codes'

export type ErrorResponseData = {
  statusCode: StatusCodes
  errorMessage: string
}
