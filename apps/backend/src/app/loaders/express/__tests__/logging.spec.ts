import { ObjectId } from 'bson'

import { pickLoggedHeaders } from 'src/app/loaders/express/logging'

describe('logging', () => {
  describe('pickLoggedHeaders', () => {
    it('should drop the authorization header', () => {
      const picked = pickLoggedHeaders({
        authorization: 'Bearer formsg_v1_5f7b1b1b1b1b1b1b1b1b1b1b_c2VjcmV0',
        host: 'form.gov.sg',
      })

      expect(picked).not.toHaveProperty('authorization')
      expect(picked).toEqual({ host: 'form.gov.sg' })
    })

    it('should drop the cookie header', () => {
      const picked = pickLoggedHeaders({
        cookie: 'connect.sid=s%3Asome-session-id',
        host: 'form.gov.sg',
      })

      expect(picked).not.toHaveProperty('cookie')
    })

    it('should drop unknown headers rather than pass them through', () => {
      const picked = pickLoggedHeaders({
        'x-some-header-nobody-thought-of': 'super-secret-value',
        'stripe-signature': 't=1,v1=deadbeef',
        host: 'form.gov.sg',
      })

      expect(picked).toEqual({ host: 'form.gov.sg' })
    })

    it('should keep headers that are useful for debugging', () => {
      const headers = {
        'cf-connecting-ip': '1.2.3.4',
        'cf-ray': 'some-ray-id',
        'content-type': 'application/json',
        host: 'form.gov.sg',
        'user-agent': 'Mozilla/5.0',
        'x-request-id': 'some-request-id',
      }

      expect(pickLoggedHeaders(headers)).toEqual(headers)
    })

    it('should strip the mrf key from the referer it keeps', () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const secret = 'aHf3OiQ64U6Sj%2FkSUlmJRsG0OsJdIayGrv0vjCxHk5Y%3D'

      const picked = pickLoggedHeaders({
        referer: `https://form.gov.sg/${formId}/edit/${submissionId}?key=${secret}`,
      })

      expect(picked.referer).toBe(
        `https://form.gov.sg/${formId}/edit/${submissionId}`,
      )
    })

    it('should strip the mrf key even when another param follows it', () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const secret = 'aHf3OiQ64U6Sj%2FkSUlmJRsG0OsJdIayGrv0vjCxHk5Y%3D'

      const picked = pickLoggedHeaders({
        referer: `https://form.gov.sg/${formId}/edit/${submissionId}?key=${secret}&step=2`,
      })

      expect(picked.referer).not.toContain(secret)
      expect(picked.referer).toBe(
        `https://form.gov.sg/${formId}/edit/${submissionId}`,
      )
    })

    it('should leave a referer without a query string alone', () => {
      const picked = pickLoggedHeaders({
        referer: 'https://form.gov.sg/dashboard',
      })

      expect(picked.referer).toBe('https://form.gov.sg/dashboard')
    })

    it('should not mutate the headers it is given', () => {
      const formId = new ObjectId()
      const submissionId = new ObjectId()
      const secret = 'aHf3OiQ64U6Sj%2FkSUlmJRsG0OsJdIayGrv0vjCxHk5Y%3D'
      const referer = `https://form.gov.sg/${formId}/edit/${submissionId}?key=${secret}`
      const headers = { referer, authorization: 'Bearer token' }

      pickLoggedHeaders(headers)

      expect(headers.referer).toBe(referer)
      expect(headers.authorization).toBe('Bearer token')
    })
  })
})
