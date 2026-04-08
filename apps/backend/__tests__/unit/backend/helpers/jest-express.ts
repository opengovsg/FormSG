import { Request, Response } from 'express'

const mockRequest = <P extends Record<string, string>, B, Q = any>({
  params,
  body,
  session,
  query,
  secure,
  cookies,
  others = {},
}: {
  params?: P
  body?: B
  session?: Record<string, unknown>
  query?: Q
  secure?: boolean
  cookies?: Record<string, string>
  others?: Partial<Omit<Record<keyof Request, unknown>, 'query'>>
} = {}): Request<P, unknown, B, Q & Request['query']> => {
  return {
    body: body ?? {},
    params: params ?? {},
    session: session ?? {},
    query: query ?? {},
    secure: secure ?? true,
    cookies: cookies ?? {},
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
  const markHeadersSent = function (this: { headersSent: boolean }) {
    this.headersSent = true
    return this
  }

  const mockRes = {
    locals: {},
    headersSent: false,
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockImplementation(markHeadersSent),
    sendStatus: jest.fn().mockImplementation(markHeadersSent),
    type: jest.fn().mockReturnThis(),
    pipe: jest.fn().mockReturnThis(),
    emit: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    end: jest.fn().mockImplementation(markHeadersSent),
    json: jest.fn().mockImplementation(markHeadersSent),
    render: jest.fn(),
    redirect: jest.fn().mockImplementation(markHeadersSent),
    cookie: jest.fn(),
    set: jest.fn(),
    clearCookie: jest.fn(),
    ...extraArgs,
  }
  return mockRes as Response
}

const expressHandler = {
  mockRequest,
  mockResponse,
}

export default expressHandler
