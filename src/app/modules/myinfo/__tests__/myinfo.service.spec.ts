import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

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
import { IPossiblyPrefilledField } from '../myinfo.types'

import {
  MOCK_ACCESS_TOKEN,
  MOCK_COOKIE_AGE,
  MOCK_ESRVC_ID,
  MOCK_FORM_FIELDS,
  MOCK_FORM_ID,
  MOCK_HASHED_FIELD_IDS,
  MOCK_HASHES,
  MOCK_MYINFO_DATA,
  MOCK_POPULATED_FORM_FIELDS,
  MOCK_REQUESTED_ATTRS,
  MOCK_RESPONSES,
  MOCK_SERVICE_PARAMS,
  MOCK_UINFIN,
} from './myinfo.test.constants'

const MyInfoHash = getMyInfoHashModel(mongoose)

const mockGetPerson = jest.fn()
jest.mock('@opengovsg/myinfo-gov-client', () => ({
  MyInfoGovClient: jest.fn().mockImplementation(() => ({
    getPerson: mockGetPerson,
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

  describe('fetchMyInfoPersonData', () => {
    beforeEach(() => {
      myInfoService = new MyInfoService(MOCK_SERVICE_PARAMS)
    })

    it('should call MyInfoGovClient.getPersonBasic with the correct parameters', async () => {
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

    it('should throw FetchMyInfoError when getPersonBasic fails once', async () => {
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
      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Error while requesting MyInfo data'),
      )
    })

    it('should throw CircuitBreakerError when getPersonBasic fails 5 times', async () => {
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
      expect(result._unsafeUnwrapErr()).toEqual(
        new Error('Circuit breaker tripped'),
      )
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
})
