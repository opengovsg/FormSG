import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'
import { v4 as uuidv4 } from 'uuid'

import { MyInfoService } from 'src/app/modules/myinfo/myinfo.service'
import getMyInfoHashModel from 'src/app/modules/myinfo/myinfo_hash.model'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import {
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
  MyInfoAttribute,
} from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { MyInfoData } from '../myinfo.adapter'
import { MYINFO_CONSENT_PAGE_PURPOSE } from '../myinfo.constants'
import {
  MyInfoCircuitBreakerError,
  MyInfoFetchError,
  MyInfoInvalidAccessTokenError,
  MyInfoParseRelayStateError,
} from '../myinfo.errors'
import { IPossiblyPrefilledField, MyInfoRelayState } from '../myinfo.types'

import {
  MOCK_ACCESS_TOKEN,
  MOCK_AUTH_CODE,
  MOCK_COOKIE_AGE,
  MOCK_ESRVC_ID,
  MOCK_FORM_FIELDS,
  MOCK_FORM_ID,
  MOCK_HASHED_FIELD_IDS,
  MOCK_HASHES,
  MOCK_MYINFO_DATA,
  MOCK_POPULATED_FORM_FIELDS,
  MOCK_REDIRECT_URL,
  MOCK_REQUESTED_ATTRS,
  MOCK_RESPONSES,
  MOCK_SERVICE_PARAMS,
  MOCK_UINFIN,
} from './myinfo.test.constants'

const MyInfoHash = getMyInfoHashModel(mongoose)

const mockGetPerson = jest.fn()
const mockCreateRedirectURL = jest.fn()
const mockGetAccessToken = jest.fn()
const mockExtractUinFin = jest.fn()

jest.mock('@opengovsg/myinfo-gov-client', () => ({
  MyInfoGovClient: jest.fn().mockImplementation(() => ({
    getPerson: mockGetPerson,
    createRedirectURL: mockCreateRedirectURL,
    getAccessToken: mockGetAccessToken,
    extractUinFin: mockExtractUinFin,
  })),
  MyInfoMode: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoMode,
  MyInfoSource: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoSource,
  MyInfoAddressType: jest.requireActual('@opengovsg/myinfo-gov-client')
    .MyInfoAddressType,
  MyInfoAttribute: jest.requireActual('@opengovsg/myinfo-gov-client')
    .MyInfoAttribute,
}))

jest.mock('bcrypt')
const MockBcrypt = mocked(bcrypt, true)

