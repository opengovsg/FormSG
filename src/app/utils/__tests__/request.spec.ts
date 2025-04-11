import { ObjectId } from 'bson'
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
})
