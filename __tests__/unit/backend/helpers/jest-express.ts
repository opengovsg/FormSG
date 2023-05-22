import { Request, Response } from 'express'

const mockRequest = <P extends Record<string, string>, B, Q = any>({
  params,
  body,
  session,
  query,
  secure,
  others = {},
}: {
  params?: P
  body?: B
  session?: Record<string, unknown>
  query?: Q
  secure?: boolean
  others?: Partial<Omit<Record<keyof Request, unknown>, 'query'>>
} = {}): Request<P, unknown, B, Q & Request['query']> => {
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
    ...others,
  } as Request<P, unknown, B, Q & Request['query']>
}

const mockResponse = (
  extraArgs: Partial<Record<keyof Response, unknown>> = {},
): Response => {
  const mockRes = {
    locals: {},
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    pipe: jest.fn().mockReturnThis(),
    emit: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    end: jest.fn(),
    json: jest.fn(),
    render: jest.fn(),
    redirect: jest.fn(),
    cookie: jest.fn(),
    set: jest.fn(),
    ...extraArgs,
  }
  return mockRes as Response
}

const expressHandler = {
  mockRequest,
  mockResponse,
}

export default expressHandler
