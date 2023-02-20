/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SgidClient } from '@opengovsg/sgid-client'
import fs from 'fs'
import Jwt from 'jsonwebtoken'

import {
  SgidCreateRedirectUrlError,
  SgidFetchAccessTokenError,
  SgidFetchUserInfoError,
  SgidInvalidJwtError,
  SgidInvalidStateError,
  SgidMissingJwtError,
  SgidVerifyJwtError,
} from '../sgid.errors'
import { SGID_SCOPES, SgidServiceClass } from '../sgid.service'

import {
  MOCK_ACCESS_TOKEN,
  MOCK_AUTH_CODE,
  MOCK_DESTINATION,
  MOCK_JWT,
  MOCK_JWT_PAYLOAD,
  MOCK_NONCE,
  MOCK_OPTIONS,
  MOCK_REDIRECT_URL,
  MOCK_REMEMBER_ME,
  MOCK_STATE,
  MOCK_TOKEN_RESULT,
  MOCK_USER_INFO,
} from './sgid.test.constants'

jest.mock('@opengovsg/sgid-client')
const MockSgidClient = jest.mocked(SgidClient)
jest.mock('jsonwebtoken')
const MockJwt = jest.mocked(Jwt)
jest.mock('fs', () => ({
  ...(jest.requireActual('fs') as typeof fs),
  readFileSync: jest.fn().mockImplementation((v) => v),
}))

