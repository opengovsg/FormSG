import MockDate from 'mockdate'
import mongoose from 'mongoose'

import getUserModel from 'src/app/models/user.server.model'
import { AgencyDocument, IUser, IUserSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

const User = getUserModel(mongoose)

const MOCKED_DATE = new Date(Date.now())
MockDate.set(MOCKED_DATE)

const AGENCY_DOMAIN = 'example.com'
const VALID_USER_EMAIL = `test@${AGENCY_DOMAIN}`
const VALID_CONTACT = '+6581234567'

const VALID_USER_EMAIL_2 = `test2@${AGENCY_DOMAIN}`
const VALID_CONTACT_2 = '+6581234568'

describe('User Model', () => {
  let agency: AgencyDocument

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    agency = await dbHandler.insertAgency({ mailDomain: AGENCY_DOMAIN })
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
      expect(saved.toObject()).toEqual(
        expect.objectContaining({
          ...validParams,
          updatedAt: MOCKED_DATE,
        }),
      )
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
      await expect(user.save()).rejects.toThrow(
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
      await expect(user.save()).rejects.toThrow('Agency is required')
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
      await expect(user.save()).rejects.toThrow(
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
      await expect(duplicateUser.save()).rejects.toThrow(
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
      await expect(user.save()).rejects.toThrow('Please enter your email')
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
      await expect(user.save()).rejects.toThrow(
        'This email is not a valid agency email',
      )
    })
  })

  describe('Methods', () => {
    describe('getPublicView', () => {
      it('should return public view of unpopulated user document successfully', async () => {
        // Arrange
        const unpopUser = await User.create({
          agency: agency._id,
          email: VALID_USER_EMAIL,
        })
        expect(unpopUser).toBeDefined()

        // Act
        const actual = unpopUser.getPublicView()

        // Assert
        // Since user document is unpopulated, should only contain agency id.
        expect(actual).toEqual({
          agency: agency._id,
        })
      })

      it('should return public view of populated user document successfully', async () => {
        // Arrange
        const user = await User.create({
          agency: agency._id,
          email: VALID_USER_EMAIL,
        })
        const populatedUser = await user
          .populate({ path: 'agency' })
          .execPopulate()
        expect(populatedUser).toBeDefined()

        // Act
        const actual = populatedUser.getPublicView()

        // Assert
        // Should hide all details about user except its agency.
        expect(JSON.stringify(actual)).toEqual(
          JSON.stringify({ agency: agency.getPublicView() }),
        )
      })
    })
  })

  describe('Statics', () => {
    describe('findContactNumbersByEmails', () => {
      it('should find contact number when a single email is given', async () => {
        await User.create({
          email: VALID_USER_EMAIL,
          agency: agency._id,
          contact: VALID_CONTACT,
        })

        const contacts = await User.findContactNumbersByEmails([
          VALID_USER_EMAIL,
        ])
        expect(contacts).toEqual([
          { email: VALID_USER_EMAIL, contact: VALID_CONTACT },
        ])
      })

      it('should find contact numbers when multiple emails are given', async () => {
        await User.create({
          email: VALID_USER_EMAIL,
          agency: agency._id,
          contact: VALID_CONTACT,
        })
        await User.create({
          email: VALID_USER_EMAIL_2,
          agency: agency._id,
          contact: VALID_CONTACT_2,
        })

        const contacts = await User.findContactNumbersByEmails([
          VALID_USER_EMAIL,
          VALID_USER_EMAIL_2,
        ])
        expect(contacts.length).toBe(2)
        expect(contacts).toContainEqual({
          email: VALID_USER_EMAIL,
          contact: VALID_CONTACT,
        })
        expect(contacts).toContainEqual({
          email: VALID_USER_EMAIL_2,
          contact: VALID_CONTACT_2,
        })
      })

      it('should ignore email addresses which do not exist in the collection', async () => {
        await User.create({
          email: VALID_USER_EMAIL,
          agency: agency._id,
          contact: VALID_CONTACT,
        })

        const contacts = await User.findContactNumbersByEmails([
          VALID_USER_EMAIL,
          'invalid@email.com',
        ])
        expect(contacts).toEqual([
          { email: VALID_USER_EMAIL, contact: VALID_CONTACT },
        ])
      })

      it('should return empty array when no given email addresses exist in the collection', async () => {
        await User.create({
          email: VALID_USER_EMAIL,
          agency: agency._id,
          contact: VALID_CONTACT,
        })

        const contacts = await User.findContactNumbersByEmails([
          'invalid@email.com',
        ])
        expect(contacts).toEqual([])
      })
    })

    describe('upsertUser', () => {
      it('should create new User document when user does not yet exist in the collection', async () => {
        // Arrange
        const validEmail = `test@${AGENCY_DOMAIN}`
        const initialUserCount = await User.countDocuments()
        expect(initialUserCount).toEqual(0)

        // Act
        const user = await User.upsertUser({
          agency: agency._id,
          email: validEmail,
        })

        // Assert
        const expectedPartialUser: Partial<IUserSchema> = {
          agency: agency.toObject(),
          email: validEmail,
          updatedAt: MOCKED_DATE,
        }
        // Should now have 1 user since user should be created.
        const afterUserCount = await User.countDocuments()
        expect(afterUserCount).toEqual(1)
        expect(user.toObject()).toEqual(
          expect.objectContaining(expectedPartialUser),
        )
      })

      it('should update user document with the new upserted parameters if the user already exists', async () => {
        // Arrange
        const validEmail = `test@${AGENCY_DOMAIN}`
        const initialUser = await User.create({
          agency: agency._id,
          email: validEmail,
        })
        // Should have the initial user.
        const initialUserCount = await User.countDocuments()
        expect(initialUserCount).toEqual(1)

        // Act
        // Upsert with updated lastAccessed.
        const upsertedUser = await User.upsertUser({
          agency: agency._id,
          email: validEmail,
          lastAccessed: MOCKED_DATE,
        })

        // Assert
        const expectedUser = {
          ...initialUser.toObject(),
          agency: agency.toObject(),
          lastAccessed: MOCKED_DATE,
        }
        // Should continue having 1 user since it is an upsert.
        const afterUserCount = await User.countDocuments()
        expect(afterUserCount).toEqual(1)
        expect(upsertedUser.toObject()).toEqual(expectedUser)
      })
    })
  })
})
