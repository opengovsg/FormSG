import { Request, Response } from 'express'

const mockRequest = ({
  body,
  session,
}: {
  body: Record<string, string>
  session?: any
}) => {
  return {
    body,
    session,
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
