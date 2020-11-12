import { StatusCodes } from 'http-status-codes'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import frontendServerController from '../frontend.server.controller'

describe('frontend.server.controller', () => {
  afterEach(() => jest.clearAllMocks())
  const mockRes = expressHandler.mockResponse()

  it('should return the correct response when the request is valid', () => {
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
    // datalayer
    frontendServerController.datalayer(mockReq, mockRes)
    expect(mockRes.send).toHaveBeenCalledWith(
      expect.stringContaining("'app_name': 'xyz'"),
    )
    expect(mockRes.send).toHaveBeenCalledWith(
      expect.stringContaining("'config', 'abc'"),
    )
    expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)

    // environment
    frontendServerController.environment(mockReq, mockRes)
    expect(mockRes.send).toHaveBeenCalledWith('efg')
    expect(mockRes.type).toHaveBeenCalledWith('text/javascript')
    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)

    //redirectLayer
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
    const mockReq = undefined
    frontendServerController.datalayer(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    frontendServerController.environment(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    frontendServerController.redirectLayer(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
  })
})
