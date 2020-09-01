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

const mockResponse = () => {
  const mockRes = {} as Response
  mockRes.status = jest.fn().mockReturnThis()
  mockRes.send = jest.fn().mockReturnThis()
  mockRes.sendStatus = jest.fn().mockReturnThis()
  mockRes.json = jest.fn()
  return mockRes
}

const expressHandler = {
  mockRequest,
  mockResponse,
}

export default expressHandler
