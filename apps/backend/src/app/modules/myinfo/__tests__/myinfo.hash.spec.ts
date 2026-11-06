import bcrypt from 'bcrypt'

import { compareMyInfoValue, hashMyInfoValue } from '../myinfo.hash'

describe('myinfo.hash', () => {
  describe('hashMyInfoValue', () => {
    it('should return a prefixed HMAC that does not contain the value', () => {
      const hash = hashMyInfoValue('name', 'TAN AH KOW')

      expect(hash).toMatch(/^hmac1:[0-9a-f]{64}$/)
      expect(hash).not.toContain('TAN AH KOW')
    })

    it('should be deterministic for the same key and value', () => {
      expect(hashMyInfoValue('name', 'TAN AH KOW')).toEqual(
        hashMyInfoValue('name', 'TAN AH KOW'),
      )
    })

    it('should differ for the same value under a different key', () => {
      expect(hashMyInfoValue('name', 'TAN AH KOW')).not.toEqual(
        hashMyInfoValue('aliasname', 'TAN AH KOW'),
      )
    })
  })

  describe('compareMyInfoValue', () => {
    it('should match an HMAC hash of the same key and value', async () => {
      const hash = hashMyInfoValue('name', 'TAN AH KOW')

      await expect(
        compareMyInfoValue('name', 'TAN AH KOW', hash),
      ).resolves.toBe(true)
    })

    it('should reject an HMAC hash of a different value', async () => {
      const hash = hashMyInfoValue('name', 'TAN AH KOW')

      await expect(
        compareMyInfoValue('name', 'LIM AH KOW', hash),
      ).resolves.toBe(false)
    })

    it('should reject an HMAC hash stored under a different key', async () => {
      const hash = hashMyInfoValue('aliasname', 'TAN AH KOW')

      await expect(
        compareMyInfoValue('name', 'TAN AH KOW', hash),
      ).resolves.toBe(false)
    })

    it('should reject a malformed HMAC hash', async () => {
      await expect(
        compareMyInfoValue('name', 'TAN AH KOW', 'hmac1:not-hex'),
      ).resolves.toBe(false)
    })

    it('should match a legacy bcrypt hash of the same value', async () => {
      const hash = await bcrypt.hash('TAN AH KOW', 4)

      await expect(
        compareMyInfoValue('name', 'TAN AH KOW', hash),
      ).resolves.toBe(true)
    })

    it('should reject a legacy bcrypt hash of a different value', async () => {
      const hash = await bcrypt.hash('TAN AH KOW', 4)

      await expect(
        compareMyInfoValue('name', 'LIM AH KOW', hash),
      ).resolves.toBe(false)
    })
  })
})
