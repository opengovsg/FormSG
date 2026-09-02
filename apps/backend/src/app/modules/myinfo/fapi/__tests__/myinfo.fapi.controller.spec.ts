import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import { errAsync, okAsync } from 'neverthrow'

import { MYINFO_FAPI_SESSION_COOKIE_NAME } from '../myinfo.fapi.constants'
import { loginToMyInfoFapi } from '../myinfo.fapi.controller'
import { MyInfoFapiExchangeError } from '../myinfo.fapi.errors'
import * as MyInfoFapiService from '../myinfo.fapi.service'
import getMyInfoFapiSessionModel from '../myinfo.fapi.session.model'

jest.mock('../myinfo.fapi.service')
const MockMyInfoFapiService = jest.mocked(MyInfoFapiService)

jest.mock('../myinfo.fapi.session.model', () => {
  const model = {
    loadForCallback: jest.fn(),
    markExchanged: jest.fn(),
  }
  return { __esModule: true, default: () => model }
})
const MockSession = jest.mocked(getMyInfoFapiSessionModel({} as never))

const MOCK_SESSION_ID = 'mock-session-id'
const MOCK_FORM_ID = '5f8f4b8f8f8f8f8f8f8f8f8f'
const MOCK_TARGET = { formId: MOCK_FORM_ID }
const MOCK_EXCHANGE = {
  formId: MOCK_FORM_ID,
  state: 'mock-state',
  nonce: 'mock-nonce',
  codeVerifier: 'mock-code-verifier',
  dpopPrivateJwk: { kty: 'EC' },
}

const mockCallback = (query: Record<string, string>, sessionId?: unknown) =>
  expressHandler.mockRequest({
    query,
    others: {
      signedCookies:
        sessionId === undefined
          ? {}
          : { [MYINFO_FAPI_SESSION_COOKIE_NAME]: sessionId },
    },
    // The handler narrows its query to a discriminated union that the generic
    // mockRequest cannot express.
  }) as unknown as Parameters<typeof loginToMyInfoFapi>[0] & Request

const SUCCESS_QUERY = { code: 'mock-code', state: 'mock-state' }

describe('loginToMyInfoFapi', () => {
  afterEach(() => jest.clearAllMocks())

  it('should reject a callback with no session cookie', async () => {
    const res = expressHandler.mockResponse()

    await loginToMyInfoFapi(mockCallback(SUCCESS_QUERY), res, jest.fn())

    expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    expect(MockSession.loadForCallback).not.toHaveBeenCalled()
  })

  it('should reject and clear the cookie when the session is gone', async () => {
    MockSession.loadForCallback.mockResolvedValueOnce(null)
    const res = expressHandler.mockResponse()

    await loginToMyInfoFapi(
      mockCallback(SUCCESS_QUERY, MOCK_SESSION_ID),
      res,
      jest.fn(),
    )

    // There is no form id to redirect to, since it lives in the session
    // document rather than in the callback URL.
    expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    expect(res.clearCookie).toHaveBeenCalled()
    expect(MockMyInfoFapiService.exchangeCallback).not.toHaveBeenCalled()
  })

  it('should exchange the code and redirect to the form on the happy path', async () => {
    MockSession.loadForCallback.mockResolvedValueOnce({
      phase: 'pending',
      target: MOCK_TARGET,
      exchange: MOCK_EXCHANGE,
    })
    MockMyInfoFapiService.exchangeCallback.mockReturnValueOnce(
      okAsync({ accessToken: 'mock-access-token', sub: 'mock-sub' }),
    )
    MockSession.markExchanged.mockResolvedValueOnce('claimed')
    const res = expressHandler.mockResponse()

    await loginToMyInfoFapi(
      mockCallback({ ...SUCCESS_QUERY, iss: 'mock-iss' }, MOCK_SESSION_ID),
      res,
      jest.fn(),
    )

    expect(MockMyInfoFapiService.exchangeCallback).toHaveBeenCalledWith({
      code: { code: 'mock-code', state: 'mock-state', iss: 'mock-iss' },
      session: MOCK_EXCHANGE,
    })
    expect(MockSession.markExchanged).toHaveBeenCalledWith(MOCK_SESSION_ID, {
      accessToken: 'mock-access-token',
      sub: 'mock-sub',
    })
    expect(res.redirect).toHaveBeenCalledWith(`/${MOCK_FORM_ID}`)
  })

  it('should restore the encoded query on the redirect target', async () => {
    MockSession.loadForCallback.mockResolvedValueOnce({
      phase: 'pending',
      target: {
        formId: MOCK_FORM_ID,
        encodedQuery: Buffer.from('a=1&b=2').toString('base64'),
      },
      exchange: MOCK_EXCHANGE,
    })
    MockMyInfoFapiService.exchangeCallback.mockReturnValueOnce(
      okAsync({ accessToken: 'mock-access-token', sub: 'mock-sub' }),
    )
    MockSession.markExchanged.mockResolvedValueOnce('claimed')
    const res = expressHandler.mockResponse()

    await loginToMyInfoFapi(
      mockCallback(SUCCESS_QUERY, MOCK_SESSION_ID),
      res,
      jest.fn(),
    )

    expect(res.redirect).toHaveBeenCalledWith(`/${MOCK_FORM_ID}?a=1&b=2`)
  })

  it('should redirect without exchanging when the session is already exchanged', async () => {
    MockSession.loadForCallback.mockResolvedValueOnce({
      phase: 'exchanged',
      target: MOCK_TARGET,
    })
    const res = expressHandler.mockResponse()

    await loginToMyInfoFapi(
      mockCallback(SUCCESS_QUERY, MOCK_SESSION_ID),
      res,
      jest.fn(),
    )

    // A duplicate callback must never make a second token request, and must not
    // clear the cookie the winner's form load still needs.
    expect(MockMyInfoFapiService.exchangeCallback).not.toHaveBeenCalled()
    expect(res.clearCookie).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith(`/${MOCK_FORM_ID}`)
  })

  it('should redirect without exchanging when Singpass returns an error', async () => {
    MockSession.loadForCallback.mockResolvedValueOnce({
      phase: 'pending',
      target: MOCK_TARGET,
      exchange: MOCK_EXCHANGE,
    })
    const res = expressHandler.mockResponse()

    await loginToMyInfoFapi(
      mockCallback(
        {
          error: 'access_denied',
          error_description: 'spoofable text',
          state: 'mock-state',
        },
        MOCK_SESSION_ID,
      ),
      res,
      jest.fn(),
    )

    expect(MockMyInfoFapiService.exchangeCallback).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith(`/${MOCK_FORM_ID}`)
  })

  it('should keep the cookie when the exchange fails, so form load raises the MyInfo error', async () => {
    MockSession.loadForCallback.mockResolvedValueOnce({
      phase: 'pending',
      target: MOCK_TARGET,
      exchange: MOCK_EXCHANGE,
    })
    MockMyInfoFapiService.exchangeCallback.mockReturnValueOnce(
      errAsync(new MyInfoFapiExchangeError()),
    )
    const res = expressHandler.mockResponse()

    await loginToMyInfoFapi(
      mockCallback(SUCCESS_QUERY, MOCK_SESSION_ID),
      res,
      jest.fn(),
    )

    expect(MockSession.markExchanged).not.toHaveBeenCalled()
    expect(res.clearCookie).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith(`/${MOCK_FORM_ID}`)
  })
})
