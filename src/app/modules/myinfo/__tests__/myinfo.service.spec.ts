/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MyInfoGovClient } from '@opengovsg/myinfo-gov-client'
import bcrypt from 'bcrypt'
import { ObjectId } from 'bson-ext'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'
import { v4 as uuidv4 } from 'uuid'

import { spcpMyInfoConfig } from 'src/app/config/features/spcp-myinfo.config'
import { MyInfoServiceClass } from 'src/app/modules/myinfo/myinfo.service'
import getMyInfoHashModel from 'src/app/modules/myinfo/myinfo_hash.model'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import {
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
  IPopulatedForm,
  PossiblyPrefilledField,
} from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { MyInfoAttribute } from '../../../../../shared/types'
import { DatabaseError } from '../../core/core.errors'
import { MyInfoData } from '../myinfo.adapter'
import { MYINFO_CONSENT_PAGE_PURPOSE } from '../myinfo.constants'
import {
  MyInfoCircuitBreakerError,
  MyInfoFetchError,
  MyInfoInvalidLoginCookieError,
  MyInfoParseRelayStateError,
} from '../myinfo.errors'
import { MyInfoRelayState } from '../myinfo.types'

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
  MOCK_MYINFO_FORM,
  MOCK_MYINFO_JWT_SECRET,
  MOCK_MYINFO_LOGIN_COOKIE,
  MOCK_POPULATED_FORM_FIELDS,
  MOCK_REDIRECT_URL,
  MOCK_REQUESTED_ATTRS,
  MOCK_RESPONSES,
  MOCK_SERVICE_PARAMS,
  MOCK_UINFIN,
} from './myinfo.test.constants'

const MyInfoHash = getMyInfoHashModel(mongoose)

jest.mock('@opengovsg/myinfo-gov-client')
const MockMyInfoGovClient = mocked(MyInfoGovClient, true)

jest.mock('bcrypt')
const MockBcrypt = mocked(bcrypt, true)

jest.mock('jsonwebtoken')
const MockJwtLibrary = mocked(jwt, true)

jest.mock('../../../config/features/spcp-myinfo.config')
const MockSpcpConfig = mocked(spcpMyInfoConfig, true)

