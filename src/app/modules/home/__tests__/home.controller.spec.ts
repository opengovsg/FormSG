import * as HomeController from 'src/app/modules/home/home.controller'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

describe('home.controller', () => {
  describe('home', () => {
    it('should render the home page without calling any downstream middleware', () => {
      const mockReq = expressHandler.mockRequest()
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      HomeController.home(mockReq, mockRes, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('index')
      expect(mockRes.render).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})
