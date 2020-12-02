import * as HomeController from 'src/app/modules/home/home.controller'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

describe('home.controller', () => {
  describe('home', () => {
    const mockReq = expressHandler.mockRequest()
    const mockRes = expressHandler.mockResponse()
    const mockNext = jest.fn()
    HomeController.home(mockReq, mockRes, mockNext)

    it('should call res.render with the correct arguments once', () => {
      expect(mockRes.render).toBeCalledWith('index')
      expect(mockRes.render).toHaveBeenCalledTimes(1)
    })
    it('should not call any downstream middleware', () => {
      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})
