import { saveUserToLocalStorage, STORAGE_USER_KEY, User } from '../UserService'

describe('UserService', () => {
  describe('saveUserToLocalStorage', () => {
    it('should successfully save given user to localStorage', () => {
      // Arrange
      const mockUser: User = {
        _id: 'some id' as User['_id'],
        email: 'mock@example.com',
        agency: {
          _id: 'some agency id' as User['agency']['_id'],
          emailDomain: ['example.com'],
          fullName: 'Example Agency',
          logo: 'path/to/agency/logo',
          shortName: 'e',
        },
        created: 'some created date',
        lastAccessed: 'some last accessed date',
        updatedAt: 'some last updated at date',
      }

      // Act
      saveUserToLocalStorage(mockUser)

      // Assert
      expect(localStorage.setItem).toHaveBeenLastCalledWith(
        STORAGE_USER_KEY,
        // Should be stringified.
        JSON.stringify(mockUser),
      )
    })
  })
})
