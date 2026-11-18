import {
  getSignedS3Url,
  s3Operations,
  sanitizePresignedUrlExpiry,
} from '../aws-s3'

describe('aws-s3', () => {
  describe('sanitizePresignedUrlExpiry', () => {
    it('should floor fractional expiry to a whole number of seconds', () => {
      expect(sanitizePresignedUrlExpiry(86392.123)).toEqual(86392)
    })

    it('should pass whole-second expiry through unchanged', () => {
      expect(sanitizePresignedUrlExpiry(86400)).toEqual(86400)
    })

    it('should clamp non-positive expiry to the SigV4 minimum of 1 second', () => {
      expect(sanitizePresignedUrlExpiry(0)).toEqual(1)
      expect(sanitizePresignedUrlExpiry(-30)).toEqual(1)
    })

    it('should clamp expiry to the SigV4 maximum of 7 days', () => {
      expect(sanitizePresignedUrlExpiry(604801)).toEqual(604800)
    })
  })

  describe('getSignedS3Url', () => {
    it('should request signing with a sanitized expiry', async () => {
      const getSignedUrlSpy = jest
        .spyOn(s3Operations, 'getSignedUrl')
        .mockResolvedValueOnce('https://signed.example.com')

      const params = { Bucket: 'some-bucket', Key: 'some-key' }
      const actual = await getSignedS3Url(params, 86392.123)

      expect(getSignedUrlSpy).toHaveBeenCalledWith(params, 86392)
      expect(actual).toEqual('https://signed.example.com')
    })
  })
})
