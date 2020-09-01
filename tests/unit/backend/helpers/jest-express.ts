import { Response } from 'express'

interface MockResponse extends Response {
  sendStatus: jest.Mock
  send: jest.Mock
  status: jest.Mock
  json: jest.Mock
}

export const mockResponse = () =>
  ({
    sendStatus: jest.fn(),
    send: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as MockResponse)
