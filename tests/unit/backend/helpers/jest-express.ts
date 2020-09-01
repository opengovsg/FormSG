import { Request, Response } from 'express'

const mockRequest = ({
  body,
  params,
  session,
}: {
  body?: Record<string, string>
  params?: Record<string, string>
  session?: any
} = {}) => {
  return {
    body: body ?? {},
    params: params ?? {},
    session: session ?? {},
    get(name: string) {
      if (name === 'cf-connecting-ip') return 'MOCK_IP'
      return null
    },
  } as Request
}

const mockResponse = (extraArgs: Partial<Record<keyof Response, any>> = {}) => {
  const mockRes = {
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
