import * as E from 'fp-ts/lib/Either'
import { times } from 'lodash'
import mongoose, { Query } from 'mongoose'

import getAgencyModel from 'src/app/models/agency.server.model'
import getFormModel from 'src/app/models/form.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import getUserModel from 'src/app/models/user.server.model'
import { IAgencySchema, IUserSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormResponseMode, SubmissionType } from '../../../../../shared/types'
import { DatabaseError } from '../../core/core.errors'
import {
  getAgencyCount,
  getFormCount,
  getSubmissionCount,
  getUserCount,
} from '../analytics.service'

import { AnalyticsTestError } from './analytics.error'

const FormModel = getFormModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)
const UserModel = getUserModel(mongoose)
const AgencyModel = getAgencyModel(mongoose)

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
      const actualTE = getFormCount()
      const actualE = await actualTE()
      // Assert
      if (E.isLeft(actualE)) throw new AnalyticsTestError()
      expect(actualE.right).toEqual(0)
    })

    it('should return number of forms in the database', async () => {
      // Arrange
      const expectedNum = 10
      const formPromises = times(expectedNum, () =>
        FormModel.create({
          admin: testUser._id,
          title: 'Test form',
          responseMode: FormResponseMode.Email,
          emails: ['a@abc.com'],
        }),
      )
      await Promise.all(formPromises)
      const initialCount = await FormModel.estimatedDocumentCount()
      expect(initialCount).toEqual(expectedNum)

      // Act
      const actualTE = await getFormCount()
      const actualE = await actualTE()
      // Assert
      if (E.isLeft(actualE)) throw new AnalyticsTestError()
      expect(actualE.right).toEqual(expectedNum)
    })

    it('should return DatabaseError when error occurs whilst retrieving form count', async () => {
      // Arrange
      const execSpy = jest.fn().mockRejectedValueOnce(new Error('boom'))
      jest.spyOn(FormModel, 'estimatedDocumentCount').mockReturnValueOnce({
        exec: execSpy,
      } as unknown as Query<number, any>)

      // Act
      const actualTE = await getFormCount()
      const actualE = await actualTE()
      // Assert
      expect(execSpy).toHaveBeenCalledTimes(1)
      if (E.isRight(actualE)) throw new AnalyticsTestError()
      expect(actualE.left instanceof DatabaseError).toBe(true)
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
      const actualTE = await getUserCount()
      const actualE = await actualTE()
      // Assert
      if (E.isLeft(actualE)) throw new AnalyticsTestError()
      expect(actualE.right).toEqual(0)
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
      const actualTE = await getUserCount()
      const actualE = await actualTE()
      // Assert
      if (E.isLeft(actualE)) throw new AnalyticsTestError()
      expect(actualE.right).toEqual(expectedNumUsers)
    })

    it('should return DatabaseError when error occurs whilst retrieving user count', async () => {
      // Arrange
      const execSpy = jest.fn().mockRejectedValueOnce(new Error('boom'))
      jest.spyOn(UserModel, 'estimatedDocumentCount').mockReturnValueOnce({
        exec: execSpy,
      } as unknown as Query<number, any>)

      // Act
      const actualTE = await getUserCount()
      const actualE = await actualTE()
      // Assert
      expect(execSpy).toHaveBeenCalledTimes(1)
      if (E.isRight(actualE)) throw new AnalyticsTestError()
      expect(actualE.left instanceof DatabaseError).toBe(true)
    })
  })

  describe('getSubmissionCount', () => {
    it('should return 0 when there are no submissions in the database', async () => {
      // Arrange
      const initialSubCount = await SubmissionModel.estimatedDocumentCount()
      expect(initialSubCount).toEqual(0)

      // Act
      const actualTE = await getSubmissionCount()
      const actualE = await actualTE()

      // Assert
      if (E.isLeft(actualE)) throw new AnalyticsTestError()
      expect(actualE.right).toEqual(0)
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
      const initialSubCount = await SubmissionModel.estimatedDocumentCount()
      expect(initialSubCount).toEqual(expectedNumSubs)

      // Act
      const actualTE = await getSubmissionCount()
      const actualE = await actualTE()

      // Assert
      if (E.isLeft(actualE)) throw new AnalyticsTestError()
      expect(actualE.right).toEqual(expectedNumSubs)
    })

    it('should return DatabaseError when error occurs whilst retrieving submission count', async () => {
      // Arrange
      const execSpy = jest.fn().mockRejectedValueOnce(new Error('boom'))
      jest
        .spyOn(SubmissionModel, 'estimatedDocumentCount')
        .mockReturnValueOnce({
          exec: execSpy,
        } as unknown as Query<number, any>)

      // Act
      const actualTE = await getSubmissionCount()
      const actualE = await actualTE()

      // Assert
      expect(execSpy).toHaveBeenCalledTimes(1)
      if (E.isRight(actualE)) throw new AnalyticsTestError()
      expect(actualE.left instanceof DatabaseError).toBe(true)
    })
  })

  describe('getAgencyCount', () => {
    it('should return 0 when there are no agencies in the database', async () => {
      // Arrange
      const initialAgencyCount = await AgencyModel.estimatedDocumentCount()
      expect(initialAgencyCount).toEqual(0)

      // Act
      const actualTE = await getAgencyCount()
      const actualE = await actualTE()

      // Assert
      if (E.isLeft(actualE)) throw new AnalyticsTestError()
      expect(actualE.right).toEqual(0)
    })

    it('should return number of agencies in the database', async () => {
      // Arrange
      const expectedNumAgencies = 10
      const agencyPromises = times(expectedNumAgencies, () =>
        AgencyModel.create({
          shortName: 'govtech',
          fullName: 'Government Technology Agency',
          emailDomain: 'open.gov.sg',
          logo: 'logo',
        }),
      )
      await Promise.all(agencyPromises)
      const initialAgencyCount = await AgencyModel.estimatedDocumentCount()
      expect(initialAgencyCount).toEqual(expectedNumAgencies)

      // Act
      const actualTE = await getAgencyCount()
      const actualE = await actualTE()

      // Assert
      if (E.isLeft(actualE)) throw new AnalyticsTestError()
      expect(actualE.right).toEqual(expectedNumAgencies)
    })

    it('should return DatabaseError when error occurs whilst retrieving agency count', async () => {
      // Arrange
      const execSpy = jest.fn().mockRejectedValueOnce(new Error('boom'))
      jest.spyOn(AgencyModel, 'estimatedDocumentCount').mockReturnValueOnce({
        exec: execSpy,
      } as unknown as Query<number, any>)

      // Act
      const actualTE = await getAgencyCount()
      const actualE = await actualTE()

      // Assert
      expect(execSpy).toHaveBeenCalledTimes(1)
      if (E.isRight(actualE)) throw new AnalyticsTestError()
      expect(actualE.left instanceof DatabaseError).toBe(true)
    })
  })
})
