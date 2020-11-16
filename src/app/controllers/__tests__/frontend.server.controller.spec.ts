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
  const mockBadReq = {
    get: jest.fn().mockImplementation(() => 'abc'),
  }
  describe('datalayer', () => {
    it('should return the correct response when the request is valid', () => {
      frontendServerController.datalayer(mockReq, mockRes)
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("'app_name': 'xyz'"),
      )
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("'config', 'abc'"),
      )
      expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
    })
    it('should return BAD_REQUEST if the request is not valid', () => {
      frontendServerController.datalayer(mockBadReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })
  })

  describe('environment', () => {
    it('should return the correct response when the request is valid', () => {
      frontendServerController.environment(mockReq, mockRes)
      expect(mockRes.send).toHaveBeenCalledWith('efg')
      expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
    })
    it('should return BAD_REQUEST if the request is not valid', () => {
      frontendServerController.environment(mockBadReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })
  })

  describe('redirectLayer', () => {
    it('should return the correct response when the request is valid', () => {
      const mockReqModified = {
        // Test other special characters
        query: {
          redirectPath: 'formId?fieldId1=abc&fieldId2=<>\'"',
        },
      }
      const redirectString =
        'window.location.hash = "#!/formId?fieldId1=abc&fieldId2=&lt;&gt;&#39;&#34;'
      // Note this is different from mockReqModified.query.redirectPath as
      // there are html-encoded characters
      frontendServerController.redirectLayer(mockReqModified, mockRes)
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining(redirectString),
      )
      expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
    })
    it('should return BAD_REQUEST if the request is not valid', () => {
      frontendServerController.redirectLayer(mockBadReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })
  })
})
