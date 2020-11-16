import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import { mocked } from 'ts-jest/utils'

import { AuthType } from 'src/types'

import { CreateRedirectUrlError } from '../spcp.errors'
import { SpcpService } from '../spcp.service'

import {
  MOCK_ESRVCID,
  MOCK_REDIRECT_URL,
  MOCK_SERVICE_PARAMS as MOCK_PARAMS,
  MOCK_TARGET,
} from './spcp.test.constants'

jest.mock('@opengovsg/spcp-auth-client')
const MockAuthClient = mocked(SPCPAuthClient, true)
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockImplementation((v) => v),
}))

describe('spcp.service', () => {
  beforeEach(() => jest.clearAllMocks())
  describe('class constructor', () => {
    it('should instantiate auth clients with the correct params', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      expect(spcpService).toBeTruthy()
      expect(MockAuthClient).toHaveBeenCalledTimes(2)
      expect(MockAuthClient).toHaveBeenCalledWith({
        partnerEntityId: MOCK_PARAMS.spPartnerEntityId,
        idpLoginURL: MOCK_PARAMS.spIdpLoginUrl,
        idpEndpoint: MOCK_PARAMS.spIdpEndpoint,
        esrvcID: MOCK_PARAMS.spEsrvcId,
        appKey: MOCK_PARAMS.spFormSgKeyPath,
        appCert: MOCK_PARAMS.spFormSgCertPath,
        spcpCert: MOCK_PARAMS.spIdpCertPath,
        extract: SPCPAuthClient.extract.SINGPASS,
      })
      expect(MockAuthClient).toHaveBeenCalledWith({
        partnerEntityId: MOCK_PARAMS.cpPartnerEntityId,
        idpLoginURL: MOCK_PARAMS.cpIdpLoginUrl,
        idpEndpoint: MOCK_PARAMS.cpIdpEndpoint,
        esrvcID: MOCK_PARAMS.cpEsrvcId,
        appKey: MOCK_PARAMS.cpFormSgKeyPath,
        appCert: MOCK_PARAMS.cpFormSgCertPath,
        spcpCert: MOCK_PARAMS.cpIdpCertPath,
        extract: SPCPAuthClient.extract.CORPPASS,
      })
    })
  })

  describe('createRedirectUrl', () => {
    it('should call SP auth client createRedirectUrl with the correct params', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockSpClient = mocked(MockAuthClient.mock.instances[0], true)
      mockSpClient.createRedirectURL.mockReturnValueOnce(MOCK_REDIRECT_URL)
      const redirectUrl = spcpService.createRedirectUrl(
        AuthType.SP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(mockSpClient.createRedirectURL).toHaveBeenCalledTimes(1)
      expect(mockSpClient.createRedirectURL).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(redirectUrl._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })

    it('should call CP auth client createRedirectUrl with the correct params', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)
      mockCpClient.createRedirectURL.mockReturnValueOnce(MOCK_REDIRECT_URL)
      const redirectUrl = spcpService.createRedirectUrl(
        AuthType.CP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(mockCpClient.createRedirectURL).toHaveBeenCalledTimes(1)
      expect(mockCpClient.createRedirectURL).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(redirectUrl._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })

    it('should return CreateRedirectUrlError if auth client returns error', () => {
      const spcpService = new SpcpService(MOCK_PARAMS)
      // Assumes that SP auth client was instantiated first
      const mockCpClient = mocked(MockAuthClient.mock.instances[1], true)
      mockCpClient.createRedirectURL.mockReturnValueOnce(new Error())
      const redirectUrl = spcpService.createRedirectUrl(
        AuthType.CP,
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(mockCpClient.createRedirectURL).toHaveBeenCalledTimes(1)
      expect(mockCpClient.createRedirectURL).toHaveBeenCalledWith(
        MOCK_TARGET,
        MOCK_ESRVCID,
      )
      expect(redirectUrl._unsafeUnwrapErr()).toEqual(
        new CreateRedirectUrlError(),
      )
    })
  })
})
