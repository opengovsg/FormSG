import { DatabaseError } from '../../core/core.errors'
import * as FormErrors from '../../form/form.errors'
import { mapRouteError } from '../issue.util'

describe('issue.util', () => {
  describe('mapRouteError', () => {
    it('should return 404 for FormNotFoundError', () => {
      // Act
      const actualResult = mapRouteError(new FormErrors.FormNotFoundError())
      // Assert
      expect(actualResult.statusCode).toEqual(404)
    })
    it('should return 410 for FormDeletedError', () => {
      // Act
      const actualResult = mapRouteError(new FormErrors.FormDeletedError())
      // Assert
      expect(actualResult.statusCode).toEqual(410)
    })
    it('should return 404 for PrivateFormError', () => {
      // Act
      const actualResult = mapRouteError(
        new FormErrors.PrivateFormError('some message', 'some title'),
      )
      // Assert
      expect(actualResult.statusCode).toEqual(404)
    })
    it('should return 500 for DatabaseError', () => {
      // Act
      const actualResult = mapRouteError(new DatabaseError())
      // Assert
      expect(actualResult.statusCode).toEqual(500)
    })
    it('should return 500 for unknown error', () => {
      // Act
      const actualResult = mapRouteError(new Error('some error'))
      // Assert
      expect(actualResult.statusCode).toEqual(500)
    })
  })
})