describe('MyInfoServiceClass', () => {
  let myInfoService: MyInfoServiceClass = new MyInfoServiceClass(
    MOCK_SERVICE_PARAMS,
  )
  const mockGetPerson = jest.fn()
  const mockCreateRedirectURL = jest.fn()
  const mockGetAccessToken = jest.fn()
  const mockExtractUinFin = jest.fn()

  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    jest.clearAllMocks()
    MockMyInfoGovClient.mockImplementation(
      () =>
        ({
          getPerson: mockGetPerson,
          createRedirectURL: mockCreateRedirectURL,
          getAccessToken: mockGetAccessToken,
          extractUinFin: mockExtractUinFin,
        } as unknown as MyInfoGovClient),
    )
    myInfoService = new MyInfoServiceClass(MOCK_SERVICE_PARAMS)
    MockSpcpConfig.myInfoJwtSecret = MOCK_MYINFO_JWT_SECRET
  })
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

      expect(mockCreateRedirectURL).toHaveBeenCalledWith({
        purpose: MYINFO_CONSENT_PAGE_PURPOSE,
        relayState: expect.stringContaining(MOCK_FORM_ID),
        requestedAttributes: expect.arrayContaining(MOCK_REQUESTED_ATTRS),
        singpassEserviceId: MOCK_ESRVC_ID,
      })
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
      myInfoService = new MyInfoServiceClass(MOCK_SERVICE_PARAMS)
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

  describe('prefillAndSaveMyInfoFields', () => {
    it('should prefill fields correctly', async () => {
      const mockData = new MyInfoData({
        data: MOCK_MYINFO_DATA,
        uinFin: MOCK_UINFIN,
      })
      const result = await myInfoService.prefillAndSaveMyInfoFields(
        new ObjectId().toHexString(),
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
        .mockResolvedValueOnce(mockReturnValue as unknown as IMyInfoHashSchema)
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
        MOCK_POPULATED_FORM_FIELDS as PossiblyPrefilledField[],
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
      // @ts-ignore
      MockBcrypt.hash.mockRejectedValue('')

      const result = await myInfoService.saveMyInfoHashes(
        MOCK_UINFIN,
        MOCK_FORM_ID,
        MOCK_POPULATED_FORM_FIELDS as PossiblyPrefilledField[],
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
        MOCK_POPULATED_FORM_FIELDS as PossiblyPrefilledField[],
      )
      expect(result._unsafeUnwrapErr()).toEqual(
        new DatabaseError('Failed to save MyInfo hashes to database'),
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
      // @ts-ignore
      MockBcrypt.compare.mockResolvedValue(true)

      const result = await myInfoService.checkMyInfoHashes(
        MOCK_RESPONSES as unknown as ProcessedFieldResponse[],
        MOCK_HASHES as IHashes,
      )

      expect(result._unsafeUnwrap()).toEqual(MOCK_HASHED_FIELD_IDS)
    })

    it('should return HashingError when hashing fails', async () => {
      // @ts-ignore
      MockBcrypt.compare.mockRejectedValue('')

      const result = await myInfoService.checkMyInfoHashes(
        MOCK_RESPONSES as unknown as ProcessedFieldResponse[],
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
        MOCK_RESPONSES as unknown as ProcessedFieldResponse[],
        MOCK_HASHES as IHashes,
      )

      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Responses did not match hashed values'),
      )
    })
  })

  describe('verifyLoginJwt', () => {
    it('should return the UIN/FIN when token is valid', async () => {
      // ignore type error because verify has multiple overloads
      // @ts-ignore
      MockJwtLibrary.verify.mockReturnValueOnce(MOCK_MYINFO_LOGIN_COOKIE)

      const result = myInfoService.verifyLoginJwt(MOCK_ACCESS_TOKEN)

      expect(MockJwtLibrary.verify).toHaveBeenCalledWith(
        MOCK_ACCESS_TOKEN,
        MOCK_MYINFO_JWT_SECRET,
      )
      expect(result._unsafeUnwrap()).toEqual(MOCK_MYINFO_LOGIN_COOKIE)
    })

    it('should return MyInfoInvalidLoginCookieError when token is invalid', async () => {
      MockJwtLibrary.verify.mockImplementationOnce(() => {
        throw new Error()
      })

      const result = myInfoService.verifyLoginJwt(MOCK_ACCESS_TOKEN)

      expect(MockJwtLibrary.verify).toHaveBeenCalledWith(
        MOCK_ACCESS_TOKEN,
        MOCK_MYINFO_JWT_SECRET,
      )
      expect(result._unsafeUnwrapErr()).toEqual(
        new MyInfoInvalidLoginCookieError(),
      )
    })
  })

  describe('getMyInfoDataForForm', () => {
    // NOTE: Mocks the underlying circuit breaker implementation to avoid network calls
    beforeEach(() => {
      myInfoService = new MyInfoServiceClass(MOCK_SERVICE_PARAMS)
    })

    it('should return myInfo data when the provided form and cookie is valid', async () => {
      // Arrange
      const mockReturnedParams = {
        uinFin: MOCK_UINFIN,
        data: MOCK_MYINFO_DATA,
      }

      mockGetPerson.mockResolvedValueOnce(mockReturnedParams)

      // Act
      const result = await myInfoService.getMyInfoDataForForm(
        MOCK_MYINFO_FORM as IPopulatedForm,
        MOCK_ACCESS_TOKEN,
      )

      // Assert
      expect(result._unsafeUnwrap()).toEqual(new MyInfoData(mockReturnedParams))
    })

    it('should call MyInfoGovClient.getPerson with the correct parameters', async () => {
      // Arrange
      const mockReturnedParams = {
        uinFin: MOCK_UINFIN,
        data: MOCK_MYINFO_DATA,
      }
      mockGetPerson.mockResolvedValueOnce(mockReturnedParams)

      // Act
      const result = await myInfoService.getMyInfoDataForForm(
        MOCK_MYINFO_FORM as IPopulatedForm,
        MOCK_ACCESS_TOKEN,
      )

      // Assert
      expect(mockGetPerson).toHaveBeenCalledWith(
        MOCK_ACCESS_TOKEN,
        MOCK_REQUESTED_ATTRS.concat('uinfin' as MyInfoAttribute),
        MOCK_ESRVC_ID,
      )
      expect(result._unsafeUnwrap()).toEqual(new MyInfoData(mockReturnedParams))
    })

    it('should throw MyInfoFetchError when getPerson fails once', async () => {
      // Arrange
      mockGetPerson.mockRejectedValueOnce(new Error())

      // Act
      const result = await myInfoService.getMyInfoDataForForm(
        MOCK_MYINFO_FORM as IPopulatedForm,
        MOCK_ACCESS_TOKEN,
      )

      // Assert
      expect(mockGetPerson).toHaveBeenCalledWith(
        MOCK_ACCESS_TOKEN,
        MOCK_REQUESTED_ATTRS.concat('uinfin' as MyInfoAttribute),
        MOCK_ESRVC_ID,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new MyInfoFetchError())
    })

    it('should throw MyInfoCircuitBreakerError when getPerson fails 5 times', async () => {
      // Arrange
      mockGetPerson.mockRejectedValue(new Error())
      for (let i = 0; i < 5; i++) {
        await myInfoService.getMyInfoDataForForm(
          MOCK_MYINFO_FORM as IPopulatedForm,
          MOCK_ACCESS_TOKEN,
        )
      }

      // Act
      const result = await myInfoService.getMyInfoDataForForm(
        MOCK_MYINFO_FORM as IPopulatedForm,
        MOCK_ACCESS_TOKEN,
      )

      // Assert
      // Last function call doesn't count as breaker is open, so expect 5 calls
      expect(mockGetPerson).toHaveBeenCalledTimes(5)
      expect(result._unsafeUnwrapErr()).toEqual(new MyInfoCircuitBreakerError())
    })
  })
})
