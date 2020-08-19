import { Request, Response } from 'express'

const mockRequest = ({ body }: { body: Record<string, string> }) => {
  return {
    body,
  } as Request
}

const mockResponse = () => {
  const mockRes = {} as Response
  mockRes.status = jest.fn().mockReturnThis()
  mockRes.send = jest.fn().mockReturnThis()
  mockRes.sendStatus = jest.fn().mockReturnThis()
  return mockRes
}

const expressHandler = {
  mockRequest,
  mockResponse,
}

export default expressHandler
