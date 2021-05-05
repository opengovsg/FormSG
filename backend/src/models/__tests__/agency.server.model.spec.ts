import { pick } from 'lodash'
import mongoose from 'mongoose'

import getAgencyModel, {
  AGENCY_PUBLIC_FIELDS,
} from 'models/agency.server.model'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

const Agency = getAgencyModel(mongoose)

describe('agency.server.model', () => {
  // TODO(#102): Add tests for form schema validation.

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Methods', () => {
    describe('getPublicView', () => {
      it('should return public view of agency document successfully', async () => {
        // Arrange
        const agency = await Agency.create({
          emailDomain: ['test@example.com'],
          fullName: 'Test Agency of Test',
          shortName: 'Test',
          logo: 'some path to logo',
        })
        expect(agency).toBeDefined()

        // Act
        const actual = agency.getPublicView()

        // Assert
        expect(actual).toEqual(pick(agency, AGENCY_PUBLIC_FIELDS))
      })
    })
  })
})
