import { times } from 'lodash'
import mongoose, { Query } from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import getFormStatisticsTotalModel from 'src/app/models/form_statistics_total.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import getUserModel from 'src/app/models/user.server.model'
import {
  IAgencySchema,
  IFormStatisticsTotalSchema,
  ISubmissionSchema,
  SubmissionType,
} from 'src/types'

import { DatabaseError } from '../../core/core.errors'
import { MIN_SUB_COUNT } from '../analytics.constants'
import {
  getFormCountWithStatsCollection,
  getFormCountWithSubmissionCollection,
  getUserCount,
} from '../analytics.service'

const FormStatsModel = getFormStatisticsTotalModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)
const UserModel = getUserModel(mongoose)

describe('analytics.service', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('getFormCountWithStatsCollection', () => {
    it('should return the number of forms with more than 10 submissions when such forms exists', async () => {
      // Arrange
      // Number of submissions per form
      const formCounts = [12, 10, 4]
      const submissionPromises: Promise<IFormStatisticsTotalSchema>[] = []
      formCounts.forEach((count) => {
        submissionPromises.push(
          FormStatsModel.create({
            formId: mongoose.Types.ObjectId(),
            totalCount: count,
            lastSubmission: new Date(),
          }),
        )
      })
      await Promise.all(submissionPromises)

      // Act
      const actualResult = await getFormCountWithStatsCollection()

      // Assert
      const expectedResult = formCounts.filter((fc) => fc > MIN_SUB_COUNT)
        .length
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedResult)
    })

    it('should return 0 when no forms have above 10 submissions', async () => {
      // Arrange
      // Number of submissions per form
      const formCounts = [1, 2]
      const submissionPromises: Promise<IFormStatisticsTotalSchema>[] = []
      formCounts.forEach((count) => {
        submissionPromises.push(
          FormStatsModel.create({
            formId: mongoose.Types.ObjectId(),
            totalCount: count,
            lastSubmission: new Date(),
          }),
        )
      })
      await Promise.all(submissionPromises)

      // Act
      const actualResult = await getFormCountWithStatsCollection()

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(0)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      const aggregateSpy = jest
        .spyOn(FormStatsModel, 'aggregateFormCount')
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const actualResult = await getFormCountWithStatsCollection()

      // Assert
      expect(aggregateSpy).toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
    })
  })

  describe('getFormCountWithSubmissionCollection', () => {
    it('should return the number of forms with more than 10 submissions when such forms exists', async () => {
      // Arrange
      const formCounts = [12, 10, 4]
      const submissionPromises: Promise<ISubmissionSchema>[] = []
      formCounts.forEach((count) => {
        const formId = mongoose.Types.ObjectId()
        times(count, () =>
          submissionPromises.push(
            SubmissionModel.create({
              form: formId,
              myInfoFields: [],
              submissionType: SubmissionType.Email,
              responseHash: 'hash',
              responseSalt: 'salt',
            }),
          ),
        )
      })
      await Promise.all(submissionPromises)

      // Act
      const actualResult = await getFormCountWithSubmissionCollection()

      // Assert
      const expectedResult = formCounts.filter((fc) => fc > MIN_SUB_COUNT)
        .length
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedResult)
    })

    it('should return 0 when no forms have above 10 submissions', async () => {
      // Arrange
      const formCounts = [1, 2]
      const submissionPromises: Promise<ISubmissionSchema>[] = []
      formCounts.forEach((count) => {
        const formId = mongoose.Types.ObjectId()
        times(count, () =>
          submissionPromises.push(
            SubmissionModel.create({
              form: formId,
              myInfoFields: [],
              submissionType: SubmissionType.Email,
              responseHash: 'hash',
              responseSalt: 'salt',
            }),
          ),
        )
      })
      await Promise.all(submissionPromises)

      // Act
      const actualResult = await getFormCountWithSubmissionCollection()

      // Assert
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(0)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      const aggregateSpy = jest
        .spyOn(SubmissionModel, 'findFormsWithSubsAbove')
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const actualResult = await getFormCountWithSubmissionCollection()

      // Assert
      expect(aggregateSpy).toHaveBeenCalled()
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toEqual(new DatabaseError())
    })
  })

  describe('getUserCount', () => {
    const VALID_DOMAIN = 'example.com'
    let testAgency: IAgencySchema

    beforeEach(async () => {
      testAgency = await dbHandler.insertDefaultAgency({
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
})
