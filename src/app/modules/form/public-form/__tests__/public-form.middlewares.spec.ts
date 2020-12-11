import { Request } from 'express'
import { StatusCodes } from 'http-status-codes'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { Status, WithForm } from '../../../../../types'
import { isFormPublicCheck } from '../public-form.middlewares'

describe('public-form.middlewares', () => {
  it('should call next middleware function if form is public', () => {
    const mockReq = Object.assign(expressHandler.mockRequest(), {
      form: { status: Status.Public },
    }) as WithForm<Request>
    const mockRes = expressHandler.mockResponse()
    const mockNext = jest.fn()

    isFormPublicCheck(mockReq, mockRes, mockNext)

    expect(mockNext).toBeCalled()
    expect(mockRes.sendStatus).not.toBeCalled()
    expect(mockRes.status).not.toBeCalled()
    expect(mockRes.json).not.toBeCalled()
  })

  it('should return HTTP 404 Not Found if form is private', () => {
    const title = 'My private form'
    const inactiveMessage = 'The form is not available.'
    const form = {
      status: Status.Private,
      title,
      inactiveMessage,
    }

    const mockReq = Object.assign(expressHandler.mockRequest(), {
      form,
    }) as WithForm<Request>
    const mockRes = expressHandler.mockResponse()
    const mockNext = jest.fn()

    isFormPublicCheck(mockReq, mockRes, mockNext)

    expect(mockNext).not.toBeCalled()
    expect(mockRes.sendStatus).not.toBeCalled()
    expect(mockRes.status).toBeCalledWith(StatusCodes.NOT_FOUND)
    expect(mockRes.json).toBeCalledWith({
      message: inactiveMessage,
      isPageFound: true,
      formTitle: title,
    })
  })

  it('should return HTTP 410 Gone if form is archived', () => {
    const form = {
      status: Status.Archived,
    }

    const mockReq = Object.assign(expressHandler.mockRequest(), {
      form,
    }) as WithForm<Request>
    const mockRes = expressHandler.mockResponse()
    const mockNext = jest.fn()

    isFormPublicCheck(mockReq, mockRes, mockNext)

    expect(mockNext).not.toBeCalled()
    expect(mockRes.sendStatus).toBeCalledWith(StatusCodes.GONE)
    expect(mockRes.status).not.toBeCalled()
    expect(mockRes.json).not.toBeCalledWith()
  })
})
