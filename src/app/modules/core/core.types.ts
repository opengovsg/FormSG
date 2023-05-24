import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

export type ErrorResponseData = {
  statusCode: StatusCodes
  errorMessage: string
}

export type ControllerHandler<
  P = unknown,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
> = RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>
