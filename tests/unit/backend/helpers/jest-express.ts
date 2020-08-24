import { Request, Response } from 'express'

interface MockResponse extends Response {
  sendStatus: jest.Mock
  send: jest.Mock
  status: jest.Mock
  json: jest.Mock
}

const mockRequest = ({ body }: { body: Record<string, string> }) => {
  return {
    body,
  } as Request
}

interface MockResponse extends Response {
  sendStatus: jest.Mock
  send: jest.Mock
  status: jest.Mock
  json: jest.Mock
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
