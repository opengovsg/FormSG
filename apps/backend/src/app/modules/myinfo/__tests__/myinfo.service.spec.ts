/* eslint-disable @typescript-eslint/ban-ts-comment */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import bcrypt from 'bcrypt'
import { ObjectId } from 'bson'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

import { spcpMyInfoConfig } from 'src/app/config/features/spcp-myinfo.config'
import { MyInfoServiceClass } from 'src/app/modules/myinfo/myinfo.service'
import getMyInfoHashModel from 'src/app/modules/myinfo/myinfo_hash.model'
import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import {
  IFieldSchema,
  IHashes,
  IMyInfoHashSchema,
  PossiblyPrefilledField,
} from 'src/types'

import { DatabaseError } from '../../core/core.errors'
import { MyInfoData } from '../myinfo.adapter'
import { MyInfoInvalidLoginCookieError } from '../myinfo.errors'

import {
  MOCK_ACCESS_TOKEN,
  MOCK_COOKIE_AGE,
  MOCK_FORM_FIELDS,
  MOCK_FORM_ID,
  MOCK_HASHED_FIELD_IDS,
  MOCK_HASHES,
  MOCK_MYINFO_DATA,
  MOCK_MYINFO_JWT_SECRET,
  MOCK_MYINFO_LOGIN_COOKIE,
  MOCK_POPULATED_FORM_FIELDS,
  MOCK_RESPONSES,
  MOCK_SERVICE_PARAMS,
  MOCK_UINFIN,
} from './myinfo.test.constants'

const MyInfoHash = getMyInfoHashModel(mongoose)

jest.mock('bcrypt')
const MockBcrypt = jest.mocked(bcrypt)

jest.mock('jsonwebtoken')
const MockJwtLibrary = jest.mocked(jwt)

jest.mock('../../../config/features/spcp-myinfo.config')
const MockSpcpConfig = jest.mocked(spcpMyInfoConfig)

describe('MyInfoServiceClass', () => {
  let myInfoService: MyInfoServiceClass = new MyInfoServiceClass(
    MOCK_SERVICE_PARAMS,
  )

  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    jest.clearAllMocks()
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
})
