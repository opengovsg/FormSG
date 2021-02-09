import {
  IPersonBasic,
  Mode as MyInfoClientMode,
} from '@opengovsg/myinfo-gov-client'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import { MyInfoService } from 'src/app/modules/myinfo/myinfo.service'
import getMyInfoHashModel from 'src/app/modules/myinfo/myinfo_hash.model'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import {
  Environment,
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
} from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { IPossiblyPrefilledField } from '../myinfo.types'

import {
  MOCK_COOKIE_AGE,
  MOCK_ESRVC_ID,
  MOCK_FETCH_PARAMS,
  MOCK_FORM_FIELDS,
  MOCK_FORM_ID,
  MOCK_HASHED_FIELD_IDS,
  MOCK_HASHES,
  MOCK_KEY_PATH,
  MOCK_MYINFO_DATA,
  MOCK_POPULATED_FORM_FIELDS,
  MOCK_REALM,
  MOCK_RESPONSES,
  MOCK_UINFIN,
} from './myinfo.test.constants'

const MyInfoHash = getMyInfoHashModel(mongoose)

const mockGetPersonBasic = jest.fn()
jest.mock('@opengovsg/myinfo-gov-client', () => ({
  MyInfoGovClient: jest.fn().mockImplementation(() => ({
    getPersonBasic: mockGetPersonBasic,
  })),
  Mode: jest.requireActual('@opengovsg/myinfo-gov-client').Mode,
  CATEGORICAL_DATA_DICT: jest.requireActual('@opengovsg/myinfo-gov-client')
    .CATEGORICAL_DATA_DICT,
  MyInfoSource: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoSource,
}))

jest.mock('bcrypt')
const MockBcrypt = mocked(bcrypt, true)

describe('MyInfoService', () => {
  let myInfoService = new MyInfoService({
    myInfoConfig: {
      myInfoClientMode: MyInfoClientMode.Staging,
      myInfoKeyPath: MOCK_KEY_PATH,
    },
    nodeEnv: Environment.Test,
    realm: MOCK_REALM,
    singpassEserviceId: MOCK_ESRVC_ID,
    spCookieMaxAge: MOCK_COOKIE_AGE,
  })

  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => jest.clearAllMocks())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('class constructor', () => {
    it('should instantiate without errors', () => {
      expect(myInfoService).toBeTruthy()
    })
  })

  describe('fetchMyInfoPersonData', () => {
    beforeEach(() => {
      myInfoService = new MyInfoService({
        myInfoConfig: {
          myInfoClientMode: MyInfoClientMode.Staging,
          myInfoKeyPath: MOCK_KEY_PATH,
        },
        nodeEnv: Environment.Test,
        realm: MOCK_REALM,
        singpassEserviceId: MOCK_ESRVC_ID,
        spCookieMaxAge: MOCK_COOKIE_AGE,
      })
    })

    it('should call MyInfoGovClient.getPersonBasic with the correct parameters', async () => {
      mockGetPersonBasic.mockResolvedValueOnce(MOCK_MYINFO_DATA)
      const result = await myInfoService.fetchMyInfoPersonData(
        MOCK_FETCH_PARAMS,
      )

      expect(mockGetPersonBasic).toHaveBeenCalledWith(MOCK_FETCH_PARAMS)
      expect(result._unsafeUnwrap()).toEqual(MOCK_MYINFO_DATA)
    })

    it('should throw FetchMyInfoError when getPersonBasic fails once', async () => {
      mockGetPersonBasic.mockRejectedValueOnce(new Error())
      const result = await myInfoService.fetchMyInfoPersonData(
        MOCK_FETCH_PARAMS,
      )

      expect(mockGetPersonBasic).toHaveBeenCalledWith(MOCK_FETCH_PARAMS)
      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Error while requesting MyInfo data'),
      )
    })

    it('should throw CircuitBreakerError when getPersonBasic fails 5 times', async () => {
      mockGetPersonBasic.mockRejectedValue(new Error())
      for (let i = 0; i < 5; i++) {
        await myInfoService.fetchMyInfoPersonData(MOCK_FETCH_PARAMS)
      }
      const result = await myInfoService.fetchMyInfoPersonData(
        MOCK_FETCH_PARAMS,
      )

      // Last function call doesn't count as breaker is open, so expect 5 calls
      expect(mockGetPersonBasic).toHaveBeenCalledTimes(5)
      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Circuit breaker tripped'),
      )
    })
  })

  describe('prefillMyInfoFields', () => {
    it('should prefill fields correctly', () => {
      const result = myInfoService.prefillMyInfoFields(
        (MOCK_MYINFO_DATA as unknown) as IPersonBasic,
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
})
