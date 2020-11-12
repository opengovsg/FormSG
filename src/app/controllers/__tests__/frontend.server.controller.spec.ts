import { StatusCodes } from 'http-status-codes'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import frontendServerController from '../frontend.server.controller'

describe('frontend.server.controller', () => {
  afterEach(() => jest.clearAllMocks())
  const mockRes = expressHandler.mockResponse()
  const mockReq = {
    app: {
      locals: {
        GATrackingID: 'abc',
        appName: 'xyz',
        environment: 'efg',
      },
    },
    query: {
      redirectPath: 'formId?fieldId1=abc&fieldId2=xyz',
    },
  }
  describe('datalayer', () => {
    it('should return the correct value', () => {
      frontendServerController.datalayer(mockReq, mockRes)
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("'app_name': 'xyz'"),
      )
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("'config', 'abc'"),
      )
    })

    it('should call type and status correctly', () => {
      frontendServerController.datalayer(mockReq, mockRes)
      expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
    })
  })

  describe('environment', () => {
    it('should return the correct environment', () => {
      frontendServerController.environment(mockReq, mockRes)
      expect(mockRes.send).toHaveBeenCalledWith('efg')
    })

    it('should call type and status correctly', () => {
      frontendServerController.environment(mockReq, mockRes)
      expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
    })
  })

  describe('redirectLayer', () => {
    it('should not convert & character to html encoding', () => {
      const redirectString =
        'window.location.hash = "#!/formId?fieldId1=abc&fieldId2=xyz"'
      frontendServerController.redirectLayer(mockReq, mockRes)
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining(redirectString),
      )
    })

    it('should convert other special characters to html encoding', () => {
      mockReq.query.redirectPath = 'formId?fieldId1=abc&fieldId2=<>\'"'

      const redirectString =
        'window.location.hash = "#!/formId?fieldId1=abc&fieldId2=&lt;&gt;&#39;&#34;'
      frontendServerController.redirectLayer(mockReq, mockRes)
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining(redirectString),
      )
    })

    it('should call type and status correctly', () => {
      frontendServerController.redirectLayer(mockReq, mockRes)
      expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
    })
  })
})
