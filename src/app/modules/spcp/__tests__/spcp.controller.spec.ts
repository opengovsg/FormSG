import { err, ok } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { AuthType } from 'src/types'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import * as SpcpController from '../spcp.controller'
import { CreateRedirectUrlError } from '../spcp.errors'
import { SpcpFactory } from '../spcp.factory'

import {
  MOCK_ESRVCID,
  MOCK_REDIRECT_URL,
  MOCK_TARGET,
} from './spcp.test.constants'

jest.mock('../spcp.factory')
const MockSpcpFactory = mocked(SpcpFactory, true)

const MOCK_RESPONSE = expressHandler.mockResponse()

describe('spcp.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('handleRedirect', () => {
    it('should return the redirect URL correctly', () => {
      const mockReq = expressHandler.mockRequest({
        query: {
          target: MOCK_TARGET,
          authType: AuthType.SP,
          esrvcId: MOCK_ESRVCID,
        },
      })
      MockSpcpFactory.createRedirectUrl.mockReturnValueOnce(
        ok(MOCK_REDIRECT_URL),
      )

      SpcpController.handleRedirect(mockReq, MOCK_RESPONSE, jest.fn())

      expect(MOCK_RESPONSE.status).toHaveBeenLastCalledWith(200)
      expect(MOCK_RESPONSE.json).toHaveBeenCalledWith({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })

    it('should return 500 if auth client throws an error', () => {
      const mockReq = expressHandler.mockRequest({
        query: {
          target: MOCK_TARGET,
          authType: AuthType.SP,
          esrvcId: MOCK_ESRVCID,
        },
      })
      MockSpcpFactory.createRedirectUrl.mockReturnValueOnce(
        err(new CreateRedirectUrlError()),
      )

      SpcpController.handleRedirect(mockReq, MOCK_RESPONSE, jest.fn())

      expect(MOCK_RESPONSE.status).toHaveBeenLastCalledWith(500)
      expect(MOCK_RESPONSE.json).toHaveBeenCalledWith({
        message: 'Sorry, something went wrong. Please try again.',
      })
    })
  })
})
