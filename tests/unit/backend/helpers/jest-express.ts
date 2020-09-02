import { Request, Response } from 'express'

const mockRequest = <P extends Record<string, string>, B>({
  params,
  body,
  session,
}: {
  params?: P
  body: B
  session?: any
}) => {
  return {
    body,
    params,
    session,
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
