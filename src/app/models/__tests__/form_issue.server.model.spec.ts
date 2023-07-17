import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson-ext'
import { omit } from 'lodash'
import mongoose from 'mongoose'

import { IFormIssue } from 'src/types'

import getFormIssueModel from '../form_issue.server.model'

const FormIssueModel = getFormIssueModel(mongoose)

describe('form_issue.server.model', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    const DEFAULT_PARAMS: IFormIssue = {
      formId: new ObjectId(),
      issue: 'I am 200 years old but your age drop down is only cap at 100',
      email: 'email@me.com',
    }

    it('should create and save successfully', async () => {
      // Act
      const actual = await FormIssueModel.create(DEFAULT_PARAMS)

      // Assert
      expect(actual).toEqual(
        expect.objectContaining({
          ...DEFAULT_PARAMS,
          created: expect.any(Date),
          lastModified: expect.any(Date),
        }),
      )
    })

    it('should save successfully when email param is missing', async () => {
      // Arrange
      const paramsWithoutEmail = omit(DEFAULT_PARAMS, 'email')

      // Act
      const actual = await FormIssueModel.create(paramsWithoutEmail)

      // Assert
      expect(actual).toEqual(
        expect.objectContaining({
          ...paramsWithoutEmail,
          created: expect.any(Date),
          lastModified: expect.any(Date),
        }),
      )
    })

    it('should throw validation error when issue param is missing', async () => {
      // Arrange
      const paramsWithoutIssue = omit(DEFAULT_PARAMS, 'issue')

      // Act
      const actual = new FormIssueModel(paramsWithoutIssue).save()

      // Assert
      await expect(actual).rejects.toThrow(mongoose.Error.ValidationError)
    })
  })
})
