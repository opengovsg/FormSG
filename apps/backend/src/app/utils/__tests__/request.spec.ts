import { ObjectId } from 'bson'
import { X_FORMSG_CLIENT_VERSION } from 'formsg-shared/constants'
import { createRequest } from 'node-mocks-http'

import { createReqMeta } from 'src/app/utils/request'

describe('request', () => {
  describe('maskRefererHeaders', () => {
    it('should replace captured mrf keys with *', () => {
      // Arrange
      const mockObjectId = new ObjectId()
      const mockSubmissionId = new ObjectId()
      const req = createRequest({
        url: '/mockEndpoint',
        headers: {
          referer: `https://form.gov.sg/${mockObjectId}/edit/${mockSubmissionId}?key=aHf3OiQ64U6Sj%2FkSUlmJRsG0OsJdIayGrv0vjCxHk5Y%3D`,
          'cf-ray': 'cf-ray',
          'x-request-id': 'x-request-id',
        },
        baseUrl: '/mockBaseUrl',
        path: '/mockPath',
      })

      // Act
      const filteredReq = createReqMeta(req)

      // Assert
      expect(filteredReq).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({
            referer: expect.not.stringContaining(
              'aHf3OiQ64U6Sj%2FkSUlmJRsG0OsJdIayGrv0vjCxHk5Y%3D',
            ),
          }),
        }),
      )
      expect(filteredReq).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({
            referer: expect.stringContaining(mockObjectId.toHexString()),
          }),
        }),
      )
      expect(filteredReq).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({
            referer: expect.stringContaining(mockSubmissionId.toHexString()),
          }),
        }),
      )
    })
  })

  describe('createReqMeta', () => {
    it('should include the client version sent by the frontend', () => {
      // Arrange
      const req = createRequest({
        url: '/mockEndpoint',
        headers: { [X_FORMSG_CLIENT_VERSION]: '9.35.0' },
      })

      // Act
      const reqMeta = createReqMeta(req)

      // Assert
      expect(reqMeta.clientVersion).toBe('9.35.0')
    })
  })
})
