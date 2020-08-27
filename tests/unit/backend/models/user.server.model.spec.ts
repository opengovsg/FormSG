import { omit } from 'lodash'
import mongoose from 'mongoose'

import getUserModel from 'src/app/models/user.server.model'
import { IAgencySchema, IUser } from 'src/types'

import dbHandler from '../helpers/jest-db'

const User = getUserModel(mongoose)

const AGENCY_DOMAIN = 'example.com'
const VALID_USER_EMAIL = `test@${AGENCY_DOMAIN}`
// Obtained from Twilio's
// https://www.twilio.com/blog/2018/04/twilio-test-credentials-magic-numbers.html
const VALID_CONTACT = '+15005550006'

describe('User Model', () => {
  let agency: IAgencySchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    agency = await dbHandler.insertDefaultAgency({ mailDomain: AGENCY_DOMAIN })
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    it('should create and save successfully', async () => {
      // Arrange
      const validParams: IUser = {
        email: VALID_USER_EMAIL,
        agency: agency._id,
        contact: VALID_CONTACT,
      }

      // Act
      const saved = await User.create(validParams)

      // Assert
      // All fields should exist
      // Object Id should be defined when successfully saved to MongoDB.
      expect(saved._id).toBeDefined()
      expect(saved.created).toBeInstanceOf(Date)
      // Retrieve object and compare to params, remove indeterministic keys
      const actualSavedObject = omit(saved.toObject(), [
        '_id',
        'created',
        '__v',
      ])
      expect(actualSavedObject).toEqual(validParams)
    })

    it('should throw error when contact number is invalid', async () => {
      const invalidNumber = 'not a number'
      const invalidParams: IUser = {
        email: VALID_USER_EMAIL,
        agency: agency._id,
        contact: invalidNumber,
      }

      // Act
      const user = new User(invalidParams)

      // Assert
      await expect(user.save()).rejects.toThrowError(
        `${invalidNumber} is not a valid mobile number`,
      )
    })

    it('should throw error when agency reference is missing', async () => {
      // Act
      const user = new User({
        email: VALID_USER_EMAIL,
        // Note no agency reference.
        contact: VALID_CONTACT,
      })

      // Assert
      await expect(user.save()).rejects.toThrowError('Agency is required')
    })

    it('should throw error when email is not a valid agency', async () => {
      const invalidAgencyDomain = 'example.net'
      const invalidParams: IUser = {
        email: `test@${invalidAgencyDomain}`,
        agency: agency._id,
        contact: VALID_CONTACT,
      }

      // Act
      const user = new User(invalidParams)

      // Assert
      await expect(user.save()).rejects.toThrowError(
        'This email is not a valid agency email',
      )
    })

    it('should throw error when email is not unique', async () => {
      // Arrange
      // Create a user first
      const validParams: IUser = {
        email: VALID_USER_EMAIL,
        agency: agency._id,
        contact: VALID_CONTACT,
      }
      const saved = await User.create(validParams)
      expect(saved._id).toBeDefined()

      // Create user with same email again
      // Act
      const duplicateUser = new User(validParams)

      // Assert
      await expect(duplicateUser.save()).rejects.toThrowError(
        'Account already exists with this email',
      )
    })

    it('should throw error when email is missing', async () => {
      // Act + Assert
      const user = new User({
        // Note missing email
        agency: agency._id,
        contact: VALID_CONTACT,
      })

      // Assert
      await expect(user.save()).rejects.toThrowError('Please enter your email')
    })

    it('should throw error when email is invalid', async () => {
      const invalidParams: IUser = {
        email: 'not an email',
        agency: agency._id,
        contact: VALID_CONTACT,
      }

      // Act
      const user = new User(invalidParams)

      // Assert
      await expect(user.save()).rejects.toThrowError(
        'This email is not a valid agency email',
      )
    })
  })
})
