import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

export type ErrorResponseData = {
  statusCode: StatusCodes
  errorMessage: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ControllerHandler<
  P = unknown,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown,
  Locals = Record<string, unknown>
> extends RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {}