describe('sgid.service', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })
  describe('constructor', () => {
    it('should create an SgidClient correctly', () => {
      const { endpoint, clientId, clientSecret, privateKeyPath, redirectUri } =
        MOCK_OPTIONS
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      expect(SgidService).toBeInstanceOf(SgidServiceClass)
      expect(MockSgidClient).toHaveBeenCalledWith({
        endpoint,
        clientId,
        clientSecret,
        privateKey: privateKeyPath,
        redirectUri,
      })
    })
  })
  describe('createRedirectUrl', () => {
    it('should return a string if ok', () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      const sgidClient = jest.mocked(MockSgidClient.mock.instances[0])
      sgidClient.authorizationUrl.mockReturnValue({
        url: MOCK_REDIRECT_URL,
        nonce: MOCK_NONCE,
      })
      const url = SgidService.createRedirectUrl(
        MOCK_DESTINATION,
        MOCK_REMEMBER_ME,
      )
      expect(url._unsafeUnwrap()).toEqual(MOCK_REDIRECT_URL)
      expect(sgidClient.authorizationUrl).toHaveBeenCalledWith(
        MOCK_STATE,
        SGID_SCOPES,
        null,
      )
    })
    it('should return error if not ok', () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      const sgidClient = jest.mocked(MockSgidClient.mock.instances[0])
      sgidClient.authorizationUrl.mockReturnValue({
        // @ts-ignore
        url: undefined,
        nonce: MOCK_NONCE,
      })
      const url = SgidService.createRedirectUrl(
        MOCK_DESTINATION,
        MOCK_REMEMBER_ME,
      )
      expect(url._unsafeUnwrapErr()).toBeInstanceOf(SgidCreateRedirectUrlError)
      expect(sgidClient.authorizationUrl).toHaveBeenCalledWith(
        MOCK_STATE,
        SGID_SCOPES,
        null,
      )
    })
  })
  describe('parseState', () => {
    const SgidService = new SgidServiceClass(MOCK_OPTIONS)
    it('should parse state', () => {
      const state = SgidService.parseState(MOCK_STATE)
      expect(state._unsafeUnwrap()).toStrictEqual({
        decodedQuery: '',
        formId: MOCK_DESTINATION,
        rememberMe: MOCK_REMEMBER_ME,
      })
    })
    it('should error on invalid state', () => {
      const state = SgidService.parseState('')
      expect(state._unsafeUnwrapErr()).toBeInstanceOf(SgidInvalidStateError)
    })
  })
  describe('token', () => {
    it('should return the access token given the code', async () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      const sgidClient = jest.mocked(MockSgidClient.mock.instances[0])
      sgidClient.callback.mockResolvedValue(MOCK_TOKEN_RESULT)
      const result = await SgidService.retrieveAccessToken(MOCK_AUTH_CODE)
      expect(result._unsafeUnwrap()).toStrictEqual(MOCK_TOKEN_RESULT)
      expect(sgidClient.callback).toHaveBeenCalledWith(MOCK_AUTH_CODE, null)
    })
    it('should return error on error', async () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      const sgidClient = jest.mocked(MockSgidClient.mock.instances[0])
      sgidClient.callback.mockRejectedValue(new Error())
      const result = await SgidService.retrieveAccessToken(MOCK_AUTH_CODE)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        SgidFetchAccessTokenError,
      )
      expect(sgidClient.callback).toHaveBeenCalledWith(MOCK_AUTH_CODE, null)
    })
  })
  describe('userInfo', () => {
    it('should return the userinfo given the code', async () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      const sgidClient = jest.mocked(MockSgidClient.mock.instances[0])
      sgidClient.userinfo.mockResolvedValue({
        sub: MOCK_USER_INFO.sub,
        data: {
          ...MOCK_USER_INFO.data,
          'myinfo.name': 'not supposed to be here',
        },
      })
      const result = await SgidService.retrieveUserInfo({
        accessToken: MOCK_ACCESS_TOKEN,
      })
      expect(result._unsafeUnwrap()).toStrictEqual(MOCK_USER_INFO)
      expect(sgidClient.userinfo).toHaveBeenCalledWith(MOCK_ACCESS_TOKEN)
    })
    it('should return error on error', async () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      const sgidClient = jest.mocked(MockSgidClient.mock.instances[0])
      sgidClient.userinfo.mockRejectedValue(new Error())
      const result = await SgidService.retrieveUserInfo({
        accessToken: MOCK_ACCESS_TOKEN,
      })
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(SgidFetchUserInfoError)
      expect(sgidClient.userinfo).toHaveBeenCalledWith(MOCK_ACCESS_TOKEN)
    })
  })
  describe('createJwt', () => {
    it('should return a jwt with short shelf life', () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      // @ts-ignore
      MockJwt.sign.mockReturnValue(MOCK_JWT)
      const result = SgidService.createJwt(MOCK_USER_INFO.data, false)
      expect(result._unsafeUnwrap()).toStrictEqual({
        jwt: MOCK_JWT,
        maxAge: MOCK_OPTIONS.cookieMaxAge,
      })
      expect(MockJwt.sign).toHaveBeenCalledWith(
        {
          userName: MOCK_USER_INFO.data['myinfo.nric_number'],
          rememberMe: false,
        },
        MOCK_OPTIONS.privateKeyPath,
        {
          algorithm: 'RS256',
          expiresIn: MOCK_OPTIONS.cookieMaxAge / 1000,
        },
      )
    })

    it('should return a jwt with long shelf life', () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      // @ts-ignore
      MockJwt.sign.mockReturnValue(MOCK_JWT)
      const result = SgidService.createJwt(MOCK_USER_INFO.data, true)
      expect(result._unsafeUnwrap()).toStrictEqual({
        jwt: MOCK_JWT,
        maxAge: MOCK_OPTIONS.cookieMaxAgePreserved,
      })
      expect(MockJwt.sign).toHaveBeenCalledWith(
        {
          userName: MOCK_USER_INFO.data['myinfo.nric_number'],
          rememberMe: true,
        },
        MOCK_OPTIONS.privateKeyPath,
        {
          algorithm: 'RS256',
          expiresIn: MOCK_OPTIONS.cookieMaxAgePreserved / 1000,
        },
      )
    })
  })
  describe('extractSgidJwtPayload', () => {
    it('should return an sgID JWT payload', () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      // @ts-ignore
      MockJwt.verify.mockReturnValue(MOCK_JWT_PAYLOAD)
      const result = SgidService.extractSgidJwtPayload(MOCK_JWT)
      expect(result._unsafeUnwrap()).toStrictEqual(MOCK_JWT_PAYLOAD)
      expect(MockJwt.verify).toHaveBeenCalledWith(
        MOCK_JWT,
        MOCK_OPTIONS.publicKeyPath,
        { algorithms: ['RS256'] },
      )
    })

    it('should return SgidMissingJwtError on malformed payload', () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      // @ts-ignore
      const result = SgidService.extractSgidJwtPayload(undefined)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(SgidMissingJwtError)
      expect(MockJwt.verify).not.toHaveBeenCalled()
    })

    it('should return SgidInvalidJwtError on malformed payload', () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      // @ts-ignore
      MockJwt.verify.mockReturnValue({})
      const result = SgidService.extractSgidJwtPayload(MOCK_JWT)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(SgidInvalidJwtError)
      expect(MockJwt.verify).toHaveBeenCalledWith(
        MOCK_JWT,
        MOCK_OPTIONS.publicKeyPath,
        { algorithms: ['RS256'] },
      )
    })
    it('should return SgidVerifyJwtError on verify failure', () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      MockJwt.verify.mockImplementation(() => {
        throw new Error()
      })
      const result = SgidService.extractSgidJwtPayload(MOCK_JWT)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(SgidVerifyJwtError)
      expect(MockJwt.verify).toHaveBeenCalledWith(
        MOCK_JWT,
        MOCK_OPTIONS.publicKeyPath,
        { algorithms: ['RS256'] },
      )
    })
  })
  describe('getCookieSettings', () => {
    it('should return a domain object if domain is defined', async () => {
      const SgidService = new SgidServiceClass(MOCK_OPTIONS)
      const cookieSettings = SgidService.getCookieSettings()
      expect(cookieSettings).toStrictEqual({
        domain: MOCK_OPTIONS.cookieDomain,
        path: '/',
      })
    })
    it('should return an empty object if domain is not defined', async () => {
      const SgidService = new SgidServiceClass({
        ...MOCK_OPTIONS,
        cookieDomain: '',
      })
      const cookieSettings = SgidService.getCookieSettings()
      expect(cookieSettings).toStrictEqual({})
    })
  })
})
