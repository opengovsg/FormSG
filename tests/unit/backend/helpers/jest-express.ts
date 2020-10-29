import { Request, Response } from 'express'
import { Query } from 'express-serve-static-core'

const mockRequest = <P extends Record<string, string>, B, Q>({
  params,
  body,
  session,
  query,
  secure,
}: {
  params?: P
  body?: B
  session?: Record<string, unknown>
  query?: Q
  secure?: boolean
} = {}): Request<P, unknown, B, Q & Query> => {
  return {
    body: body ?? {},
    params: params ?? {},
    session: session ?? {},
    query: query ?? {},
    secure: secure ?? true,
    get(name: string) {
      if (name === 'cf-connecting-ip') return 'MOCK_IP'
      return undefined
    },
  } as Request<P, unknown, B, Q & Query>
}

const mockResponse = (
  extraArgs: Partial<Record<keyof Response, unknown>> = {},
): Response => {
  const mockRes = {
    locals: {},
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    json: jest.fn(),
    ...extraArgs,
  }
  return mockRes as Response
}

const expressHandler = {
  mockRequest,
  mockResponse,
}

export default expressHandler
