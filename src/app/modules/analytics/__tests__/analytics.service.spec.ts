import { times } from 'lodash'
import mongoose, { Query } from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import getUserModel from 'src/app/models/user.server.model'
import {
  IAgencySchema,
  IUserSchema,
  ResponseMode,
  SubmissionType,
} from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError } from '../../core/core.errors'
import {
  getFormCount,
  getSubmissionCount,
  getUserCount,
} from '../analytics.service'

const FormModel = getFormModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)
const UserModel = getUserModel(mongoose)

describe('analytics.service', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('getFormCount', () => {
    const VALID_DOMAIN = 'example.com'
    let testUser: IUserSchema

    beforeEach(async () => {
      const { user } = await dbHandler.insertFormCollectionReqs({
        mailDomain: VALID_DOMAIN,
      })
      testUser = user
    })

    it('should return 0 when there are no forms in the database', async () => {
      // Arrange
      const initialCount = await FormModel.estimatedDocumentCount()
      expect(initialCount).toEqual(0)

      // Act
      const actualResult = await getFormCount()

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(0)
    })

    it('should return number of forms in the database', async () => {
      // Arrange
      const expectedNum = 10
      const formPromises = times(expectedNum, () =>
        FormModel.create({
          admin: testUser._id,
          title: 'Test form',
          responseMode: ResponseMode.Email,
          emails: ['a@abc.com'],
        }),
      )
      await Promise.all(formPromises)
      const initialCount = await FormModel.estimatedDocumentCount()
      expect(initialCount).toEqual(expectedNum)

      // Act
      const actualResult = await getFormCount()

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedNum)
    })

    it('should return DatabaseError when error occurs whilst retrieving form count', async () => {
      // Arrange
      const execSpy = jest.fn().mockRejectedValueOnce(new Error('boom'))
      jest.spyOn(FormModel, 'estimatedDocumentCount').mockReturnValueOnce(({
        exec: execSpy,
      } as unknown) as Query<number>)

      // Act
      const actualResult = await getFormCount()

      // Assert
      expect(execSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
    })
  })

  describe('getUserCount', () => {
    const VALID_DOMAIN = 'example.com'
    let testAgency: IAgencySchema

    beforeEach(async () => {
      testAgency = await dbHandler.insertAgency({
        mailDomain: VALID_DOMAIN,
      })
    })

    it('should return 0 when there are no users in the database', async () => {
      // Arrange
      const initialUserCount = await UserModel.estimatedDocumentCount()
      expect(initialUserCount).toEqual(0)

      // Act
      const actualResult = await getUserCount()

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(0)
    })

    it('should return number of users in the database', async () => {
      // Arrange
      const expectedNumUsers = 10
      const userPromises = times(expectedNumUsers, () =>
        UserModel.create({
          agency: testAgency._id,
          email: `${Math.random()}@${VALID_DOMAIN}`,
        }),
      )
      await Promise.all(userPromises)
      const initialUserCount = await UserModel.estimatedDocumentCount()
      expect(initialUserCount).toEqual(expectedNumUsers)

      // Act
      const actualResult = await getUserCount()

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedNumUsers)
    })

    it('should return DatabaseError when error occurs whilst retrieving user count', async () => {
      // Arrange
      const execSpy = jest.fn().mockRejectedValueOnce(new Error('boom'))
      jest.spyOn(UserModel, 'estimatedDocumentCount').mockReturnValueOnce(({
        exec: execSpy,
      } as unknown) as Query<number>)

      // Act
      const actualResult = await getUserCount()

      // Assert
      expect(execSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
    })
  })

  describe('getSubmissionCount', () => {
    it('should return 0 when there are no submissions in the database', async () => {
      // Arrange
      const initialSubCount = await SubmissionModel.estimatedDocumentCount()
      expect(initialSubCount).toEqual(0)

      // Act
      const actualResult = await getSubmissionCount()

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(0)
    })

    it('should return number of submissions in the database', async () => {
      // Arrange
      const expectedNumSubs = 10
      const submissionPromises = times(expectedNumSubs, () =>
        SubmissionModel.create({
          form: mongoose.Types.ObjectId(),
          myInfoFields: [],
          submissionType: SubmissionType.Email,
          responseHash: 'hash',
          responseSalt: 'salt',
        }),
      )
      await Promise.all(submissionPromises)
      const initialUserCount = await SubmissionModel.estimatedDocumentCount()
      expect(initialUserCount).toEqual(expectedNumSubs)

      // Act
      const actualResult = await getSubmissionCount()

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedNumSubs)
    })

    it('should return DatabaseError when error occurs whilst retrieving submission count', async () => {
      // Arrange
      const execSpy = jest.fn().mockRejectedValueOnce(new Error('boom'))
      jest
        .spyOn(SubmissionModel, 'estimatedDocumentCount')
        .mockReturnValueOnce(({
          exec: execSpy,
        } as unknown) as Query<number>)

      // Act
      const actualResult = await getSubmissionCount()

      // Assert
      expect(execSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
    })
  })
})