describe('MyInfoService', () => {
  let myInfoService = new MyInfoService(MOCK_SERVICE_PARAMS)

  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => jest.clearAllMocks())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('class constructor', () => {
    it('should instantiate without errors', () => {
      expect(myInfoService).toBeTruthy()
    })
  })

  describe('createRedirectURL', () => {
    it('should call MyInfoGovClient.createRedirectURL with the correct arguments', () => {
      mockCreateRedirectURL.mockReturnValueOnce(MOCK_REDIRECT_URL)

      const result = myInfoService.createRedirectURL({
        formEsrvcId: MOCK_ESRVC_ID,
        formId: MOCK_FORM_ID,
        requestedAttributes: MOCK_REQUESTED_ATTRS,
      })

      const actualArgs = mockCreateRedirectURL.mock.calls[0][0]
      const actualParsedRelayState = JSON.parse(actualArgs.relayState)

      expect(actualArgs.purpose).toBe(MYINFO_CONSENT_PAGE_PURPOSE)
      expect(actualParsedRelayState.formId).toBe(MOCK_FORM_ID)
      expect(actualArgs.requestedAttributes).toEqual(
        expect.arrayContaining(MOCK_REQUESTED_ATTRS),
      )
      expect(actualArgs.singpassEserviceId).toEqual(MOCK_ESRVC_ID)
      expect(result._unsafeUnwrap()).toBe(MOCK_REDIRECT_URL)
    })
  })

  describe('parseMyInfoRelayState', () => {
    it('should parse valid relay states correctly', () => {
      const validState: MyInfoRelayState = {
        uuid: uuidv4(),
        formId: MOCK_FORM_ID,
      }

      const result = myInfoService
        .parseMyInfoRelayState(JSON.stringify(validState))
        ._unsafeUnwrap()

      expect(result.uuid).toBe(validState.uuid)
      expect(result.formId).toBe(validState.formId)
      expect(result.cookieDuration).toBe(
        MOCK_SERVICE_PARAMS.spcpMyInfoConfig.spCookieMaxAge,
      )
    })

    it('should return MyInfoParseRelayStateError when relay state cannot be parsed', () => {
      const invalidJson = 'abc'

      const result = myInfoService.parseMyInfoRelayState(invalidJson)

      expect(result._unsafeUnwrapErr()).toEqual(
        new MyInfoParseRelayStateError(),
      )
    })

    it('should return MyInfoParseRelayStateError when relay state has incorrect shape', () => {
      const stateMissingFormId = {
        uuid: uuidv4(),
      }

      const result = myInfoService.parseMyInfoRelayState(
        JSON.stringify(stateMissingFormId),
      )

      expect(result._unsafeUnwrapErr()).toEqual(
        new MyInfoParseRelayStateError(),
      )
    })
  })

  describe('retrieveAccessToken', () => {
    beforeEach(() => {
      myInfoService = new MyInfoService(MOCK_SERVICE_PARAMS)
    })

    it('should call MyInfoGovClient.getAccessToken with the correct parameters', async () => {
      mockGetAccessToken.mockResolvedValueOnce(MOCK_ACCESS_TOKEN)

      const result = await myInfoService.retrieveAccessToken(MOCK_AUTH_CODE)

      expect(mockGetAccessToken).toHaveBeenCalledWith(MOCK_AUTH_CODE)
      expect(result._unsafeUnwrap()).toEqual(MOCK_ACCESS_TOKEN)
    })

    it('should throw MyInfoFetchError when getAccessToken fails once', async () => {
      mockGetAccessToken.mockRejectedValueOnce(new Error())
      const result = await myInfoService.retrieveAccessToken(MOCK_AUTH_CODE)

      expect(mockGetAccessToken).toHaveBeenCalledWith(MOCK_AUTH_CODE)
      expect(result._unsafeUnwrapErr()).toEqual(new MyInfoFetchError())
    })

    it('should throw MyInfoCircuitBreakerError when getAccessToken fails 5 times', async () => {
      mockGetAccessToken.mockRejectedValue(new Error())
      for (let i = 0; i < 5; i++) {
        await myInfoService.retrieveAccessToken(MOCK_AUTH_CODE)
      }
      const result = await myInfoService.retrieveAccessToken(MOCK_AUTH_CODE)

      // Last function call doesn't count as breaker is open, so expect 5 calls
      expect(mockGetAccessToken).toHaveBeenCalledTimes(5)
      expect(result._unsafeUnwrapErr()).toEqual(new MyInfoCircuitBreakerError())
    })
  })

  describe('fetchMyInfoPersonData', () => {
    beforeEach(() => {
      myInfoService = new MyInfoService(MOCK_SERVICE_PARAMS)
    })

    it('should call MyInfoGovClient.getPerson with the correct parameters', async () => {
      const mockReturnedParams = {
        uinFin: MOCK_UINFIN,
        data: MOCK_MYINFO_DATA,
      }
      mockGetPerson.mockResolvedValueOnce(mockReturnedParams)
      const result = await myInfoService.fetchMyInfoPersonData(
        MOCK_ACCESS_TOKEN,
        MOCK_REQUESTED_ATTRS,
        MOCK_ESRVC_ID,
      )

      expect(mockGetPerson).toHaveBeenCalledWith(
        MOCK_ACCESS_TOKEN,
        MOCK_REQUESTED_ATTRS.concat('uinfin' as MyInfoAttribute),
        MOCK_ESRVC_ID,
      )
      expect(result._unsafeUnwrap()).toEqual(new MyInfoData(mockReturnedParams))
    })

    it('should throw MyInfoFetchError when getPerson fails once', async () => {
      mockGetPerson.mockRejectedValueOnce(new Error())
      const result = await myInfoService.fetchMyInfoPersonData(
        MOCK_ACCESS_TOKEN,
        MOCK_REQUESTED_ATTRS,
        MOCK_ESRVC_ID,
      )

      expect(mockGetPerson).toHaveBeenCalledWith(
        MOCK_ACCESS_TOKEN,
        MOCK_REQUESTED_ATTRS.concat('uinfin' as MyInfoAttribute),
        MOCK_ESRVC_ID,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new MyInfoFetchError())
    })

    it('should throw MyInfoCircuitBreakerError when getPerson fails 5 times', async () => {
      mockGetPerson.mockRejectedValue(new Error())
      for (let i = 0; i < 5; i++) {
        await myInfoService.fetchMyInfoPersonData(
          MOCK_ACCESS_TOKEN,
          MOCK_REQUESTED_ATTRS,
          MOCK_ESRVC_ID,
        )
      }
      const result = await myInfoService.fetchMyInfoPersonData(
        MOCK_ACCESS_TOKEN,
        MOCK_REQUESTED_ATTRS,
        MOCK_ESRVC_ID,
      )

      // Last function call doesn't count as breaker is open, so expect 5 calls
      expect(mockGetPerson).toHaveBeenCalledTimes(5)
      expect(result._unsafeUnwrapErr()).toEqual(new MyInfoCircuitBreakerError())
    })
  })

  describe('prefillMyInfoFields', () => {
    it('should prefill fields correctly', () => {
      const mockData = new MyInfoData({
        data: MOCK_MYINFO_DATA,
        uinFin: MOCK_UINFIN,
      })
      const result = myInfoService.prefillMyInfoFields(
        mockData,
        MOCK_FORM_FIELDS as IFieldSchema[],
      )
      expect(result._unsafeUnwrap()).toEqual(MOCK_POPULATED_FORM_FIELDS)
    })
  })

  describe('saveMyInfoHashes', () => {
    it('should call updateHashes with the correct parameters', async () => {
      const mockReturnValue = { mock: 'value' }
      const mockUpdateHashes = jest
        .spyOn(MyInfoHash, 'updateHashes')
        .mockResolvedValueOnce(
          (mockReturnValue as unknown) as IMyInfoHashSchema,
        )
      MockBcrypt.hash.mockImplementation((v) => Promise.resolve(v))
      const expectedHashes = {} as Record<string, string>
      MOCK_POPULATED_FORM_FIELDS.forEach((field) => {
        if (field.disabled && field.myInfo?.attr) {
          expectedHashes[field.myInfo.attr] = field.fieldValue
        }
      })

      const result = await myInfoService.saveMyInfoHashes(
        MOCK_UINFIN,
        MOCK_FORM_ID,
        MOCK_POPULATED_FORM_FIELDS as IPossiblyPrefilledField[],
      )

      expect(mockUpdateHashes).toHaveBeenCalledWith(
        MOCK_UINFIN,
        MOCK_FORM_ID,
        expectedHashes,
        MOCK_COOKIE_AGE,
      )
      expect(result._unsafeUnwrap()).toEqual(mockReturnValue)
    })

    it('should throw HashingError when hashing fails', async () => {
      MockBcrypt.hash.mockRejectedValue('')

      const result = await myInfoService.saveMyInfoHashes(
        MOCK_UINFIN,
        MOCK_FORM_ID,
        MOCK_POPULATED_FORM_FIELDS as IPossiblyPrefilledField[],
      )

      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Error occurred while hashing data'),
      )
    })

    it('should throw DatabaseError when database update fails', async () => {
      MockBcrypt.hash.mockImplementation((v) => Promise.resolve(v))
      jest.spyOn(MyInfoHash, 'updateHashes').mockRejectedValueOnce('')
      const result = await myInfoService.saveMyInfoHashes(
        MOCK_UINFIN,
        MOCK_FORM_ID,
        MOCK_POPULATED_FORM_FIELDS as IPossiblyPrefilledField[],
      )
      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Failed to save MyInfo hashes to database'),
      )
    })
  })

  describe('fetchMyInfoHashes', () => {
    it('should return the result of MyInfoHash.findHashes when it is non-null', async () => {
      const mockReturnValue = { name: 'mockReturnValue' }
      const mockFindHashes = jest
        .spyOn(MyInfoHash, 'findHashes')
        .mockResolvedValue(mockReturnValue)

      const result = await myInfoService.fetchMyInfoHashes(
        MOCK_UINFIN,
        MOCK_FORM_ID,
      )

      expect(mockFindHashes).toHaveBeenCalledWith(MOCK_UINFIN, MOCK_FORM_ID)
      expect(result._unsafeUnwrap()).toEqual(mockReturnValue)
    })

    it('should throw MissingHashError when the result of MyInfoHash.findHashes is null', async () => {
      const mockFindHashes = jest
        .spyOn(MyInfoHash, 'findHashes')
        .mockResolvedValue(null)

      const result = await myInfoService.fetchMyInfoHashes(
        MOCK_UINFIN,
        MOCK_FORM_ID,
      )

      expect(mockFindHashes).toHaveBeenCalledWith(MOCK_UINFIN, MOCK_FORM_ID)
      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Requested hashes not found in database'),
      )
    })

    it('should throw DatabaseError when querying the database fails', async () => {
      const mockFindHashes = jest
        .spyOn(MyInfoHash, 'findHashes')
        .mockRejectedValue('')

      const result = await myInfoService.fetchMyInfoHashes(
        MOCK_UINFIN,
        MOCK_FORM_ID,
      )

      expect(mockFindHashes).toHaveBeenCalledWith(MOCK_UINFIN, MOCK_FORM_ID)
      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Error while fetching MyInfo hashes from database'),
      )
    })
  })

  describe('checkMyInfoHashes', () => {
    it('should return the set of hashed attributes when the hashes match', async () => {
      MockBcrypt.compare.mockResolvedValue(true)

      const result = await myInfoService.checkMyInfoHashes(
        (MOCK_RESPONSES as unknown) as ProcessedFieldResponse[],
        MOCK_HASHES as IHashes,
      )

      expect(result._unsafeUnwrap()).toEqual(MOCK_HASHED_FIELD_IDS)
    })

    it('should return HashingError when hashing fails', async () => {
      MockBcrypt.compare.mockRejectedValue('')

      const result = await myInfoService.checkMyInfoHashes(
        (MOCK_RESPONSES as unknown) as ProcessedFieldResponse[],
        MOCK_HASHES as IHashes,
      )

      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Error occurred while hashing data'),
      )
    })

    it('should return HashDidNotMatchError when the hashes do not match', async () => {
      // Return false for the first hash
      MockBcrypt.compare.mockImplementation((answer) => {
        if (answer === MOCK_RESPONSES[0].answer) {
          return Promise.resolve(false)
        }
        return Promise.resolve(true)
      })

      const result = await myInfoService.checkMyInfoHashes(
        (MOCK_RESPONSES as unknown) as ProcessedFieldResponse[],
        MOCK_HASHES as IHashes,
      )

      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Responses did not match hashed values'),
      )
    })
  })

  describe('extractUinFin', () => {
    it('should call MyInfoGovClient.extractUinFin and return the UIN/FIN when token is valid', async () => {
      mockExtractUinFin.mockReturnValueOnce(MOCK_UINFIN)

      const result = myInfoService.extractUinFin(MOCK_ACCESS_TOKEN)

      expect(mockExtractUinFin).toHaveBeenCalledWith(MOCK_ACCESS_TOKEN)
      expect(result._unsafeUnwrap()).toBe(MOCK_UINFIN)
    })

    it('should return MyInfoInvalidAccessTokenError when token is invalid', async () => {
      mockExtractUinFin.mockImplementationOnce(() => {
        throw new Error()
      })

      const result = myInfoService.extractUinFin(MOCK_ACCESS_TOKEN)

      expect(mockExtractUinFin).toHaveBeenCalledWith(MOCK_ACCESS_TOKEN)
      expect(result._unsafeUnwrapErr()).toEqual(
        new MyInfoInvalidAccessTokenError(),
      )
    })
  })
})
