import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { IAgencySchema } from 'src/types'

import { InvalidDomainError } from '../auth.errors'
import * as AuthService from '../auth.service'

const VALID_EMAIL_DOMAIN = 'test.gov.sg'

describe('auth.service', () => {
  let defaultAgency: IAgencySchema

  beforeAll(async () => {
    await dbHandler.connect()
    defaultAgency = await dbHandler.insertDefaultAgency({
      mailDomain: VALID_EMAIL_DOMAIN,
    })
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('getAgencyWithEmail', () => {
    it('should retrieve agency successfully when email is valid and domain is in Agency collection', async () => {
      // Arrange
      const validEmail = `valid@${VALID_EMAIL_DOMAIN}`

      // Act
      const actual = await AuthService.getAgencyWithEmail(validEmail)

      // Assert
      expect(actual.toObject()).toEqual(defaultAgency.toObject())
    })

    it('should throw InvalidDomainError when email is invalid', async () => {
      // Arrange
      const notAnEmail = 'not an email'

      // Act
      const actualPromise = AuthService.getAgencyWithEmail(notAnEmail)

      // Assert
      await expect(actualPromise).rejects.toThrowError(InvalidDomainError)
    })

    it('should throw InvalidDomainError when valid email domain is not in Agency collection', async () => {
      // Arrange
      const invalidEmail = 'invalid@example.com'

      // Act
      const actualPromise = AuthService.getAgencyWithEmail(invalidEmail)

      // Assert
      await expect(actualPromise).rejects.toThrowError(InvalidDomainError)
    })
  })
})
