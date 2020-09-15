import { Request, Response } from 'express'

const mockRequest = <P extends Record<string, string>, B>({
  params,
  body,
  session,
  secure,
}: {
  params?: P
  body?: B
  session?: any
  secure?: boolean
} = {}) => {
  return {
    body: body ?? {},
    params: params ?? {},
    session: session ?? {},
    secure: secure ?? {},
    get(name: string) {
      if (name === 'cf-connecting-ip') return 'MOCK_IP'
      return undefined
    },
  } as Request<P, any, B>
}

const mockResponse = (extraArgs: Partial<Record<keyof Response, any>> = {}) => {
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
