import expressHandler from '__tests__/unit/backend/helpers/jest-express'

import { withUserAuthentication } from '../auth.middlewares'

describe('auth.middlewares', () => {
  describe('withUserAuthentication', () => {
    it('should pass on to the next handler if authenticated', async () => {
      // Arrange
      const mockReqAuthed = expressHandler.mockRequest({
        session: {
          user: {
            _id: 'exists',
          },
        },
      })

      const mockRes = expressHandler.mockResponse()
      const nextSpy = jest.fn()

      // Act
      await withUserAuthentication(mockReqAuthed, mockRes, nextSpy)

      // Assert
      expect(nextSpy).toHaveBeenCalled()
    })

    it('should return 401 if not authenticated', async () => {
      // Arrange
      const mockReqNotAuthed = expressHandler.mockRequest()
      const mockRes = expressHandler.mockResponse()
      const nextSpy = jest.fn()

      // Act
      await withUserAuthentication(mockReqNotAuthed, mockRes, nextSpy)

      // Assert
      expect(nextSpy).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User is unauthorized.',
      })
    })
  })
})
